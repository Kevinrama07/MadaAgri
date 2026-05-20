const express = require('express');
const { randomUUID } = require('crypto');
const pool = require('../db');
const { authMiddleware, asyncHandler } = require('../middlewares/authMiddleware');
const ReverseGeolocationService = require('../services/reverseGeolocationService');
const SoilIntelligenceService = require('../services/soilIntelligenceService');
const CropRecommendationEngine = require('../services/cropRecommendationEngine');
const AIOrchestrator = require('../services/aiOrchestrator');
const AgronomicIntelligenceService = require('../services/agronomicIntelligenceService');
const logger = require('../utils/logger');

const router = express.Router();

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

router.get('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;

  const [rows] = await pool.query(
    `SELECT * FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (rows.length === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvee' });
  }

  const parcel = {
    ...rows[0],
    recommended_crops: typeof rows[0].recommended_crops === 'string' ? JSON.parse(rows[0].recommended_crops) : rows[0].recommended_crops,
  };

  res.json({ parcel });
}));

router.post('/', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { name, description, latitude, longitude, size_ha, polygon_coordinates } = req.body;

  if (!name || !latitude || !longitude) {
    return res.status(400).json({ error: 'Nom, latitude et longitude requis' });
  }

  const parcelId = randomUUID();

  const location = await ReverseGeolocationService.getLocationFromCoordinates(
    parseFloat(latitude),
    parseFloat(longitude)
  );

  const soilData = await SoilIntelligenceService.getSoilData(location.region);
  const suitabilityScore = SoilIntelligenceService.getSuitabilityScore(soilData);
  const recommendedCrops = await CropRecommendationEngine.recommendCrops(soilData);

  await pool.query(
    `INSERT INTO land_parcels (
      id, user_id, name, description, latitude, longitude, size_ha,
      country, region, district, commune,
      soil_type, soil_ph, soil_organic_matter, climate_type,
      annual_rainfall_mm, avg_temperature, suitability_score, recommended_crops,
      polygon_coordinates, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
    [
      parcelId, userId, name, description || null,
      parseFloat(latitude), parseFloat(longitude), size_ha ? parseFloat(size_ha) : null,
      location.country, location.region, location.district, location.commune,
      soilData.soil_type, soilData.soil_ph, soilData.soil_organic_matter, soilData.climate_type,
      soilData.annual_rainfall_mm, soilData.avg_temperature,
      suitabilityScore, JSON.stringify(recommendedCrops),
      polygon_coordinates ? JSON.stringify(polygon_coordinates) : null,
    ]
  );

  const [newParcel] = await pool.query(`SELECT * FROM land_parcels WHERE id = ?`, [parcelId]);

  res.status(201).json({
    parcel: { ...newParcel[0], recommended_crops: recommendedCrops },
    location,
    soilData,
    recommendedCrops,
  });
}));

router.put('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;
  const { name, description, size_ha } = req.body;

  const [existing] = await pool.query(
    `SELECT * FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (existing.length === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvee' });
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

router.delete('/:id', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;

  const [result] = await pool.query(
    `DELETE FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (result.affectedRows === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvee' });
  }

  res.json({ ok: true });
}));

