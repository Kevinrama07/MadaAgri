const logger = require('../utils/logger');

const CROP_CARE_GUIDES = {
  'Riz': {
    irrigation: 'Maintenir 5-10 cm d\'eau en permanence pendant la phase de croissance',
    fertilization: 'Apporter N-P-K en ratio 90-60-60 kg/ha, azote en 2-3 apports fractionnes',
    pest_control: 'Surveiller le charancon et la pyrale. Utiliser des varietes resistantes',
    harvest: 'Recolter quand 80-85% des grains sont matures, environ 90-150 jours apres semis',
    soil_prep: 'Preparer le sol par repiquage, maintenir une couche d\'eau de 5 cm',
  },
  'Vanille': {
    irrigation: 'Arrosage regulier en saison seche, bon drainage en saison des pluies',
    fertilization: 'Compost organique 2-3 kg/pied/an, engrais NPK leger en debut de saison',
    pest_control: 'Surveiller la fusariose et les cochenilles. Desinfecter les outils',
    harvest: 'Recolter les gousses quand elles jaunissent a l\'extremite, 3-4 ans apres plantation',
    soil_prep: 'Sol riche en matiere organique, pH 5.5-7.0, ombrage 50-60%',
  },
  'Cafe': {
    irrigation: 'Irrigation d\'appoint en saison seche, 30-50 mm/semaine',
    fertilization: 'NPK 120-60-120 kg/ha/an, compost 5-10 t/ha',
    pest_control: 'Traiter la rouille avec fongicide cuivre. Surveiller le scolyte',
    harvest: 'Recolter les cerises rouges a maturite, 3-5 ans apres plantation',
    soil_prep: 'Sol volcanique ideal, pH 5.5-6.5, altitude 800-1800m',
  },
  'Manioc': {
    irrigation: 'Tolerant a la secheresse, irrigation uniquement en cas de stress hydrique severe',
    fertilization: 'NPK 80-40-80 kg/ha, potassium important pour le rendement',
    pest_control: 'Surveiller la mosaique et les cochenilles. Utiliser des boutures saines',
    harvest: 'Recolter a 8-12 mois quand les feuilles jaunissent',
    soil_prep: 'Sol bien draine, pH 4.5-8.0, buttes de 30-40 cm de hauteur',
  },
  'Mais': {
    irrigation: 'Besoin critique en eau pendant la floraison, 400-600 mm/cycle',
    fertilization: 'NPK 120-60-60 kg/ha, azote en 2 apports (semis et 30 jours)',
    pest_control: 'Surveiller la chenille legionnaire et le striga. Rotation culturale',
    harvest: 'Recolter quand les grains sont durs et le husk sec, 90-120 jours',
    soil_prep: 'Sol profond et bien draine, pH 5.5-7.5, espacement 75x25 cm',
  },
  'Tomate': {
    irrigation: 'Arrosage regulier au pied, eviter le mouillage du feuillage',
    fertilization: 'NPK 150-80-150 kg/ha, calcium pour prevenir la necrose apicale',
    pest_control: 'Traiter le mildiou preventivement. Tuteurer les plants',
    harvest: 'Recolter a maturite selon le marche (vert ou rouge)',
    soil_prep: 'Sol riche, pH 6.0-7.0, rotation de 3 ans minimum',
  },
  'Banane': {
    irrigation: 'Besoin important en eau, 1500-2000 mm/an, irrigation en saison seche',
    fertilization: 'NPK 300-100-400 kg/ha/an, apports fractionnes tous les 2 mois',
    pest_control: 'Surveiller la maladie de Panama et les nematodes. Desinfecter le materiel',
    harvest: 'Recolter les regimes quand les fruits sont pleins et angles arrondis',
    soil_prep: 'Sol profond et riche, pH 5.5-7.0, drainage essentiel',
  },
  'Cacao': {
    irrigation: 'Humidite constante, 1500-2500 mm/an, ombrage 50%',
    fertilization: 'NPK 200-60-200 kg/ha/an, magnesium et bore importants',
    pest_control: 'Surveiller la pourriture brune et les mirides. Eliminer les cabosses malades',
    harvest: 'Recolter les cabosses matures, 3-5 ans apres plantation',
    soil_prep: 'Sol riche en matiere organique, pH 5.5-7.0, altitude < 800m',
  },
  'Poivre': {
    irrigation: 'Humidite constante mais bon drainage, 1500-3000 mm/an',
    fertilization: 'NPK 150-50-200 kg/ha/an, matiere organique abondante',
    pest_control: 'Surveiller le phytophthora et les nematodes. Tuteurs vivants recommandes',
    harvest: 'Recolter les grappes quand les baies sont rouges, 3-4 ans',
    soil_prep: 'Sol riche et bien draine, pH 5.5-7.0, tuteurs a 2-3 m',
  },
  'Girofle': {
    irrigation: 'Tolere la secheresse moderee, 1500-2500 mm/an ideal',
    fertilization: 'Compost 5-10 kg/pied/an, NPK leger en debut de saison',
    pest_control: 'Surveiller les champignons du collet. Espacement adequat',
    harvest: 'Recolter les boutons floraux avant ouverture, 5-7 ans',
    soil_prep: 'Sol profond, pH 5.5-7.0, altitude 0-800m, espacement 8x8 m',
  },
  'Litchi': {
    irrigation: 'Irrigation en saison seche avant floraison, stress hydrique controle pour induire floraison',
    fertilization: 'NPK 200-100-300 kg/ha/an, zinc et bore importants',
    pest_control: 'Surveiller les chenilles et les mouches des fruits',
    harvest: 'Recolter quand les fruits sont colores, 5-8 ans apres plantation',
    soil_prep: 'Sol profond et bien draine, pH 5.5-7.0, protection contre le vent',
  },
  'Pomme de terre': {
    irrigation: 'Humidite constante, 500-700 mm/cycle, irrigation goutte-a-goutte ideale',
    fertilization: 'NPK 150-100-200 kg/ha, potassium crucial pour le rendement',
    pest_control: 'Traiter le mildiou preventivement. Rotation de 3 ans minimum',
    harvest: 'Recolter quand le feuillage jaunit, 90-120 jours',
    soil_prep: 'Sol meuble et bien draine, pH 5.0-6.5, buttage essentiel',
  },
};

