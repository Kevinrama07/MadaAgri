const pool = require('../db');

class CropRecommendationEngine {
  static CROP_PROFILES = {
    'Riz': {
      ideal_soil: ['Argileux', 'Alluvial', 'Ferralitique'],
      ideal_climate: ['Tropical humide', 'Tropical d\'altitude', 'Tropical humide côtier'],
      min_rainfall: 1000,
      max_rainfall: 3000,
      min_temp: 20,
      max_temp: 35,
      min_ph: 5.0,
      max_ph: 7.5,
      yield_potential: '4-6 t/ha',
      growing_period: '90-150 jours',
    },
    'Vanille': {
      ideal_soil: ['Ferralitique', 'Latéritique', 'Volcanique'],
      ideal_climate: ['Tropical humide', 'Tropical humide côtier'],
      min_rainfall: 1500,
      max_rainfall: 3000,
      min_temp: 21,
      max_temp: 32,
      min_ph: 5.5,
      max_ph: 7.0,
      yield_potential: '1-2 t/ha',
      growing_period: '3-4 ans (première récolte)',
    },
    'Café': {
      ideal_soil: ['Volcanique', 'Ferralitique', 'Latéritique'],
      ideal_climate: ['Tropical d\'altitude', 'Tempéré d\'altitude', 'Tropical humide'],
      min_rainfall: 1200,
      max_rainfall: 2200,
      min_temp: 15,
      max_temp: 25,
      min_ph: 5.5,
      max_ph: 6.5,
      yield_potential: '1.5-3 t/ha',
      growing_period: '3-5 ans (première récolte)',
    },
    'Manioc': {
      ideal_soil: ['Sableux', 'Latéritique', 'Alluvial', 'Argileux'],
      ideal_climate: ['Tropical sec', 'Tropical', 'Tropical humide', 'Aride'],
      min_rainfall: 500,
      max_rainfall: 2500,
      min_temp: 20,
      max_temp: 35,
      min_ph: 4.5,
      max_ph: 8.0,
      yield_potential: '10-25 t/ha',
      growing_period: '8-12 mois',
    },
    'Maïs': {
      ideal_soil: ['Alluvial', 'Latéritique', 'Argileux', 'Volcanique'],
      ideal_climate: ['Tropical', 'Tropical sec', 'Tropical d\'altitude'],
      min_rainfall: 600,
      max_rainfall: 1800,
      min_temp: 18,
      max_temp: 32,
      min_ph: 5.5,
      max_ph: 7.5,
      yield_potential: '3-8 t/ha',
      growing_period: '90-120 jours',
    },
    'Girofle': {
      ideal_soil: ['Latéritique', 'Ferralitique', 'Volcanique'],
      ideal_climate: ['Tropical humide', 'Tropical humide côtier'],
      min_rainfall: 1500,
      max_rainfall: 2500,
      min_temp: 20,
      max_temp: 30,
      min_ph: 5.5,
      max_ph: 7.0,
      yield_potential: '0.5-1.5 t/ha',
      growing_period: '5-7 ans (première récolte)',
    },
    'Poivre': {
      ideal_soil: ['Latéritique', 'Ferralitique', 'Alluvial'],
      ideal_climate: ['Tropical humide', 'Tropical humide côtier'],
      min_rainfall: 1500,
      max_rainfall: 3000,
      min_temp: 22,
      max_temp: 32,
      min_ph: 5.5,
      max_ph: 7.0,
      yield_potential: '0.5-2 t/ha',
      growing_period: '3-4 ans (première récolte)',
    },
    'Cacao': {
      ideal_soil: ['Latéritique', 'Ferralitique', 'Alluvial'],
      ideal_climate: ['Tropical humide', 'Tropical humide côtier'],
      min_rainfall: 1500,
      max_rainfall: 2500,
      min_temp: 21,
      max_temp: 32,
      min_ph: 5.5,
      max_ph: 7.0,
      yield_potential: '1-3 t/ha',
      growing_period: '3-5 ans (première récolte)',
    },
    'Litchi': {
      ideal_soil: ['Latéritique', 'Ferralitique', 'Alluvial'],
      ideal_climate: ['Tropical humide', 'Tropical humide côtier', 'Tropical sec'],
      min_rainfall: 1000,
      max_rainfall: 2500,
      min_temp: 18,
      max_temp: 32,
      min_ph: 5.5,
      max_ph: 7.0,
      yield_potential: '5-15 t/ha',
      growing_period: '5-8 ans (première récolte)',
    },
    'Noix de cajou': {
      ideal_soil: ['Sableux', 'Latéritique', 'Alluvial'],
      ideal_climate: ['Tropical sec', 'Aride', 'Tropical'],
      min_rainfall: 500,
      max_rainfall: 1500,
      min_temp: 22,
      max_temp: 35,
      min_ph: 5.0,
      max_ph: 7.5,
      yield_potential: '1-5 t/ha',
      growing_period: '3-5 ans (première récolte)',
    },
  };

