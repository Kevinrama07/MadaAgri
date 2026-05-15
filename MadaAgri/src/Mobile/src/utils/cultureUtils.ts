import { SortField, SortOrder, CultureAnalysisResult } from '../types/culture.types';

export const KNN_NEIGHBORS = 5;

/**
 * Obtenir la couleur en fonction du score de compatibilité
 */
export function getSuitabilityColor(score: number): string {
  if (score >= 90) return '#2E7D32'; // PRIMARY
  if (score >= 75) return '#ffd43b'; // Jaune
  return '#ff8c42'; // Orange
}

/**
 * Obtenir le label en fonction du score de compatibilité
 */
export function getSuitabilityLabel(score: number): string {
  if (score >= 90) return 'Très adapté';
  if (score >= 75) return 'Adapté';
  return 'Moyennement adapté';
}

/**
 * Filtrer les cultures par nom
 */
export function filterCulturesByName(cultures: CultureAnalysisResult[], searchTerm: string): CultureAnalysisResult[] {
  if (!searchTerm || !Array.isArray(cultures)) return cultures;
  const term = searchTerm.toLowerCase();
  return cultures.filter(item => {
    if (!item) return false;
    const name = item.culture?.name || item.culture_name || '';
    const description = item.culture?.description || '';
    return name.toLowerCase().includes(term) || description.toLowerCase().includes(term);
  });
}

/**
 * Trier les cultures
 */
export function sortCultures(
  cultures: CultureAnalysisResult[], 
  sortBy: SortField = 'score', 
  order: SortOrder = 'desc'
): CultureAnalysisResult[] {
  if (!Array.isArray(cultures)) return [];
  
  const sorted = [...cultures];
  
  sorted.sort((a, b) => {
    if (!a || !b) return 0;
    
    let valueA: any, valueB: any;
    
    switch (sortBy) {
      case 'score':
        valueA = a.suitability_score || a.score || 0;
        valueB = b.suitability_score || b.score || 0;
        break;
      case 'name':
        valueA = (a.culture?.name || a.culture_name || '').toLowerCase();
        valueB = (b.culture?.name || b.culture_name || '').toLowerCase();
        break;
      case 'yield':
        valueA = parseFloat(a.culture?.yield_potential || a.average_yield || 0);
        valueB = parseFloat(b.culture?.yield_potential || b.average_yield || 0);
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
 */
export function formatGrowingPeriod(days: number): string {
  if (!days) return 'Non spécifié';
  if (days < 30) return `${days} jours`;
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;
  if (remainingDays === 0) return `${months} mois`;
  return `${months} mois ${remainingDays} jours`;
}

/**
 * Obtenir la catégorie de culture
 */
export function getCultureCategory(name: string): string {
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

/**
 * Obtenir l'icône emoji pour une catégorie
 */
export function getCategoryEmoji(category: string): string {
  switch (category) {
    case 'Céréales': return '🌾';
    case 'Légumes': return '🥬';
    case 'Fruits': return '🍎';
    case 'Légumineuses': return '🫘';
    default: return '🌱';
  }
}