const DISEASE_TREATMENTS = {
  'Mildiou': {
    treatment: 'Traitement au cuivre (bouillie bordelaise) preventif. Eliminer les parties infectees',
    prevention: 'Espacement adequat, eviter l\'arrosage du feuillage, varietes resistantes',
    urgency: 'high',
  },
  'Fusariose': {
    treatment: 'Desinfecter le sol, utiliser des varietes resistantes. Fongicide systemique',
    prevention: 'Rotation culturale 3-4 ans, drainage adequat, semences certifiees',
    urgency: 'high',
  },
  'Rouille du cafeier': {
    treatment: 'Fongicide cuivre, tailler les branches infectees. Varietes resistantes',
    prevention: 'Ombrage adequat, fertilisation equilibree, espacement adequat',
    urgency: 'medium',
  },
  'Mosaïque': {
    treatment: 'Arracher les plants infectes. Utiliser des boutures certifiees saines',
    prevention: 'Controle des vecteurs (pucerons), varietes resistantes, hygiene',
    urgency: 'high',
  },
  'Striga': {
    treatment: 'Desherbage manuel avant floraison. Rotation avec legumineuses',
    prevention: 'Rotation culturale, varietes resistantes, semis precoce',
    urgency: 'medium',
  },
  'Maladie de Panama': {
    treatment: 'Aucun traitement curatif. Arracher les plants infectes',
    prevention: 'Varietes resistantes, drainage, pas de replantation sur sol infecte',
    urgency: 'critical',
  },
  'Pourriture brune': {
    treatment: 'Fongicide a base de cuivre. Eliminer les cabosses malades',
    prevention: 'Ombrage adequat, drainage, espacement, hygiene',
    urgency: 'high',
  },
  'Phytophthora': {
    treatment: 'Fongicide systemique. Ameliorer le drainage',
    prevention: 'Bon drainage, pas d\'eau stagnante, varietes resistantes',
    urgency: 'high',
  },
  'Doryphore': {
    treatment: 'Traitement insecticide cible. Collecte manuelle des adultes',
    prevention: 'Rotation culturale, pieges, varietes resistantes',
    urgency: 'medium',
  },
};

