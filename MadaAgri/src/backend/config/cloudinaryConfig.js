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

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = 'madaagri/post_videos';
    const ext = (file.originalname.split('.').pop() || 'mp4').toLowerCase();

    logger.info({
      message: 'Cloudinary video storage params',
      folder,
      ext,
      fieldname: file.fieldname,
    });

    return {
      folder,
      public_id: `${req.user?.id || 'anonymous'}_${Date.now()}`,
      resource_type: 'video',
      eager: [
        { width: 480, height: 360, crop: 'pad', quality: 'auto', fetch_format: 'auto' },
        { width: 720, height: 480, crop: 'pad', quality: 'auto', fetch_format: 'auto' },
      ],
      eager_async: true,
      eager_notification_url: null,
      format: 'mp4',
      transformation: [
        { quality: 'auto', fetch_format: 'auto', flags: 'streaming_attachment' }
      ],
      chunk_size: 6000000,
    };
  }
});

const voiceStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = 'madaagri/voice-messages';
    const ext = (file.originalname.split('.').pop() || 'mp3').toLowerCase();

    logger.info({
      message: 'Cloudinary voice storage params',
      folder,
      ext,
      fieldname: file.fieldname,
    });

    return {
      folder,
      public_id: `${req.user?.id || 'anonymous'}_${Date.now()}`,
      resource_type: 'video',
      format: ext === 'mp3' ? 'mp3' : ext === 'wav' ? 'wav' : 'ogg',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      chunk_size: 2000000,
    };
  }
});

module.exports = { cloudinary, imageStorage, videoStorage, voiceStorage };