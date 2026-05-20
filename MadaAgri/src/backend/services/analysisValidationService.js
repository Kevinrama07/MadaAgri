const logger = require('../utils/logger');

const VALID_GROWTH_STAGES = ['Seedling', 'Vegetative', 'Flowering', 'Fruiting', 'Mature', 'Unknown'];
const VALID_IMAGE_QUALITIES = ['Good', 'Acceptable', 'Poor'];
const VALID_PLANT_TYPES = ['crop', 'tree', 'herb', 'vine', 'weed', 'unknown'];

class AnalysisValidationService {
  static validateAnalysisResult(analysis) {
    const errors = [];
    const warnings = [];

    if (!analysis || typeof analysis !== 'object') {
      return { valid: false, errors: ['Analysis result is null or not an object'], warnings: [] };
    }

    if (analysis.detected_crop === undefined || analysis.detected_crop === null) {
      errors.push('detected_crop is missing');
    } else if (typeof analysis.detected_crop !== 'string') {
      errors.push('detected_crop must be a string');
    } else if (analysis.detected_crop.trim().length === 0) {
      errors.push('detected_crop is empty');
    }

    if (analysis.confidence_score === undefined || analysis.confidence_score === null) {
      errors.push('confidence_score is missing');
    } else if (typeof analysis.confidence_score !== 'number') {
      errors.push('confidence_score must be a number');
    } else if (analysis.confidence_score < 0 || analysis.confidence_score > 100) {
      errors.push(`confidence_score ${analysis.confidence_score} is out of range [0, 100]`);
    }

    if (analysis.health_score === undefined || analysis.health_score === null) {
      errors.push('health_score is missing');
    } else if (typeof analysis.health_score !== 'number') {
      errors.push('health_score must be a number');
    } else if (analysis.health_score < 0 || analysis.health_score > 100) {
      errors.push(`health_score ${analysis.health_score} is out of range [0, 100]`);
    }

    if (analysis.disease_risk !== undefined && analysis.disease_risk !== null) {
      if (typeof analysis.disease_risk !== 'number') {
        errors.push('disease_risk must be a number');
      } else if (analysis.disease_risk < 0 || analysis.disease_risk > 100) {
        errors.push(`disease_risk ${analysis.disease_risk} is out of range [0, 100]`);
      }
    }

    if (analysis.disease_detected !== null && analysis.disease_detected !== undefined) {
      if (typeof analysis.disease_detected !== 'string') {
        errors.push('disease_detected must be a string or null');
      } else if (analysis.disease_detected.trim() === '') {
        warnings.push('disease_detected is empty string, setting to null');
        analysis.disease_detected = null;
      }
    }

    if (analysis.is_plant === false) {
      warnings.push('Image does not contain a plant');
    }

    if (analysis.growth_stage && !VALID_GROWTH_STAGES.includes(analysis.growth_stage)) {
      warnings.push(`Invalid growth_stage "${analysis.growth_stage}", defaulting to Unknown`);
      analysis.growth_stage = 'Unknown';
    }

    if (analysis.image_quality && !VALID_IMAGE_QUALITIES.includes(analysis.image_quality)) {
      warnings.push(`Invalid image_quality "${analysis.image_quality}", defaulting to Acceptable`);
      analysis.image_quality = 'Acceptable';
    }

    if (!Array.isArray(analysis.recommendations) || analysis.recommendations.length === 0) {
      warnings.push('No recommendations provided, adding default');
      analysis.recommendations = ['Consulter un agronome local pour des recommandations specifiques'];
    }

    if (analysis.recommendations.length > 10) {
      warnings.push('Too many recommendations, truncating to 10');
      analysis.recommendations = analysis.recommendations.slice(0, 10);
    }

    if (analysis.confidence_score < 20 && analysis.detected_crop !== 'Inconnu') {
      warnings.push('Very low confidence in crop detection');
    }

    if (analysis.health_score < 20) {
      warnings.push('Very low health score detected');
    }

    if (analysis.disease_risk > 80) {
      warnings.push('High disease risk detected');
    }

    if (errors.length > 0) {
      logger.error('[AnalysisValidation] Validation failed', { errors });
      return { valid: false, errors, warnings };
    }

    if (warnings.length > 0) {
      logger.warn('[AnalysisValidation] Validation passed with warnings', { warnings });
    }

    return { valid: true, errors: [], warnings };
  }

  static sanitizeForStorage(analysis) {
    return {
      detected_crop: analysis.detected_crop || 'Plante inconnue',
      confidence_score: Math.max(0, Math.min(100, Math.round(analysis.confidence_score || 0))),
      health_score: Math.max(0, Math.min(100, Math.round(analysis.health_score || 0))),
      disease_detected: analysis.disease_detected || null,
      disease_risk: Math.max(0, Math.min(100, Math.round(analysis.disease_risk || 0))),
      nutrient_deficiencies: Array.isArray(analysis.nutrient_deficiencies)
        ? analysis.nutrient_deficiencies.slice(0, 10).map((d) => String(d).substring(0, 200))
        : [],
      growth_stage: VALID_GROWTH_STAGES.includes(analysis.growth_stage) ? analysis.growth_stage : 'Unknown',
      recommendations: Array.isArray(analysis.recommendations)
        ? analysis.recommendations.slice(0, 10).map((r) => String(r).substring(0, 500))
        : [],
      is_plant: analysis.is_plant !== false,
      image_quality: VALID_IMAGE_QUALITIES.includes(analysis.image_quality) ? analysis.image_quality : 'Acceptable',
      plant_type: VALID_PLANT_TYPES.includes(analysis.plant_type) ? analysis.plant_type : 'unknown',
    };
  }

  static detectAnomalies(analysis) {
    const anomalies = [];

    if (analysis.confidence_score > 95 && analysis.health_score < 20) {
      anomalies.push('High confidence but very low health - possible misidentification');
    }

    if ((analysis.detected_crop === 'Plante inconnue' || analysis.detected_crop === 'Inconnu') && analysis.confidence_score > 50) {
      anomalies.push('Unknown crop with high confidence score');
    }

    if (analysis.disease_detected && analysis.disease_risk === 0) {
      anomalies.push('Disease detected but zero risk score');
    }

    if (!analysis.disease_detected && analysis.disease_risk > 50) {
      anomalies.push('No disease detected but high disease risk');
    }

    if (analysis.health_score > 90 && analysis.disease_risk > 60) {
      anomalies.push('Excellent health but high disease risk - contradictory');
    }

    return anomalies;
  }
}

module.exports = AnalysisValidationService;
