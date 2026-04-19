const express = require('express');
const pool = require('../db');
const { knnRecommend } = require('../algos/knn');
const { dijkstra } = require('../algos/dijkstra');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');

const router = express.Router();

// ========================
// RÉGIONS & CULTURES (PUBLIC)
// ========================

// GET / ou /regions - Récupérer les régions
router.get(['/regions', '/'], asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM regions');
    res.json({ regions: rows });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch regions',
      message: err.message 
    });
  }
}));

// GET /cultures - Récupérer les cultures (public)
router.get('/cultures', asyncHandler(async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM cultures');
    res.json({ cultures: rows });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch cultures',
      message: err.message 
    });
  }
}));

// ========================
// ANÁLYSE CULTURES (PUBLIC)
// ========================

// GET /region-cultures - Récupérer les cultures par région (simple)
router.get('/region-cultures', asyncHandler(async (req, res) => {
  const regionId = req.query.regionId;
  if (!regionId) {
    return res.status(400).json({ error: 'regionId is required' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT rc.suitability_score, c.* FROM region_cultures rc
       JOIN cultures c ON c.id = rc.culture_id
       WHERE rc.region_id = ?
       ORDER BY rc.suitability_score DESC`,
      [regionId]
    );

    const results = rows.map((row) => ({
      culture: {
        id: row.id,
        name: row.name,
        description: row.description,
        ideal_soil: row.ideal_soil,
        ideal_climate: row.ideal_climate,
        growing_period_days: row.growing_period_days,
        yield_potential: row.yield_potential,
        created_at: row.created_at,
      },
      suitability_score: row.suitability_score,
    }));

    res.json({ region_cultures: results });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch region cultures',
      message: err.message 
    });
  }
}));

// GET /knn-cultures - Recommandations k-NN pour cultures (public)
router.get('/knn-cultures', asyncHandler(async (req, res) => {
  const regionId = req.query.regionId;
  const k = Number(req.query.k || 5);
  if (!regionId) return res.status(400).json({ error: 'regionId is required' });

  try {
    const [regionRows] = await pool.query('SELECT * FROM regions WHERE id = ?', [regionId]);
    if (regionRows.length === 0) return res.status(404).json({ error: 'Region not found' });

    const [cultureRows] = await pool.query('SELECT * FROM cultures');
    const recs = knnRecommend(regionRows[0], cultureRows, k);
    res.json({ recommendations: recs });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch knn cultures',
      message: err.message 
    });
  }
}));

// ========================
// OPTIMISATION ROUTES (PROTÉGÉ)
// ========================

// GET /dijkstra - Calculer le plus court chemin avec Dijkstra
router.get('/dijkstra', authMiddleware, asyncHandler(async (req, res) => {
  const startId = req.query.startRegionId;
  const endId = req.query.endRegionId;
  if (!startId || !endId) return res.status(400).json({ error: 'startRegionId and endRegionId required' });

  try {
    const [rows] = await pool.query('SELECT id, name, latitude, longitude FROM regions');
    const nodes = rows.map((r) => ({ id: r.id, name: r.name, lat: Number(r.latitude), lon: Number(r.longitude) }));

    const result = dijkstra(nodes, startId, endId);
    res.json({ route: result });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to calculate dijkstra route',
      message: err.message 
    });
  }
}));

// ========================
// LIVRAISONS & DELIVERIES (PROTÉGÉ)
// ========================

// GET /deliveries - Récupérer les livraisons de l'agriculteur
router.get('/deliveries', authMiddleware, asyncHandler(async (req, res) => {
  const farmerId = req.query.farmerId || req.user.id;
  
  try {
    const [rows] = await pool.query(
      'SELECT * FROM deliveries WHERE farmer_id = ? ORDER BY created_at DESC',
      [farmerId]
    );
    res.json({ deliveries: rows });
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch deliveries',
      message: err.message 
    });
  }
}));

module.exports = router;