  static async recommendCrops(soilData) {
    const recommendations = [];

    for (const [cropName, profile] of Object.entries(this.CROP_PROFILES)) {
      let score = 0;
      let maxScore = 0;

      maxScore += 30;
      if (profile.ideal_soil.includes(soilData.soil_type)) score += 30;
      else score += 10;

      maxScore += 25;
      if (profile.ideal_climate.includes(soilData.climate_type)) score += 25;
      else score += 8;

      maxScore += 15;
      if (soilData.annual_rainfall_mm >= profile.min_rainfall && soilData.annual_rainfall_mm <= profile.max_rainfall) {
        score += 15;
      } else if (soilData.annual_rainfall_mm >= profile.min_rainfall * 0.7 && soilData.annual_rainfall_mm <= profile.max_rainfall * 1.3) {
        score += 8;
      }

      maxScore += 15;
      if (soilData.avg_temperature >= profile.min_temp && soilData.avg_temperature <= profile.max_temp) {
        score += 15;
      } else if (soilData.avg_temperature >= profile.min_temp - 3 && soilData.avg_temperature <= profile.max_temp + 3) {
        score += 8;
      }

      maxScore += 15;
      if (soilData.soil_ph >= profile.min_ph && soilData.soil_ph <= profile.max_ph) {
        score += 15;
      } else if (soilData.soil_ph >= profile.min_ph - 0.5 && soilData.soil_ph <= profile.max_ph + 0.5) {
        score += 8;
      }

      const suitabilityScore = Math.round((score / maxScore) * 100);

      if (suitabilityScore >= 40) {
        recommendations.push({
          name: cropName,
          suitability_score: suitabilityScore,
          yield_potential: profile.yield_potential,
          growing_period: profile.growing_period,
          ideal_soil: profile.ideal_soil.join(', '),
          ideal_climate: profile.ideal_climate.join(', '),
        });
      }
    }

    recommendations.sort((a, b) => b.suitability_score - a.suitability_score);

    return recommendations.slice(0, 8);
  }

  static async getRecommendationsFromDB(regionId) {
    try {
      const [rows] = await pool.query(
        `SELECT c.name, rc.suitability_score, c.yield_potential, c.growing_period_days, c.ideal_soil, c.ideal_climate
         FROM region_cultures rc
         JOIN cultures c ON rc.culture_id = c.id
         WHERE rc.region_id = ?
         ORDER BY rc.suitability_score DESC
         LIMIT 8`,
        [regionId]
      );

      return rows.map((row) => ({
        name: row.name,
        suitability_score: row.suitability_score,
        yield_potential: row.yield_potential || 'N/A',
        growing_period: row.growing_period_days ? `${row.growing_period_days} jours` : 'N/A',
        ideal_soil: row.ideal_soil || 'N/A',
        ideal_climate: row.ideal_climate || 'N/A',
      }));
    } catch (error) {
      console.error('[CropRecommendation] DB error:', error.message);
      return [];
    }
  }
}

module.exports = CropRecommendationEngine;
