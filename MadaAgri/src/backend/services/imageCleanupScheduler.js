const cron = require('node-cron');
const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Image cleanup scheduler
 * Deletes old images from Cloudinary and database
 * Runs daily at 2 AM
 */
class ImageCleanupScheduler {
  static isRunning = false;
  static readonly = {
    RETENTION_DAYS: 7,
    CLOUDINARY_DELETE_BATCH_SIZE: 50,
  };

  /**
   * Initialize scheduler
   */
  static start() {
    if (this.isRunning) {
      logger.warn('[ImageCleanup] Scheduler already running');
      return;
    }

    // Run at 2 AM every day (cron: 0 2 * * *)
    this.job = cron.schedule('0 2 * * *', async () => {
      await this.cleanup();
    });

    this.isRunning = true;
    logger.info('[ImageCleanup] Scheduler started');
  }

  /**
   * Stop scheduler
   */
  static stop() {
    if (this.job) {
      this.job.stop();
      this.isRunning = false;
      logger.info('[ImageCleanup] Scheduler stopped');
    }
  }

  /**
   * Execute cleanup
   */
  static async cleanup() {
    const startTime = Date.now();

    try {
      logger.info('[ImageCleanup] Starting cleanup', {
        retentionDays: this.readonly.RETENTION_DAYS,
      });

      // Find old images
      const [oldImages] = await pool.query(
        `SELECT id, image_url FROM crop_analysis_results
        WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
        AND image_url IS NOT NULL
        LIMIT ?`,
        [this.readonly.RETENTION_DAYS, this.readonly.CLOUDINARY_DELETE_BATCH_SIZE]
      );

      if (oldImages.length === 0) {
        logger.info('[ImageCleanup] No images to clean up');
        return;
      }

      logger.info('[ImageCleanup] Found images to clean', {
        count: oldImages.length,
      });

      // Extract Cloudinary public IDs and delete from Cloudinary
      const cloudinaryIds = oldImages
        .map(img => this.extractCloudinaryPublicId(img.image_url))
        .filter(id => id !== null);

      if (cloudinaryIds.length > 0) {
        await this.deleteFromCloudinary(cloudinaryIds);
      }

      // Delete from database
      const imageIds = oldImages.map(img => img.id);
      await this.deleteFromDatabase(imageIds);

      const duration = Date.now() - startTime;

      logger.info('[ImageCleanup] Cleanup completed', {
        imagesDeleted: oldImages.length,
        cloudinaryDeleted: cloudinaryIds.length,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('[ImageCleanup] Cleanup failed', {
        error: error.message,
        durationMs: Date.now() - startTime,
      });
    }
  }

  /**
   * Extract Cloudinary public ID from URL
   * Format: https://res.cloudinary.com/ACCOUNT/image/upload/v1234/PUBLIC_ID.ext
   */
  static extractCloudinaryPublicId(imageUrl) {
    try {
      if (!imageUrl || !imageUrl.includes('cloudinary')) {
        return null;
      }

      const match = imageUrl.match(/upload\/(?:v\d+\/)?([^/.]+)/);
      return match ? match[1] : null;
    } catch (error) {
      logger.error('[ImageCleanup] Failed to extract Cloudinary ID', {
        url: imageUrl,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Delete images from Cloudinary
   */
  static async deleteFromCloudinary(publicIds) {
    try {
      // Lazy require cloudinary config
      const cloudinary = require('cloudinary').v2;
      const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

      if (!CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
        logger.warn('[ImageCleanup] Cloudinary API credentials not configured');
        return;
      }

      cloudinary.config({
        cloud_name: CLOUDINARY_CLOUD_NAME,
        api_key: CLOUDINARY_API_KEY,
        api_secret: CLOUDINARY_API_SECRET,
      });

      const results = await Promise.allSettled(
        publicIds.map(id =>
          cloudinary.uploader.destroy(id, { invalidate: true })
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      logger.info('[ImageCleanup] Cloudinary deletion complete', {
        requested: publicIds.length,
        successful,
        failed,
      });
    } catch (error) {
      logger.error('[ImageCleanup] Cloudinary deletion error', {
        error: error.message,
        count: publicIds.length,
      });
    }
  }

  /**
   * Delete from database
   */
  static async deleteFromDatabase(imageIds) {
    try {
      const placeholders = imageIds.map(() => '?').join(',');

      const [result] = await pool.query(
        `DELETE FROM crop_analysis_results
        WHERE id IN (${placeholders})`,
        imageIds
      );

      logger.info('[ImageCleanup] Database deletion complete', {
        deleted: result.affectedRows,
      });
    } catch (error) {
      logger.error('[ImageCleanup] Database deletion error', {
        error: error.message,
        count: imageIds.length,
      });
    }
  }

  /**
   * Manual trigger for cleanup
   */
  static async triggerNow() {
    if (this.isRunning) {
      logger.info('[ImageCleanup] Manual trigger executed');
      return await this.cleanup();
    } else {
      logger.warn('[ImageCleanup] Scheduler not running');
    }
  }
}

module.exports = ImageCleanupScheduler;
