const express = require('express');
const router = express.Router();
const {
  optimizeRoutes,
  calculateDistance,
  reoptimizeAfterRemoval,
  compareAlgorithms
} = require('../controllers/routeOptimizationController');


router.post('/optimize', optimizeRoutes);

router.get('/distance', calculateDistance);

router.post('/reoptimize', reoptimizeAfterRemoval);

router.post('/compare', compareAlgorithms);

module.exports = router;