const SEASONAL_ADVICE = {
  'Tropical humide': {
    'saison_pluies': 'Surveiller les maladies fongiques. Drainage essentiel',
    'saison_seche': 'Irrigation d\'appoint. Paillage pour conserver l\'humidite',
  },
  'Tropical sec': {
    'saison_pluies': 'Profiter des pluies pour semer. Preparer les reserves d\'eau',
    'saison_seche': 'Irrigation critique. Cultures tolerantes a la secheresse',
  },
  'Tropical d\'altitude': {
    'saison_pluies': 'Proteger contre le froid et l\'humidite. Serres recommandees',
    'saison_seche': 'Irrigation moderee. Proteger contre les UV intenses',
  },
  'Aride': {
    'saison_pluies': 'Captation maximale de l\'eau. Cultures a cycle court',
    'saison_seche': 'Irrigation minimale. Cultures xerophiles uniquement',
  },
};

class AgronomicIntelligenceService {
  static generateRecommendations(analysis, parcelData = null) {
    const recommendations = [];
    const cropGuide = CROP_CARE_GUIDES[analysis.detected_crop];

    if (cropGuide) {
      recommendations.push({
        category: 'Irrigation',
        priority: 'medium',
        text: cropGuide.irrigation,
      });

      recommendations.push({
        category: 'Fertilisation',
        priority: 'medium',
        text: cropGuide.fertilization,
      });

      recommendations.push({
        category: 'Protection',
        priority: 'medium',
        text: cropGuide.pest_control,
      });

      recommendations.push({
        category: 'Recolte',
        priority: 'low',
        text: cropGuide.harvest,
      });
    }

    if (analysis.disease_detected) {
      const treatment = DISEASE_TREATMENTS[analysis.disease_detected];
      if (treatment) {
        recommendations.unshift({
          category: 'ALERTE MALADIE',
          priority: treatment.urgency === 'critical' ? 'critical' : treatment.urgency === 'high' ? 'high' : 'medium',
          text: `${analysis.disease_detected} detectee - ${treatment.treatment}`,
        });

        recommendations.push({
          category: 'Prevention',
          priority: 'high',
          text: `Prevention ${analysis.disease_detected}: ${treatment.prevention}`,
        });
      } else {
        recommendations.unshift({
          category: 'ALERTE MALADIE',
          priority: 'high',
          text: `${analysis.disease_detected} detectee - Consulter un agronome pour le traitement approprie`,
        });
      }
    }

    if (analysis.nutrient_deficiencies && analysis.nutrient_deficiencies.length > 0) {
      recommendations.push({
        category: 'Nutriments',
        priority: 'medium',
        text: `Carences detectees: ${analysis.nutrient_deficiencies.join(', ')}. Apporter les elements manquants`,
      });
    }

    if (analysis.health_score < 50) {
      recommendations.push({
        category: 'Sante de la culture',
        priority: 'high',
        text: 'Sante de la culture faible. Inspection approfondie recommandee',
      });
    }

    if (parcelData) {
      const climateAdvice = SEASONAL_ADVICE[parcelData.climate_type];
      if (climateAdvice) {
        recommendations.push({
          category: 'Conseil saisonnier',
          priority: 'low',
          text: `${climateAdvice.saison_pluies} (saison des pluies) / ${climateAdvice.saison_seche} (saison seche)`,
        });
      }

      if (parcelData.soil_type) {
        recommendations.push({
          category: 'Type de sol',
          priority: 'low',
          text: `Sol ${parcelData.soil_type} - Adapter les pratiques culturales en consequence`,
        });
      }
    }

    if (analysis.image_quality === 'Poor') {
      recommendations.push({
        category: 'Qualite d\'image',
        priority: 'low',
        text: 'Image de qualite faible. Prendre une photo plus nette pour une analyse plus precise',
      });
    }

    return recommendations;
  }

