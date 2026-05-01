const logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Logger après que la réponse soit envoyée
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info({
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  // Logger les erreurs
  res.on('error', (err) => {
    logger.error({
      method: req.method,
      url: req.originalUrl,
      error: err.message,
      ip: req.ip,
    });
  });

  next();
};

module.exports = {
  requestLogger,
};
