const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

/**
 * Middleware de cache pour les routes GET
 * @param {number} ttl - Durée de vie du cache en secondes (défaut: 300s = 5min)
 * @param {function} keyGenerator - Fonction pour générer la clé de cache
 */
const cacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Ne cacher que les requêtes GET
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Générer la clé de cache
      const cacheKey = keyGenerator 
        ? keyGenerator(req)
        : `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

      // Vérifier le cache
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData) {
        logger.debug(`Cache hit: ${cacheKey}`);
        return res.json({
          ...cachedData,
          _cached: true,
          _cachedAt: new Date().toISOString()
        });
      }

      logger.debug(`Cache miss: ${cacheKey}`);

      // Intercepter la réponse pour la mettre en cache
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        // Mettre en cache seulement les réponses réussies
        if (res.statusCode === 200 && data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            logger.error('Error caching response:', err);
          });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

/**
 * Middleware pour invalider le cache après modification
 * @param {string|function} pattern - Pattern de clés à invalider
 */
const invalidateCacheMiddleware = (pattern) => {
  return async (req, res, next) => {
    // Intercepter la réponse
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      // Invalider le cache après une réponse réussie
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const cachePattern = typeof pattern === 'function' 
            ? pattern(req) 
            : pattern;
          
          await cacheService.delPattern(cachePattern);
          logger.debug(`Cache invalidated: ${cachePattern}`);
        } catch (error) {
          logger.error('Error invalidating cache:', error);
        }
      }
      return originalJson(data);
    };

    next();
  };
};

/**
 * Générateurs de clés de cache communs
 */
const cacheKeyGenerators = {
  // Posts
  posts: (req) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    const userId = req.user?.id || 'anonymous';
    return `cache:posts:${userId}:page:${page}:limit:${limit}`;
  },

  // Produits
  products: (req) => {
    const { page = 1, limit = 20, category, region } = req.query;
    return `cache:products:page:${page}:limit:${limit}:cat:${category || 'all'}:reg:${region || 'all'}`;
  },

  // Utilisateur
  user: (req) => {
    const userId = req.params.id || req.user?.id;
    return `cache:user:${userId}`;
  },

  // Notifications
  notifications: (req) => {
    const userId = req.user?.id;
    return `cache:notifications:${userId}`;
  },

  // Conversations
  conversations: (req) => {
    const userId = req.user?.id;
    return `cache:conversations:${userId}`;
  }
};

/**
 * Patterns d'invalidation communs
 */
const cacheInvalidationPatterns = {
  // Invalider tous les posts
  posts: () => 'cache:posts:*',

  // Invalider les produits
  products: () => 'cache:products:*',

  // Invalider un utilisateur spécifique
  user: (req) => `cache:user:${req.params.id || req.user?.id}*`,

  // Invalider les notifications d'un utilisateur
  notifications: (req) => `cache:notifications:${req.user?.id}*`,

  // Invalider les conversations d'un utilisateur
  conversations: (req) => `cache:conversations:${req.user?.id}*`
};

module.exports = {
  cacheMiddleware,
  invalidateCacheMiddleware,
  cacheKeyGenerators,
  cacheInvalidationPatterns
};
