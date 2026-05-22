const multer = require('multer');
const { imageStorage, videoStorage, voiceStorage } = require('../config/cloudinaryConfig');
const logger = require('../utils/logger');

const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/jpg', 'image/png'];
const ALLOWED_VIDEO_MIME = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm', 'video/3gpp'];
const ALLOWED_VOICE_MIME = ['audio/mp3', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/webm;codecs=opus'];
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_VOICE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_DURATION_SECONDS = 60;

const imageUpload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    logger.info({
      message: 'Upload fileFilter - checking file',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    if (!ALLOWED_IMAGE_MIME.includes(file.mimetype)) {
      logger.error({
        message: 'Upload fileFilter - invalid format',
        filename: file.originalname,
        mimetype: file.mimetype,
        allowed: ALLOWED_IMAGE_MIME,
      });
      const err = new Error('FORMAT_INVALIDE');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

const videoUpload = multer({
  storage: videoStorage,
  limits: { fileSize: MAX_VIDEO_SIZE },
  fileFilter: (req, file, cb) => {
    logger.info({
      message: 'Video upload fileFilter - checking file',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    if (!ALLOWED_VIDEO_MIME.includes(file.mimetype)) {
      logger.error({
        message: 'Video upload - invalid format',
        filename: file.originalname,
        mimetype: file.mimetype,
        allowed: ALLOWED_VIDEO_MIME,
      });
      const err = new Error('FORMAT_VIDEO_INVALIDE');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

const voiceUpload = multer({
  storage: voiceStorage,
  limits: { fileSize: MAX_VOICE_SIZE },
  fileFilter: (req, file, cb) => {
    logger.info({
      message: 'Voice upload fileFilter - checking file',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    if (!ALLOWED_VOICE_MIME.includes(file.mimetype)) {
      logger.error({
        message: 'Voice upload - invalid format',
        filename: file.originalname,
        mimetype: file.mimetype,
        allowed: ALLOWED_VOICE_MIME,
      });
      const err = new Error('FORMAT_VOICE_INVALIDE');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

module.exports = { upload: imageUpload, videoUpload, voiceUpload };