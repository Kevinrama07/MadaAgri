const pool = require('../db');

class SoilIntelligenceService {
  static SOIL_DATABASE = {
    'Antananarivo': {
      soil_type: 'Argileux',
      soil_ph: 5.8,
      soil_organic_matter: 3.2,
      climate_type: 'Tropical d\'altitude',
      annual_rainfall_mm: 1400,
      avg_temperature: 20,
    },
    'Antsirabe': {
      soil_type: 'Volcanique',
      soil_ph: 6.2,
      soil_organic_matter: 4.1,
      climate_type: 'Tempéré d\'altitude',
      annual_rainfall_mm: 1200,
      avg_temperature: 18,
    },
    'Fianarantsoa': {
      soil_type: 'Ferralitique',
      soil_ph: 5.5,
      soil_organic_matter: 3.8,
      climate_type: 'Tropical humide',
      annual_rainfall_mm: 1500,
      avg_temperature: 21,
    },
    'Toamasina': {
      soil_type: 'Latéritique',
      soil_ph: 5.2,
      soil_organic_matter: 2.8,
      climate_type: 'Tropical humide côtier',
      annual_rainfall_mm: 3300,
      avg_temperature: 26,
    },
    'Mahajanga': {
      soil_type: 'Alluvial',
      soil_ph: 6.5,
      soil_organic_matter: 2.5,
      climate_type: 'Tropical sec',
      annual_rainfall_mm: 1100,
      avg_temperature: 28,
    },
    'Antsiranana': {
      soil_type: 'Calcaire',
      soil_ph: 7.0,
      soil_organic_matter: 2.2,
      climate_type: 'Tropical sec côtier',
      annual_rainfall_mm: 1000,
      avg_temperature: 27,
    },
    'Toliara': {
      soil_type: 'Sableux',
      soil_ph: 6.8,
      soil_organic_matter: 1.8,
      climate_type: 'Aride',
      annual_rainfall_mm: 500,
      avg_temperature: 29,
    },
    'Morondava': {
      soil_type: 'Alluvial',
      soil_ph: 6.3,
      soil_organic_matter: 2.9,
      climate_type: 'Tropical sec',
      annual_rainfall_mm: 800,
      avg_temperature: 27,
    },
    'Sambava': {
      soil_type: 'Latéritique',
      soil_ph: 5.4,
      soil_organic_matter: 3.5,
      climate_type: 'Tropical humide',
      annual_rainfall_mm: 2500,
      avg_temperature: 26,
    },
    'Manakara': {
      soil_type: 'Ferralitique',
      soil_ph: 5.6,
      soil_organic_matter: 3.3,
      climate_type: 'Tropical humide côtier',
      annual_rainfall_mm: 2200,
      avg_temperature: 25,
    },
  };

  static DEFAULT_SOIL = {
    soil_type: 'Argileux',
    soil_ph: 6.0,
    soil_organic_matter: 3.0,
    climate_type: 'Tropical',
    annual_rainfall_mm: 1500,
    avg_temperature: 25,
  };

  static async getSoilData(region) {
    if (!region) return { ...this.DEFAULT_SOIL };

    const regionKey = Object.keys(this.SOIL_DATABASE).find(
      (key) => region.toLowerCase().includes(key.toLowerCase())
    );

    if (regionKey) {
      return { ...this.SOIL_DATABASE[regionKey] };
    }

    try {
      const [rows] = await pool.query(
        'SELECT soil_type, climate FROM regions WHERE LOWER(name) LIKE ?',
        [`%${region.toLowerCase()}%`]
      );

      if (rows.length > 0) {
        return {
          soil_type: rows[0].soil_type || this.DEFAULT_SOIL.soil_type,
          soil_ph: this.DEFAULT_SOIL.soil_ph,
          soil_organic_matter: this.DEFAULT_SOIL.soil_organic_matter,
          climate_type: rows[0].climate || this.DEFAULT_SOIL.climate_type,
          annual_rainfall_mm: this.DEFAULT_SOIL.annual_rainfall_mm,
          avg_temperature: this.DEFAULT_SOIL.avg_temperature,
        };
      }
    } catch (error) {
      console.error('[SoilIntelligence] DB error:', error.message);
    }

    return { ...this.DEFAULT_SOIL };
  }

  static getSoilDescription(soilType) {
    const descriptions = {
      'Argileux': 'Sol riche en argile, retient bien l\'eau mais peut être compact. Idéal pour le riz et les cultures nécessitant beaucoup d\'humidité.',
      'Volcanique': 'Sol très fertile issu de roches volcaniques. Excellent pour la plupart des cultures, particulièrement le café et les légumes.',
      'Ferralitique': 'Sol tropical riche en fer et aluminium. Bien drainé, adapté aux cultures pérennes comme la vanille et le girofle.',
      'Latéritique': 'Sol rouge tropical, bien drainé mais peut être acide. Convient au manioc, maïs et cultures tropicales.',
      'Alluvial': 'Sol fertile déposé par les rivières. Très productif pour le riz, les légumes et les cultures maraîchères.',
      'Calcaire': 'Sol alcalin riche en calcium. Adapté aux cultures tolérantes au pH élevé comme le sisal et certains fruits.',
      'Sableux': 'Sol bien drainé mais pauvre en nutriments. Nécessite fertilisation régulière. Adapté au manioc et noix de cajou.',
    };
    return descriptions[soilType] || 'Sol standard adapté à diverses cultures agricoles.';
  }

  static getSuitabilityScore(soilData) {
    let score = 50;

    if (soilData.soil_organic_matter > 3) score += 15;
    else if (soilData.soil_organic_matter > 2) score += 8;

    if (soilData.soil_ph >= 5.5 && soilData.soil_ph <= 7.0) score += 15;
    else if (soilData.soil_ph >= 5.0 && soilData.soil_ph <= 7.5) score += 8;

    if (soilData.annual_rainfall_mm >= 1000 && soilData.annual_rainfall_mm <= 2500) score += 15;
    else if (soilData.annual_rainfall_mm >= 500) score += 8;

    return Math.min(score, 95);
  }
}

module.exports = SoilIntelligenceService;
