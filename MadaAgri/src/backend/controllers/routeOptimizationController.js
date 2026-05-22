const RouteOptimizer = require('../services/routeOptimizer');
const { asyncHandler } = require('../middlewares/authMiddleware');

const optimizeRoutes = asyncHandler(async (req, res, next) => {
  try {
    const { deliveries, options } = req.body;

    // Validation
    if (!deliveries || !Array.isArray(deliveries) || deliveries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fournir au moins une livraison'
      });
    }

    // Valider chaque livraison
    for (const delivery of deliveries) {
      if (!delivery.latitude || !delivery.longitude) {
        return res.status(400).json({
          success: false,
          message: 'Chaque livraison doit avoir latitude et longitude'
        });
      }
    }

    // Optimiser
    const result = RouteOptimizer.optimizeRoutes(deliveries, options);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

const calculateDistance = asyncHandler(async (req, res, next) => {
  try {
    const { lat1, lon1, lat2, lon2 } = req.query;

    if (!lat1 || !lon1 || !lat2 || !lon2) {
      return res.status(400).json({
        success: false,
        message: 'Fournir lat1, lon1, lat2, lon2'
      });
    }

    const distance = RouteOptimizer.haversineDistance(
      parseFloat(lat1),
      parseFloat(lon1),
      parseFloat(lat2),
      parseFloat(lon2)
    );

    res.json({
      success: true,
      distance: Math.round(distance * 100) / 100,
      unit: 'km'
    });
  } catch (error) {
    next(error);
  }
});

const reoptimizeAfterRemoval = asyncHandler(async (req, res, next) => {
  try {
    const { currentRoute, deliveryId } = req.body;

    if (!currentRoute || !Array.isArray(currentRoute)) {
      return res.status(400).json({
        success: false,
        message: 'Fournir currentRoute'
      });
    }

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: 'Fournir deliveryId'
      });
    }

    const newRoute = RouteOptimizer.reoptimizeAfterRemoval(
      currentRoute,
      deliveryId
    );

    res.json({
      success: true,
      route: newRoute
    });
  } catch (error) {
    next(error);
  }
});

const compareAlgorithms = asyncHandler(async (req, res, next) => {
  try {
    const { deliveries, depot } = req.body;

    if (!deliveries || !Array.isArray(deliveries) || deliveries.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Fournir au moins une livraison'
      });
    }

    // Nearest Neighbor
    const nnRoute = RouteOptimizer.nearestNeighbor(deliveries, depot);
    const nnStats = RouteOptimizer.calculateStats([nnRoute], depot);

    // Clarke & Wright
    const cwRoute = RouteOptimizer.clarkeWrightSavings(deliveries, depot);
    const cwStats = RouteOptimizer.calculateStats(
      Array.isArray(cwRoute[0]) ? cwRoute : [cwRoute],
      depot
    );

    res.json({
      success: true,
      comparison: {
        nearestNeighbor: {
          route: nnRoute,
          statistics: nnStats
        },
        clarkeWright: {
          route: cwRoute,
          statistics: cwStats
        },
        recommendation: nnStats.totalDistance <= cwStats.totalDistance
          ? 'Nearest Neighbor est plus efficace'
          : 'Clarke & Wright est plus efficace'
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = {
  optimizeRoutes,
  calculateDistance,
  reoptimizeAfterRemoval,
  compareAlgorithms
};
