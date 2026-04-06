const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const missingCloudinary = [
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET'
].filter((key) => !process.env[key]);

if (missingCloudinary.length > 0) {
  throw new Error(
    `Cloudinary config invalide: variables manquantes ${missingCloudinary.join(', ')}.`
  );
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const folder = file.fieldname === 'profilePicture' ? 'madaagri/profile_pics' : 'madaagri/post_images';
    const timestamp = Date.now();
    const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase();
    return {
      folder,
      public_id: `${req.user?.id || 'anonymous'}_${timestamp}`,
      resource_type: 'image',
      transformation: [{ width: 1200, crop: 'limit' }],
      format: ext === 'jpg' ? 'jpg' : ext === 'jpeg' ? 'jpeg' : 'png'
    };
  }
});

module.exports = { cloudinary, imageStorage };