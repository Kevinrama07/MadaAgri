require('dotenv').config();

const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Serveur
  server: {
    port: Number(process.env.PORT || 4000),
    host: process.env.HOST || 'localhost',
  },

  // Base de données
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'madaagri',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'changeme-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // Cloudinary
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },

  // CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

// Valider configuration en production
if (config.isProduction) {
  const requiredVars = ['JWT_SECRET', 'DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

module.exports = config;
