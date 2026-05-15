import { dataApi } from '../lib/api';

export interface RegionCulture {
  culture_id: number;
  culture_name: string;
  region_id: number;
  region_name: string;
  total_production: number;
  average_yield: number;
  farmers_count: number;
}

export interface Culture {
  id: number;
  name: string;
  description?: string;
  ideal_soil?: string;
  ideal_climate?: string;
  growing_period_days?: number;
  yield_potential?: string;
}

export interface CultureRecommendation {
  culture: Culture;
  suitability_score: number;
  reason?: string;
}

export interface Delivery {
  id: string;
  farmer_id: string;
  product_id: string;
  product_title: string;
  quantity: number;
  destination: string;
  status: 'pending' | 'in_transit' | 'delivered';
  created_at: string;
}

// Cache pour les cultures
const cultureCache = new Map<number, { data: any[], timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class AnalysisService {
  /**
   * Récupérer les cultures d'une région avec cache
   */
  async fetchRegionCultures(regionId: number): Promise<RegionCulture[]> {
    try {
      // Vérifier le cache
      const cached = cultureCache.get(regionId);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[AnalysisService] Cultures depuis cache');
        return cached.data;
      }

      const cultures = await dataApi.fetchRegionCultures(regionId);
      
      // Mettre en cache
      cultureCache.set(regionId, {
        data: cultures,
        timestamp: Date.now(),
      });
      
      return cultures;
    } catch (error) {
      console.error('[AnalysisService] Erreur fetchRegionCultures:', error);
      // Retourner tableau vide au lieu de throw
      return [];
    }
  }

  /**
   * Récupérer les livraisons d'un agriculteur
   */
  async fetchDeliveries(farmerId: string): Promise<Delivery[]> {
    try {
      const deliveries = await (dataApi as any).fetchDeliveries?.(farmerId) || [];
      return deliveries;
    } catch (error) {
      console.error('[AnalysisService] Erreur fetchDeliveries:', error);
      throw error;
    }
  }

  /**
   * Récupérer les recommandations KNN pour les cultures avec cache
   */
  async fetchKnnCultures(
    regionId: number,
    k: number = 5
  ): Promise<CultureRecommendation[]> {
    try {
      const cacheKey = regionId * 1000 + k; // Clé unique pour région + k
      const cached = cultureCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[AnalysisService] KNN depuis cache');
        return cached.data;
      }

      const recommendations = await dataApi.fetchKnnCultures(regionId, k);
      
      // Mettre en cache
      cultureCache.set(cacheKey, {
        data: recommendations,
        timestamp: Date.now(),
      });
      
      return recommendations;
    } catch (error) {
      console.error('[AnalysisService] Erreur fetchKnnCultures:', error);
      // Retourner tableau vide au lieu de throw
      return [];
    }
  }

  /**
   * Vider le cache
   */
  clearCache(): void {
    cultureCache.clear();
    console.log('[AnalysisService] Cache vidé');
  }

  /**
   * Calculer les statistiques de production
   */
  calculateProductionStats(cultures: RegionCulture[]) {
    if (cultures.length === 0) {
      return {
        totalProduction: 0,
        averageYield: 0,
        topCulture: null,
      };
    }

    const totalProduction = cultures.reduce((sum, c) => sum + c.total_production, 0);
    const averageYield =
      cultures.reduce((sum, c) => sum + c.average_yield, 0) / cultures.length;
    const topCulture = cultures.reduce((max, c) =>
      c.total_production > (max?.total_production || 0) ? c : max
    );

    return {
      totalProduction,
      averageYield,
      topCulture,
    };
  }

  /**
   * Formater les données pour graphique
   */
  formatChartData(cultures: RegionCulture[]) {
    return {
      labels: cultures.map((c) => c.culture_name),
      datasets: [
        {
          label: 'Production totale',
          data: cultures.map((c) => c.total_production),
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Rendement moyen',
          data: cultures.map((c) => c.average_yield),
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
        },
      ],
    };
  }
}

/**
 * OptimizationService - Service pour l'optimisation d'itinéraires
 * Gère les algorithmes Dijkstra et optimisation de routes
 */

export interface Route {
  waypoints: Array<{
    region_id: number;
    region_name: string;
    latitude: number;
    longitude: number;
  }>;
  distance: number;
  duration: number;
  optimized: boolean;
}

export interface RouteComparison {
  dijkstra: Route;
  nearest_neighbor: Route;
  genetic_algorithm: Route;
  best: 'dijkstra' | 'nearest_neighbor' | 'genetic_algorithm';
}

class OptimizationService {
  /**
   * Récupérer la route optimale entre deux régions (Dijkstra)
   */
  async fetchDijkstraRoute(
    startRegionId: number,
    endRegionId: number
  ): Promise<Route> {
    try {
      const route = await (dataApi as any).fetchDijkstraRoute?.(startRegionId, endRegionId) || [];
      return route;
    } catch (error) {
      console.error('[OptimizationService] Erreur fetchDijkstraRoute:', error);
      throw error;
    }
  }

  /**
   * Optimiser les routes de livraison
   */
  async optimizeRoutes(
    deliveries: Delivery[],
    options: { depot?: any } = {}
  ): Promise<Route> {
    try {
      const optimized = await (dataApi as any).optimizeRoutes?.(deliveries, options) || deliveries;
      return optimized;
    } catch (error) {
      console.error('[OptimizationService] Erreur optimizeRoutes:', error);
      throw error;
    }
  }

  /**
   * Calculer la distance entre deux points
   */
  async calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): Promise<number> {
    try {
      const distance = await (dataApi as any).calculateDistance?.(lat1, lon1, lat2, lon2) || 0;
      return distance;
    } catch (error) {
      console.error('[OptimizationService] Erreur calculateDistance:', error);
      throw error;
    }
  }

  /**
   * Réoptimiser après suppression d'une livraison
   */
  async reoptimizeAfterRemoval(
    currentRoute: Route,
    deliveryId: string
  ): Promise<Route> {
    try {
      const reoptimized = await (dataApi as any).reoptimizeAfterRemoval?.(
        currentRoute,
        deliveryId
      );
      return reoptimized;
    } catch (error) {
      console.error('[OptimizationService] Erreur reoptimizeAfterRemoval:', error);
      throw error;
    }
  }

  /**
   * Comparer les algorithmes d'optimisation
   */
  async compareAlgorithms(
    deliveries: Delivery[],
    depot?: any
  ): Promise<RouteComparison> {
    try {
      const comparison = await (dataApi as any).compareAlgorithms?.(deliveries, depot) || {};
      return comparison;
    } catch (error) {
      console.error('[OptimizationService] Erreur compareAlgorithms:', error);
      throw error;
    }
  }

  /**
   * Calculer la distance totale d'une route
   */
  calculateTotalDistance(route: Route): number {
    return route.distance;
  }

  /**
   * Formater la durée
   */
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}

export const analysisService = new AnalysisService();
export const optimizationService = new OptimizationService();

export default {
  analysisService,
  optimizationService,
};