// AI Analysis - Parcel-linked
router.post('/:id/analyze-crop', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;
  const { image_url } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: 'image_url est requis' });
  }

  const [parcel] = await pool.query(
    `SELECT * FROM land_parcels WHERE id = ? AND user_id = ?`,
    [parcelId, userId]
  );

  if (parcel.length === 0) {
    return res.status(404).json({ error: 'Parcelle non trouvee' });
  }

  const parcelContext = {
    soil_type: parcel[0].soil_type,
    climate_type: parcel[0].climate_type,
    region: parcel[0].region,
    annual_rainfall_mm: parcel[0].annual_rainfall_mm,
    avg_temperature: parcel[0].avg_temperature,
  };

  logger.info('[AnalyzeCrop] Starting AI pipeline', { userId, parcelId, imageUrl: image_url });

  const result = await AIOrchestrator.analyze(image_url, {
    userId,
    parcelId,
    parcelContext,
  });

  if (!result.is_plant) {
    return res.status(400).json({
      error: 'Aucune plante detectee dans cette image',
      hint: 'Assurez-vous que la photo montre clairement une plante ou culture',
    });
  }

  if (result.detected_crop === 'Inconnu' && result.confidence_score < 15) {
    return res.status(400).json({
      error: 'Culture non identifiable avec certitude',
      hint: 'Prenez une photo plus proche et plus nette de la plante',
    });
  }

  const analysisId = randomUUID();

  await pool.query(
    `INSERT INTO crop_analysis_results (
      id, user_id, parcel_id, image_url, image_hash, detected_crop, confidence_score,
      health_score, disease_detected, disease_risk, recommendations,
      nutrient_deficiencies, growth_stage, is_plant, image_quality, ai_source,
      economic_estimate, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      analysisId, userId, parcelId, image_url, result.image_hash || null,
      result.detected_crop, result.confidence_score, result.health_score,
      result.disease_detected, result.disease_risk,
      JSON.stringify(result.recommendations),
      JSON.stringify(result.nutrient_deficiencies),
      result.growth_stage, result.is_plant, result.image_quality,
      result.ai_source,
      result.economic_estimate ? JSON.stringify(result.economic_estimate) : null,
    ]
  );

  const [saved] = await pool.query(`SELECT * FROM crop_analysis_results WHERE id = ?`, [analysisId]);

  const response = {
    ...saved[0],
    recommendations: result.recommendations,
    nutrient_deficiencies: result.nutrient_deficiencies,
    economic_estimate: result.economic_estimate,
    growth_stage_label: result.growth_stage_label,
    health_label: result.health_label,
    disease_risk_level: result.disease_risk_level,
    anomalies: result.anomalies,
    warnings: result.warnings,
    fallback: result.fallback,
    ai_source: result.ai_source,
    analysis_precision: result.analysis_precision,
    cached: result.cached || false,
  };

  logger.info('[AnalyzeCrop] Analysis saved', { analysisId, crop: result.detected_crop, aiSource: result.ai_source });

  res.status(201).json({ analysis: response });
}));

// AI Analysis - Standalone image
router.post('/analyze-image', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { image_url, parcel_id } = req.body;

  if (!image_url) {
    return res.status(400).json({ error: 'image_url est requis' });
  }

  logger.info('[AnalyzeImage] Starting AI pipeline', { userId, imageUrl: image_url, parcelId: parcel_id || null });

  let parcelContext = null;
  if (parcel_id) {
    const [parcel] = await pool.query(
      `SELECT * FROM land_parcels WHERE id = ? AND user_id = ?`,
      [parcel_id, userId]
    );
    if (parcel.length > 0) {
      parcelContext = {
        soil_type: parcel[0].soil_type,
        climate_type: parcel[0].climate_type,
        region: parcel[0].region,
        annual_rainfall_mm: parcel[0].annual_rainfall_mm,
        avg_temperature: parcel[0].avg_temperature,
      };
    }
  }

  const result = await AIOrchestrator.analyze(image_url, {
    userId,
    parcelId: parcel_id,
    parcelContext,
  });

  if (!result.is_plant) {
    return res.status(400).json({
      error: 'Aucune plante detectee dans cette image',
      hint: 'Assurez-vous que la photo montre clairement une plante ou culture',
    });
  }

  const analysisId = randomUUID();

  await pool.query(
    `INSERT INTO crop_analysis_results (
      id, user_id, parcel_id, image_url, image_hash, detected_crop, confidence_score,
      health_score, disease_detected, disease_risk, recommendations,
      nutrient_deficiencies, growth_stage, is_plant, image_quality, ai_source,
      economic_estimate, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      analysisId, userId, parcel_id || null, image_url, result.image_hash || null,
      result.detected_crop, result.confidence_score, result.health_score,
      result.disease_detected, result.disease_risk,
      JSON.stringify(result.recommendations),
      JSON.stringify(result.nutrient_deficiencies),
      result.growth_stage, result.is_plant, result.image_quality,
      result.ai_source,
      result.economic_estimate ? JSON.stringify(result.economic_estimate) : null,
    ]
  );

  const [saved] = await pool.query(`SELECT * FROM crop_analysis_results WHERE id = ?`, [analysisId]);

  const response = {
    ...saved[0],
    recommendations: result.recommendations,
    nutrient_deficiencies: result.nutrient_deficiencies,
    economic_estimate: result.economic_estimate,
    growth_stage_label: result.growth_stage_label,
    health_label: result.health_label,
    disease_risk_level: result.disease_risk_level,
    anomalies: result.anomalies,
    warnings: result.warnings,
    fallback: result.fallback,
    ai_source: result.ai_source,
    analysis_precision: result.analysis_precision,
    cached: result.cached || false,
  };

  logger.info('[AnalyzeImage] Analysis saved', { analysisId, crop: result.detected_crop, aiSource: result.ai_source });

  res.status(201).json({ analysis: response });
}));

// Analysis history - parcel
router.get('/:id/analysis-history', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const parcelId = req.params.id;

  const [rows] = await pool.query(
    `SELECT * FROM crop_analysis_results WHERE parcel_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50`,
    [parcelId, userId]
  );

  const analyses = rows.map((row) => ({
    ...row,
    recommendations: typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : row.recommendations,
    nutrient_deficiencies: typeof row.nutrient_deficiencies === 'string' ? JSON.parse(row.nutrient_deficiencies) : row.nutrient_deficiencies,
    economic_estimate: typeof row.economic_estimate === 'string' ? JSON.parse(row.economic_estimate) : row.economic_estimate,
    growth_stage_label: AgronomicIntelligenceService.getGrowthStageLabel(row.growth_stage),
    health_label: AgronomicIntelligenceService.getHealthLabel(row.health_score),
  }));

  res.json({ analyses });
}));

// Analysis history - all user
router.get('/analysis-history', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const [rows] = await pool.query(
    `SELECT car.*, lp.name as parcel_name
     FROM crop_analysis_results car
     LEFT JOIN land_parcels lp ON car.parcel_id = lp.id
     WHERE car.user_id = ?
     ORDER BY car.created_at DESC
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) as total FROM crop_analysis_results WHERE user_id = ?`,
    [userId]
  );

  const analyses = rows.map((row) => ({
    ...row,
    recommendations: typeof row.recommendations === 'string' ? JSON.parse(row.recommendations) : row.recommendations,
    nutrient_deficiencies: typeof row.nutrient_deficiencies === 'string' ? JSON.parse(row.nutrient_deficiencies) : row.nutrient_deficiencies,
    economic_estimate: typeof row.economic_estimate === 'string' ? JSON.parse(row.economic_estimate) : row.economic_estimate,
    growth_stage_label: AgronomicIntelligenceService.getGrowthStageLabel(row.growth_stage),
    health_label: AgronomicIntelligenceService.getHealthLabel(row.health_score),
  }));

  res.json({ analyses, total: countRows[0].total, limit, offset });
}));

// System status
router.get('/ai-status', authMiddleware, asyncHandler(async (req, res) => {
  const status = AIOrchestrator.getSystemStatus();
  res.json({ status });
}));

module.exports = router;
