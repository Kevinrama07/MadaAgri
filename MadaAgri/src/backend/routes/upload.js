const express = require('express');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/upload - Télécharger une image
 * 
 * Gère le téléchargement d'images via Cloudinary.
 * Accepte FormData avec un champ 'image' contenant le fichier à uploader.
 */
router.post('/', 
  authMiddleware,
  (req, res, next) => {
    logger.info({
      message: 'Upload request received',
      userId: req.user?.id,
      method: 'single',
    });

    upload.single('image')(req, res, (err) => {
      // Gestion des erreurs multer/cloudinary
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
            error: 'Format invalide. Autorisé: jpg, jpeg, png' 
          });
        }

        // Erreur Cloudinary ou autre erreur
        if (err.message && err.message.includes('Cloudinary')) {
          return res.status(400).json({ 
            success: false,
            error: 'Erreur Cloudinary: ' + err.message
          });
        }

        return res.status(500).json({ 
          success: false,
          error: 'Erreur lors du téléchargement',
          message: err.message 
        });
      }

      // Vérifier que le fichier a été uploadé
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

      // Retourner l'URL de l'image uploadée
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

module.exports = router;