  static getEconomicEstimate(crop, healthScore, region) {
    const economicData = {
      'Riz': { revenue_per_ha: 1500000, cost_per_ha: 800000, currency: 'Ar' },
      'Vanille': { revenue_per_ha: 15000000, cost_per_ha: 3000000, currency: 'Ar' },
      'Cafe': { revenue_per_ha: 3000000, cost_per_ha: 1500000, currency: 'Ar' },
      'Manioc': { revenue_per_ha: 2000000, cost_per_ha: 600000, currency: 'Ar' },
      'Mais': { revenue_per_ha: 2500000, cost_per_ha: 1000000, currency: 'Ar' },
      'Tomate': { revenue_per_ha: 4000000, cost_per_ha: 2000000, currency: 'Ar' },
      'Banane': { revenue_per_ha: 5000000, cost_per_ha: 2500000, currency: 'Ar' },
      'Cacao': { revenue_per_ha: 4000000, cost_per_ha: 2000000, currency: 'Ar' },
      'Poivre': { revenue_per_ha: 6000000, cost_per_ha: 2500000, currency: 'Ar' },
      'Girofle': { revenue_per_ha: 5000000, cost_per_ha: 1500000, currency: 'Ar' },
      'Litchi': { revenue_per_ha: 8000000, cost_per_ha: 3000000, currency: 'Ar' },
      'Pomme de terre': { revenue_per_ha: 3500000, cost_per_ha: 1800000, currency: 'Ar' },
    };

    const data = economicData[crop];
    if (!data) return null;

    const healthFactor = healthScore / 100;

    return {
      estimated_revenue: Math.round(data.revenue_per_ha * healthFactor),
      estimated_cost: data.cost_per_ha,
      estimated_profit: Math.round(data.revenue_per_ha * healthFactor - data.cost_per_ha),
      margin_percent: Math.round(((data.revenue_per_ha * healthFactor - data.cost_per_ha) / (data.revenue_per_ha * healthFactor)) * 100),
      currency: data.currency,
    };
  }

  static getGrowthStageLabel(stage) {
    const labels = {
      'Seedling': 'Plantule (0-30 jours)',
      'Vegetative': 'Phase vegetative (30-60 jours)',
      'Flowering': 'Floraison (60-90 jours)',
      'Fruiting': 'Fructification (90-120 jours)',
      'Mature': 'Maturite (120+ jours)',
      'Unknown': 'Stade indeterminé',
    };
    return labels[stage] || 'Stade indeterminé';
  }

  static getHealthLabel(score) {
    if (score >= 80) return { label: 'Excellent', color: 'success' };
    if (score >= 60) return { label: 'Bon', color: 'info' };
    if (score >= 40) return { label: 'Moyen', color: 'warning' };
    return { label: 'Faible', color: 'error' };
  }

  static getDiseaseRiskLevel(risk) {
    if (risk >= 70) return { level: 'Critique', color: 'error', action: 'Traitement immediat requis' };
    if (risk >= 40) return { level: 'Modere', color: 'warning', action: 'Surveillance renforcee' };
    if (risk > 0) return { level: 'Faible', color: 'info', action: 'Prevention recommandee' };
    return { level: 'Aucun', color: 'success', action: 'Aucune action requise' };
  }
}

module.exports = AgronomicIntelligenceService;
