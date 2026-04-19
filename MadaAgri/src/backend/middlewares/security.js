/**
 * Middleware de sécurité
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { RATE_LIMIT } = require('../constants');

/**
 * Limiter général
 */
const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS,
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Limiter pour les requêtes GET (lecture, plus lenient)
 */
const readLimiter = rateLimit({
  windowMs: RATE_LIMIT.WINDOW_MS,
  max: RATE_LIMIT.MAX_REQUESTS * 2, // 2x plus de requêtes pour les GET
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method !== 'GET', // Seulement pour GET
});

/**
 * Limiter pour l'authentification (plus restrictif)
 */
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
  max: RATE_LIMIT.AUTH_MAX_REQUESTS,
  message: 'Trop de tentatives de connexion, veuillez réessayer plus tard',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compte que les échos
});

/**
 * Configuration Helmet
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
  frameguard: {
    action: 'deny',
  },
  noSniff: true,
  xssFilter: true,
});

module.exports = {
  helmetConfig,
  generalLimiter,
  readLimiter,
  authLimiter,
};
