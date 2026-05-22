const express = require('express');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const { upload: imageUpload, videoUpload, voiceUpload } = require('../middlewares/uploadMiddleware');
const { cloudinary } = require('../config/cloudinaryConfig');
const logger = require('../utils/logger');

const router = express.Router();

// Upload d'image (existante)
router.post('/',
  authMiddleware,
  (req, res, next) => {
    logger.info({
      message: 'Upload request received',
      userId: req.user?.id,
      method: 'single',
    });

    imageUpload.single('image')(req, res, (err) => {
      if (err) {
        logger.error({
          message: 'Upload error - Multer/Cloudinary',
          error: err.message,
          code: err.code,
          stack: err.stack,
          userId: req.user?.id,
        });

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Fichier trop volumineux. Taille max 5MB.'
          });
        }

        if (err.message === 'FORMAT_INVALIDE') {
          return res.status(400).json({
            success: false,
            error: 'Format invalide. Autorise: jpg, jpeg, png'
          });
        }

        if (err.message && err.message.includes('Cloudinary')) {
          return res.status(400).json({
            success: false,
            error: 'Erreur Cloudinary: ' + err.message
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Erreur lors du telechargement',
          message: err.message
        });
      }

      if (!req.file) {
        logger.warn({
          message: 'Upload - no file provided',
          userId: req.user?.id,
        });
        return res.status(400).json({
          success: false,
          error: 'No file provided',
          message: 'Please provide an image file in FormData with field name "image"'
        });
      }

      const imageUrl = req.file.path || req.file.secure_url;

      logger.info({
        message: 'Image uploaded successfully',
        filename: req.file.filename,
        size: req.file.size,
        url: imageUrl,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        imageUrl,
        file: {
          filename: req.file.filename,
          size: req.file.size
        }
      });
    });
  }
);

// Upload de vidéo
router.post('/video',
  authMiddleware,
  (req, res, next) => {
    logger.info({
      message: 'Video upload request received',
      userId: req.user?.id,
    });

    videoUpload.single('video')(req, res, (err) => {
      if (err) {
        logger.error({
          message: 'Video upload error - Multer/Cloudinary',
          error: err.message,
          code: err.code,
          stack: err.stack,
          userId: req.user?.id,
        });

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Vidéo trop volumineuse. Taille max 100MB.'
          });
        }

        if (err.message === 'FORMAT_VIDEO_INVALIDE') {
          return res.status(400).json({
            success: false,
            error: 'Format vidéo invalide. Autorise: mp4, mov, avi, mkv, webm, 3gp'
          });
        }

        if (err.message && err.message.includes('Cloudinary')) {
          return res.status(400).json({
            success: false,
            error: 'Erreur Cloudinary: ' + err.message
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Erreur lors du telechargement',
          message: err.message
        });
      }

      if (!req.file) {
        logger.warn({
          message: 'Video upload - no file provided',
          userId: req.user?.id,
        });
        return res.status(400).json({
          success: false,
          error: 'No file provided',
          message: 'Please provide a video file in FormData with field name "video"'
        });
      }

      const videoUrl = req.file.path || req.file.secure_url;
      const thumbnailUrl = cloudinary.url(req.file.public_id, {
        resource_type: 'video',
        format: 'jpg',
        transformation: [{ width: 480, height: 360, crop: 'fill', quality: 'auto' }]
      });
      const duration = req.file.duration || 0;

      logger.info({
        message: 'Video uploaded successfully',
        filename: req.file.filename,
        size: req.file.size,
        url: videoUrl,
        thumbnailUrl,
        duration,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        videoUrl,
        thumbnailUrl,
        duration,
        public_id: req.file.public_id,
        file: {
          filename: req.file.filename,
          size: req.file.size
        }
      });
    });
  }
);

// Upload de message vocal
router.post('/voice',
  authMiddleware,
  (req, res, next) => {
    logger.info({
      message: 'Voice upload request received',
      userId: req.user?.id,
    });

    voiceUpload.single('audio')(req, res, (err) => {
      if (err) {
        logger.error({
          message: 'Voice upload error - Multer/Cloudinary',
          error: err.message,
          code: err.code,
          stack: err.stack,
          userId: req.user?.id,
        });

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: 'Audio trop volumineux. Taille max 10MB.'
          });
        }

        if (err.message === 'FORMAT_VOICE_INVALIDE') {
          return res.status(400).json({
            success: false,
            error: 'Format audio invalide. Autorise: mp3, ogg, wav, webm'
          });
        }

        if (err.message && err.message.includes('Cloudinary')) {
          return res.status(400).json({
            success: false,
            error: 'Erreur Cloudinary: ' + err.message
          });
        }

        return res.status(500).json({
          success: false,
          error: 'Erreur lors du telechargement',
          message: err.message
        });
      }

      if (!req.file) {
        logger.warn({
          message: 'Voice upload - no file provided',
          userId: req.user?.id,
        });
        return res.status(400).json({
          success: false,
          error: 'No file provided',
          message: 'Please provide an audio file in FormData with field name "audio"'
        });
      }

      const audioUrl = req.file.path || req.file.secure_url;
      const duration = req.file.duration || 0;

      logger.info({
        message: 'Voice uploaded successfully',
        filename: req.file.filename,
        size: req.file.size,
        url: audioUrl,
        duration,
        userId: req.user?.id,
      });

      res.json({
        success: true,
        audioUrl,
        duration: Math.round(duration),
        public_id: req.file.public_id,
        file: {
          filename: req.file.filename,
          size: req.file.size
        }
      });
    });
  }
);

module.exports = router;
