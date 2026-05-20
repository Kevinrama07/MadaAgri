const { Queue, Worker, QueueEvents } = require('bullmq');
const { randomUUID } = require('crypto');
const pool = require('../db');
const logger = require('../utils/logger');

const QUEUE_NAME = 'ai-analysis';
const JOB_TTL = 120000; // 2 minutes
const MAX_RETRIES = 2;

class QueueService {
  constructor() {
    this.queue = null;
    this.worker = null;
    this.queueEvents = null;
    this.useBullMQ = false;
    this.initialized = false;
    this.processors = [];
  }

  async init(processor) {
    if (this.initialized) return;

    this.processors.push(processor);

    const redisDisabled = process.env.DISABLE_REDIS === 'true' || !process.env.REDIS_URL;
    if (redisDisabled) {
      logger.info('[QueueService] Using DB-backed queue (Redis disabled)');
      this.initialized = true;
      return;
    }

    try {
      const connection = {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        maxRetriesPerRequest: null,
      };

      this.queue = new Queue(QUEUE_NAME, { connection });
      this.queueEvents = new QueueEvents(QUEUE_NAME, { connection });

      this.worker = new Worker(
        QUEUE_NAME,
        async (job) => {
          for (const proc of this.processors) {
            try {
              return await proc(job.data);
            } catch (err) {
              logger.error('[QueueService] Processor failed', { processor: proc.name, error: err.message });
            }
          }
          throw new Error('All processors failed');
        },
        {
          connection,
          concurrency: 3,
          removeOnComplete: { age: 3600 },
          removeOnFail: { age: 86400 },
        }
      );

      this.worker.on('completed', (job) => {
        logger.info('[QueueService] Job completed', { jobId: job.id });
      });

      this.worker.on('failed', (job, err) => {
        logger.error('[QueueService] Job failed', { jobId: job.id, error: err.message });
      });

      this.useBullMQ = true;
      logger.info('[QueueService] BullMQ queue initialized');
    } catch (error) {
      logger.warn('[QueueService] BullMQ unavailable, using DB-backed queue', { error: error.message });
      this.useBullMQ = false;
    }

    this.initialized = true;
  }

  async addJob(data) {
    if (!this.initialized) await this.init();

    const jobId = randomUUID();

    if (this.useBullMQ && this.queue) {
      const job = await this.queue.add(QUEUE_NAME, { ...data, jobId }, {
        jobId,
        attempts: MAX_RETRIES,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        timeout: JOB_TTL,
      });
      return { jobId: job.id, status: 'queued' };
    }

    await pool.query(
      `INSERT INTO analysis_jobs (id, user_id, parcel_id, image_url, image_hash, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'queued', NOW())`,
      [jobId, data.userId, data.parcelId || null, data.imageUrl, data.imageHash || null]
    );

    setImmediate(() => this.processDBJob(jobId));

    return { jobId, status: 'queued' };
  }

  async getJobStatus(jobId) {
    if (!this.initialized) await this.init();

    if (this.useBullMQ && this.queue) {
      const job = await this.queue.getJob(jobId);
      if (!job) return { status: 'not_found' };

      if (job.finishedOn) return { status: 'completed', result: job.returnvalue };
      if (job.failedOn) return { status: 'failed', error: job.failedReason };
      if (job.processedOn) return { status: 'processing' };
      return { status: 'queued' };
    }

    const [rows] = await pool.query(
      `SELECT * FROM analysis_jobs WHERE id = ?`,
      [jobId]
    );

    if (rows.length === 0) return { status: 'not_found' };

    const row = rows[0];
    if (row.status === 'completed') {
      return {
        status: 'completed',
        result: row.result ? JSON.parse(row.result) : null,
      };
    }
    if (row.status === 'failed') {
      return { status: 'failed', error: row.error };
    }
    return { status: row.status };
  }

  async processDBJob(jobId) {
    for (const proc of this.processors) {
      try {
        const [rows] = await pool.query(`SELECT * FROM analysis_jobs WHERE id = ?`, [jobId]);
        if (rows.length === 0 || rows[0].status !== 'queued') return;

        await pool.query(`UPDATE analysis_jobs SET status = 'processing', started_at = NOW() WHERE id = ?`, [jobId]);

        const result = await proc(rows[0]);

        await pool.query(
          `UPDATE analysis_jobs SET status = 'completed', result = ?, completed_at = NOW() WHERE id = ?`,
          [JSON.stringify(result), jobId]
        );
        return;
      } catch (error) {
        logger.error('[QueueService] DB job processor failed', { error: error.message });
      }
    }

    await pool.query(
      `UPDATE analysis_jobs SET status = 'failed', error = ? WHERE id = ?`,
      ['All processors failed', jobId]
    );
  }

  async getQueueStats() {
    if (this.useBullMQ && this.queue) {
      const [waiting, active, completed, failed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
      ]);
      return { waiting, active, completed, failed, type: 'bullmq' };
    }

    const [counts] = await pool.query(
      `SELECT
        SUM(CASE WHEN status = 'queued' THEN 1 ELSE 0 END) as waiting,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
       FROM analysis_jobs`
    );

    return { ...counts[0], type: 'db-backed' };
  }
}

module.exports = new QueueService();
