/**
 * Utilitaires pour l'analyse des cultures
 */

export const KNN_NEIGHBORS = 5;

/**
 * Obtenir la couleur en fonction du score de compatibilité
 * @param {number} score - Score de compatibilité (0-100)
 * @returns {string} Couleur CSS
 */
export function getSuitabilityColor(score) {
  if (score >= 90) return 'var(--mg-primary)';
  if (score >= 75) return '#ffd43b';
  return '#ff8c42';
}

/**
 * Obtenir le label en fonction du score de compatibilité
 * @param {number} score - Score de compatibilité (0-100)
 * @returns {string} Label descriptif
 */
export function getSuitabilityLabel(score) {
  if (score >= 90) return 'Très adapté';
  if (score >= 75) return 'Adapté';
  return 'Moyennement adapté';
}

/**
 * Filtrer les cultures par nom
 * @param {Array} cultures - Liste des cultures
 * @param {string} searchTerm - Terme de recherche
 * @returns {Array} Cultures filtrées
 */
export function filterCulturesByName(cultures, searchTerm) {
  if (!searchTerm || !Array.isArray(cultures)) return cultures;
  const term = searchTerm.toLowerCase();
  return cultures.filter(item => {
    if (!item || !item.culture) return false;
    const name = item.culture.name || '';
    const description = item.culture.description || '';
    return name.toLowerCase().includes(term) || description.toLowerCase().includes(term);
  });
}

/**
 * Trier les cultures
 * @param {Array} cultures - Liste des cultures
 * @param {string} sortBy - Critère de tri (score, name, yield, growth)
 * @param {string} order - Ordre (asc, desc)
 * @returns {Array} Cultures triées
 */
export function sortCultures(cultures, sortBy = 'score', order = 'desc') {
  if (!Array.isArray(cultures)) return [];
  
  const sorted = [...cultures];
  
  sorted.sort((a, b) => {
    // Protection contre les données nulles
    if (!a || !b) return 0;
    
    let valueA, valueB;
    
    switch (sortBy) {
      case 'score':
        valueA = a.suitability_score || 0;
        valueB = b.suitability_score || 0;
        break;
      case 'name':
        valueA = (a.culture?.name || '').toLowerCase();
        valueB = (b.culture?.name || '').toLowerCase();
        break;
      case 'yield':
        valueA = parseFloat(a.culture?.yield_potential) || 0;
        valueB = parseFloat(b.culture?.yield_potential) || 0;
        break;
      case 'growth':
        valueA = a.culture?.growing_period_days || 0;
        valueB = b.culture?.growing_period_days || 0;
        break;
      default:
        return 0;
    }
    
    if (order === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
  
  return sorted;
}

/**
 * Formater la période de croissance
 * @param {number} days - Nombre de jours
 * @returns {string} Période formatée
 */
export function formatGrowingPeriod(days) {
  if (!days) return 'Non spécifié';
  if (days < 30) return `${days} jours`;
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  if (remainingDays === 0) return `${months} mois`;
  return `${months} mois ${remainingDays} jours`;
}

/**
 * Obtenir la catégorie de culture
 * @param {string} name - Nom de la culture
 * @returns {string} Catégorie
 */
export function getCultureCategory(name) {
  if (!name || typeof name !== 'string') return 'Autre';
  
  const cereals = ['riz', 'maïs', 'blé', 'orge', 'avoine', 'sorgho', 'millet'];
  const vegetables = ['tomate', 'carotte', 'pomme de terre', 'oignon', 'chou', 'salade', 'haricot'];
  const fruits = ['banane', 'mangue', 'orange', 'citron', 'ananas', 'papaye', 'avocat'];
  const legumes = ['haricot', 'pois', 'lentille', 'soja', 'arachide'];
  
  const lowerName = name.toLowerCase();
  
  if (cereals.some(c => lowerName.includes(c))) return 'Céréales';
  if (vegetables.some(v => lowerName.includes(v))) return 'Légumes';
  if (fruits.some(f => lowerName.includes(f))) return 'Fruits';
  if (legumes.some(l => lowerName.includes(l))) return 'Légumineuses';
  
  return 'Autre';
}
