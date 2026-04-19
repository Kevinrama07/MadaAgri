/**
 * Serveur principal - Point d'entrée de l'application
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

// Imports des configurations et utilitaires
const config = require('./config');
const logger = require('./utils/logger');
const { registerRoutes } = require('./routes');
const messageSocketService = require('./services/messageSocketService');

// Imports des middlewares
const { helmetConfig, generalLimiter, readLimiter } = require('./middlewares/security');
const { globalErrorHandler, asyncHandler } = require('./middlewares/errorHandler');
const { requestLogger } = require('./middlewares/logging');

// Initialiser Express
const app = express();
const server = http.createServer(app);

// Configurer socket.io
const io = socketIo(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ========================
// CONFIGURATION GLOBALE
// ========================

// Middleware de sécurité
app.use(helmetConfig);

// CORS
app.use(cors(config.cors));

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

// ========================
// ROUTES
// ========================

// Route de santé
app.get('/health', (req, res) => {
  res.json({
    status: 'running',
    environment: config.env,
    timestamp: new Date(),
  });
});

// Enregistrer tous les routes
registerRoutes(app);

// ========================
// GESTION DES ERREURS
// ========================

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

// ========================
// WEBSOCKET & MESSAGERIE EN TEMPS RÉEL
// ========================

messageSocketService.init(io);

// ========================
// DÉMARRAGE DU SERVEUR
// ========================

const PORT = config.server.port;
const HOST = config.server.host;

const startServer = () => {
  server.listen(PORT, HOST, () => {
    logger.info(`
╔═════════════════════════════════════════════╗
║       MadaAgri Backend Server Started       ║
╠═════════════════════════════════════════════╣
║  Environment: ${config.env.padEnd(30)}║
║  Host: ${HOST.padEnd(36)} ║
║  Port: ${PORT.toString().padEnd(36)} ║
║  WebSocket: Active (Socket.io)              ║
╚═════════════════════════════════════════════╝
    `);
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
};

// ========================
// ARRÊT GRACIEUX
// ========================

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

// Démarrer le serveur si le script est exécuté directement
if (require.main === module) {
  startServer();
}

module.exports = app;
