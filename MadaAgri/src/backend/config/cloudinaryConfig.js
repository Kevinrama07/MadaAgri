const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const logger = require('../utils/logger');

const missingCloudinary = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
].filter((key) => !process.env[key]);

if (missingCloudinary.length > 0) {
  logger.error({
    message: 'Cloudinary config invalid',
    missingVariables: missingCloudinary,
  });
  throw new Error(
    `Cloudinary config invalide: variables manquantes ${missingCloudinary.join(', ')}.`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

logger.info({
  message: 'Cloudinary configured',
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = file.fieldname === 'profilePicture' ? 'madaagri/profile_pics' : 'madaagri/post_images';
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    
    logger.info({
      message: 'Cloudinary storage params',
      folder,
      ext,
      fieldname: file.fieldname,
    });

    return {
      folder,
      public_id: `${req.user?.id || 'anonymous'}_${Date.now()}`,
      resource_type: 'image',
      transformation: [{ width: 1200, crop: 'limit' }],
      format: ext === 'jpg' ? 'jpg' : ext === 'jpeg' ? 'jpeg' : 'png'
    };
  }
});

module.exports = { cloudinary, imageStorage };