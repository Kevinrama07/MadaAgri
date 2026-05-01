const { router: authRouter } = require('./auth');
const postsRouter = require('./posts');
const usersRouter = require('./users');
const productsRouter = require('./products');
const reservationsRouter = require('./reservations');
const messagesRouter = require('./messages');
const networkRouter = require('./network');
const analysisRouter = require('./analysis');
const uploadRouter = require('./upload');
const healthRouter = require('./health');
const optimizationRouter = require('./optimization');

const logger = require('../utils/logger');
const { authLimiter } = require('../middlewares/security');
const { handleValidationErrors } = require('../middlewares/validators');

function registerRoutes(app, uploadServices) {
  // ========================
  // INJECTION DE CONTEXTE
  // ========================

  // Injection des services Upload si fournis
  if (uploadServices) {
    app.use((req, res, next) => {
      req.uploadServices = uploadServices;
      next();
    });
  }

  // ========================
  // ROUTES DE SANTÉ (SANS REQUÊTE D'AUTH)
  // ========================

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date(),
    });
  });

  // ========================
  // ROUTES D'AUTHENTIFICATION
  // ========================

  app.use('/api/auth', authRouter);

  // ========================
  // ROUTES PRINCIPALES
  // ========================

  // Routes sociales et feed
  app.use('/api/posts', postsRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/network', networkRouter);
  app.use('/api/follows', networkRouter);

  // Routes produits
  app.use('/api/products', productsRouter);

  // Routes réservations
  app.use('/api/reservations', reservationsRouter);

  // Routes messagerie
  app.use('/api/messages', messagesRouter);

  // Routes d'analyse
  app.use('/api/analysis', analysisRouter);
  app.use('/api/regions', analysisRouter);
  app.use('/api/routes', analysisRouter);

  // Routes optimisation de routes
  app.use('/api/optimization', optimizationRouter);

  // Routes utilitaires
  app.use('/api/upload', uploadRouter);

  // ========================
  // ROUTES 404 ET GESTION D'ERREURS
  // ========================

  // Route 404
  app.use((req, res) => {
    logger.warn({
      message: 'Route not found',
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
    });

    res.status(404).json({
      success: false,
      error: 'Route not found',
      path: req.originalUrl,
      timestamp: new Date(),
    });
  });

  // Note: Le middleware de gestion d'erreurs global est appliqué dans server.js
  // pour être le tout dernier middleware
}

module.exports = { registerRoutes };
