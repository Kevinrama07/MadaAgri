const multer = require('multer');
const { imageStorage } = require('../config/cloudinaryConfig');
const logger = require('../utils/logger');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    logger.info({
      message: 'Upload fileFilter - checking file',
      filename: file.originalname,
      mimetype: file.mimetype,
    });

    if (!ALLOWED_MIME.includes(file.mimetype)) {
      logger.error({
        message: 'Upload fileFilter - invalid format',
        filename: file.originalname,
        mimetype: file.mimetype,
        allowed: ALLOWED_MIME,
      });
      const err = new Error('FORMAT_INVALIDE');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

module.exports = { upload };