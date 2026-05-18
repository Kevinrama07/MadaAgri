const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const ReverseGeolocationService = require('../services/reverseGeolocationService');
const SoilIntelligenceService = require('../services/soilIntelligenceService');
const CropRecommendationEngine = require('../services/cropRecommendationEngine');

const router = express.Router();

// GET /api/parcels - Get all parcels for current user
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [rows] = await pool.query(
    `SELECT * FROM land_parcels WHERE user_id = ? ORDER BY created_at DESC`,
    [userId]
  );

  const parcels = rows.map((row) => ({
    ...row,
    recommended_crops: typeof row.recommended_crops === 'string' ? JSON.parse(row.recommended_crops) : row.recommended_crops,
  }));

  res.json({ parcels });
}));

// GET /api/parcels/:id - Get single parcel
router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;

  const [rows] = await pool.query(
    `SELECT * FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvée' });
  }

  const parcel = {
    ...rows[0],
    recommended_crops: typeof rows[0].recommended_crops === 'string' ? JSON.parse(rows[0].recommended_crops) : rows[0].recommended_crops,
  };

  res.json({ parcel });
}));

// POST /api/parcels - Create a new parcel
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description, latitude, longitude, size_ha } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: 'Nom, latitude et longitude requis' });
  }

  const parcelId = randomUUID();

  // Reverse geolocation
  const location = await ReverseGeolocationService.getLocationFromCoordinates(
    parseFloat(latitude),
    parseFloat(longitude)
  );

  // Soil intelligence
  const soilData = await SoilIntelligenceService.getSoilData(location.region);
  const suitabilityScore = SoilIntelligenceService.getSuitabilityScore(soilData);

  // Crop recommendations
  const recommendedCrops = await CropRecommendationEngine.recommendCrops(soilData);

  await pool.query(
    `INSERT INTO land_parcels (
      id, user_id, name, description, latitude, longitude, size_ha,
      country, region, district, commune,
      soil_type, soil_ph, soil_organic_matter, climate_type,
      annual_rainfall_mm, avg_temperature, suitability_score, recommended_crops,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      parcelId,
      userId,
      name,
      description || null,
      parseFloat(latitude),
      parseFloat(longitude),
      size_ha ? parseFloat(size_ha) : null,
      location.country,
      location.region,
      location.district,
      location.commune,
      soilData.soil_type,
      soilData.soil_ph,
      soilData.soil_organic_matter,
      soilData.climate_type,
      soilData.annual_rainfall_mm,
      soilData.avg_temperature,
      suitabilityScore,
      JSON.stringify(recommendedCrops),
    ]
  );

  const [newParcel] = await pool.query(`SELECT * FROM land_parcels WHERE id = ?`, [parcelId]);

  res.status(201).json({
    parcel: {
      ...newParcel[0],
      recommended_crops: recommendedCrops,
    },
    location,
    soilData,
    recommendedCrops,
  });
}));

// PUT /api/parcels/:id - Update parcel
router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;
  const { name, description, size_ha } = req.body;

  const [existing] = await pool.query(
    `SELECT * FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (existing.length === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvée' });
  }

  await pool.query(
    `UPDATE land_parcels SET name = ?, description = ?, size_ha = ?, updated_at = NOW()
     WHERE id = ? AND user_id = ?`,
    [name || existing[0].name, description ?? existing[0].description, size_ha ?? existing[0].size_ha, parcelId, userId]
  );

  const [updated] = await pool.query(`SELECT * FROM land_parcels WHERE id = ?`, [parcelId]);

  res.json({
    parcel: {
      ...updated[0],
      recommended_crops: typeof updated[0].recommended_crops === 'string' ? JSON.parse(updated[0].recommended_crops) : updated[0].recommended_crops,
    },
  });
}));

// DELETE /api/parcels/:id - Delete parcel
router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;

  const [result] = await pool.query(
    `DELETE FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvée' });
  }

  res.json({ ok: true });
}));

// POST /api/parcels/:id/analyze-crop - AI crop analysis for a parcel
router.post('/:id/analyze-crop', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;
  const { image_url, detected_crop, confidence_score, health_score, disease_detected, disease_risk, recommendations } = req.body;

  const [parcel] = await pool.query(
    `SELECT id FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (parcel.length === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvée' });
  }

  const analysisId = randomUUID();

  await pool.query(
    `INSERT INTO crop_analysis_results (
      id, user_id, parcel_id, image_url, detected_crop, confidence_score,
      health_score, disease_detected, disease_risk, recommendations, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      analysisId,
      userId,
      parcelId,
      image_url || null,
      detected_crop || null,
      confidence_score || null,
      health_score || null,
      disease_detected || null,
      disease_risk || null,
      JSON.stringify(recommendations || []),
    ]
  );

  const [analysis] = await pool.query(`SELECT * FROM crop_analysis_results WHERE id = ?`, [analysisId]);

  res.status(201).json({
    analysis: {
      ...analysis[0],
      recommendations: typeof analysis[0].recommendations === 'string' ? JSON.parse(analysis[0].recommendations) : analysis[0].recommendations,
    },
  });
}));

// GET /api/parcels/:id/analysis-history - Get analysis history for a parcel
router.get('/:id/analysis-history', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;

  const [rows] = await pool.query(
    `SELECT * FROM crop_analysis_results WHERE parcel_id = ? AND user_id = ? ORDER BY created_at DESC`,
    [parcelId, userId]
  );

  const analyses = rows.map((row) => ({
    ...row,
    recommendations: typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : row.recommendations,
  }));

  res.json({ analyses });
}));

module.exports = router;
