require('dotenv').config();

// Validate critical environment variables in all environments
// Support both DB_* and MYSQL_* naming conventions
const getEnv = (primary, fallback) => process.env[primary] || process.env[fallback];

const requiredVars = [
  { primary: 'DB_HOST', fallback: 'MYSQL_HOST' },
  { primary: 'DB_USER', fallback: 'MYSQL_USER' },
  { primary: 'DB_NAME', fallback: 'MYSQL_DATABASE' },
  { primary: 'JWT_SECRET', fallback: null },
];
const missing = requiredVars.filter(v => !getEnv(v.primary, v.fallback));
if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.map(v => v.primary).join(', ')}`);
}

const config = {
  // Environnement
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Serveur
  server: {
    port: Number(process.env.PORT) || 4000,
    host: process.env.HOST || '0.0.0.0',
  },

  // Base de données
  database: {
    host: getEnv('DB_HOST', 'MYSQL_HOST'),
    port: Number(process.env.DB_PORT || process.env.MYSQL_PORT) || 3306,
    user: getEnv('DB_USER', 'MYSQL_USER'),
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '',
    database: getEnv('DB_NAME', 'MYSQL_DATABASE'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET,
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
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};

module.exports = config;
