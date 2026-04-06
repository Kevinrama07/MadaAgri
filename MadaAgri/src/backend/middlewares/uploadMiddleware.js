const multer = require('multer');
const { imageStorage } = require('../config/cloudinaryConfig');

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png'];

const upload = multer({
  storage: imageStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      const err = new Error('FORMAT_INVALIDE');
      err.status = 400;
      return cb(err, false);
    }
    cb(null, true);
  }
});

function uploadErrorHandler(err, req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Fichier trop volumineux. Taille max 5MB.' });
  }
  if (err.message === 'FORMAT_INVALIDE') {
    return res.status(400).json({ error: 'Format invalide. Autorisé: jpg, jpeg, png' });
  }
  console.error('uploadErrorHandler', err);
  return res.status(err.status || 500).json({ error: err.message || 'Erreur upload image' });
}

module.exports = { upload, uploadErrorHandler };