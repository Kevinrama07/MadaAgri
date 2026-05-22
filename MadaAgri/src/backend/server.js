const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const os = require('os');
require('dotenv').config();

// Imports des configurations et utilitaires
const config = require('./config');
const logger = require('./utils/logger');
const { registerRoutes } = require('./routes');
const messageSocketService = require('./services/messageSocketService');
const ImageCleanupScheduler = require('./services/imageCleanupScheduler');
const { runMigrations } = require('./utils/migrations');
const pool = require('./db');

// Imports des middlewares
const { helmetConfig, generalLimiter, readLimiter } = require('./middlewares/security');
const { globalErrorHandler, asyncHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/logging');

// ============================================
// 🔧 CONFIGURATION CORS AMÉLIORÉE
// ============================================
const getAllowedOrigins = () => {
  const allowed = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://localhost:3000',
    'http://localhost:8081', // Expo development
    'http://localhost:19000', // Expo Go
    'http://localhost:19001', // Expo Go
    process.env.CORS_ORIGIN,
  ].filter(Boolean);

  // Ajouter toutes les adresses IP locales pour Android
  const interfaces = os.networkInterfaces();
  Object.values(interfaces).forEach((iface) => {
    iface.forEach((config) => {
      if (config.family === 'IPv4' && !config.internal) {
        allowed.push(`http://${config.address}:4000`);
        allowed.push(`http://${config.address}:${process.env.PORT || 4000}`);
      }
    });
  });

  return allowed;
};

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = getAllowedOrigins();
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS] Origin rejected: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 600,
};

// Initialiser Express
const app = express();
const server = http.createServer(app);

// Configurer socket.io avec CORS
const io = socketIo(server, {
  cors: corsOptions,
});

// Middleware de sécurité
app.use(helmetConfig);
// CORS
app.use(cors(corsOptions));
// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
// Logging des requêtes
app.use(requestLogger);
// Rate limiting : lectures (GET) plus lenient, écritures standard
app.use(readLimiter);
app.use(generalLimiter);
// Injecter socket.io dans les requêtes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Route de santé - avec infos de debug
app.get('/health', (req, res) => {
  const interfaces = os.networkInterfaces();
  const networkAddresses = [];
  
  Object.values(interfaces).forEach((iface) => {
    iface.forEach((addr) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        networkAddresses.push({
          interface: addr.family,
          address: addr.address,
          url: `http://${addr.address}:${config.server.port}`,
        });
      }
    });
  });

  res.json({
    status: 'running',
    environment: config.env,
    timestamp: new Date(),
    server: {
      host: config.server.host,
      port: config.server.port,
      localhost: `http://localhost:${config.server.port}`,
      androidEmulator: `http://10.0.2.2:${config.server.port}`,
      networkAddresses,
    },
    cors: {
      allowedOrigins: getAllowedOrigins(),
    },
  });
});

// Enregistrer tous les routes
registerRoutes(app);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

// Middleware de gestion globale des erreurs (doit être en dernier)
app.use(globalErrorHandler);

messageSocketService.init(io);

const PORT = config.server.port;
const HOST = config.server.host;

// Fonction pour obtenir toutes les adresses IP locales
const getNetworkInfo = () => {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  Object.values(interfaces).forEach((iface) => {
    iface.forEach((addr) => {
      if (addr.family === 'IPv4' && !addr.internal) {
        addresses.push(addr.address);
      }
    });
  });
  
  return addresses;
};

const startServer = async () => {
  try {
    // Run database migrations first
    await runMigrations(pool);
    
    server.listen(PORT, HOST, () => {
      const networkAddresses = getNetworkInfo();
      const androidEmulatorUrl = `http://10.0.2.2:${PORT}`;
      
      let serverLog = `
╔════════════════════════════════════════════════════════════╗
║       🌾 MadaAgri Backend Server Started 🌾                ║
╠════════════════════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(44)} ║
║  Host: ${HOST.padEnd(49)}   ║
║  Port: ${PORT.toString().padEnd(49)}   ║
║  WebSocket: ✅ Active (Socket.io)                          ║
╠════════════════════════════════════════════════════════════╣
║  📱 URLS FOR MOBILE/CLIENT CONNECTIONS:                    ║
║────────────────────────────────────────────────────────────║
║  Android Emulator:${androidEmulatorUrl.padEnd(39)}  ║
║  Localhost:http://localhost:${PORT.toString().padEnd(31)}║`;

      networkAddresses.forEach((addr) => {
        serverLog += `
║  Network IP:        http://${addr}:${PORT.toString().padEnd(18)} ║`;
      });

      serverLog += `
║────────────────────────────────────────────────────────────║
║  Health Check: GET http://localhost:${PORT}/health${' '.repeat(12)}║
╠════════════════════════════════════════════════════════════╣
║  CORS Enabled for:                                         ║
║  - Localhost & Network IPs                                 ║
║  - Android Emulator (10.0.2.2)                             ║
║  - Expo Go                                                 ║
╚════════════════════════════════════════════════════════════╝
    `;
    
    logger.info(serverLog);
    logger.debug('Allowed CORS origins:', getAllowedOrigins());
  });

  // Gérer les erreurs de démarrage
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      logger.error(`Port ${PORT} is already in use`);
    } else {
      logger.error(`Server error: ${error.message}`);
    }
    process.exit(1);
  });
  } catch (err) {
    logger.error('[startServer] ❌ Error during startup:', err);
    process.exit(1);
  }
};

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });

  // Forcer la fermeture après 10 secondes
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  logger.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

// Graceful shutdown handler
const shutdown = async () => {
  logger.info('🛑 Arrêt du serveur en cours...');
  
  // Stop image cleanup scheduler
  try {
    ImageCleanupScheduler.stop();
    logger.info('✅ ImageCleanupScheduler arrêté');
  } catch (error) {
    logger.error('❌ Erreur lors de l\'arrêt du scheduler:', error);
  }

  // Close HTTP server
  server.close(() => {
    logger.info('✅ Serveur HTTP fermé');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('⚠️  Timeout de fermeture - Force exit');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Démarrer le serveur si le script est exécuté directement
if (require.main === module) {
  (async () => {
    try {
      await startServer();
      
      // Initialize image cleanup scheduler
      try {
        ImageCleanupScheduler.start();
        logger.info('✅ ImageCleanupScheduler démarré (cleanup quotidien à 2h du matin)');
      } catch (error) {
        logger.error('❌ Erreur lors du démarrage du scheduler:', error);
      }
    } catch (error) {
      logger.error('❌ Erreur au démarrage du serveur:', error);
      process.exit(1);
    }
  })();
}

module.exports = app;
