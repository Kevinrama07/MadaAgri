/**
 * Types partagés pour les cultures - Mobile
 */

export interface Region {
  id: number;
  name: string;
  soil_type?: string;
  climate?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
}

export interface CultureData {
  id: number;
  name: string;
  description?: string;
  ideal_soil?: string;
  ideal_climate?: string;
  growing_period_days?: number;
  yield_potential?: string;
  water_requirements?: string;
  temperature_min?: number;
  temperature_max?: number;
  category?: string;
}

export interface CultureAnalysisResult {
  culture?: CultureData;
  culture_name?: string;
  suitability_score?: number;
  score?: number;
  distance?: number;
  average_yield?: number;
  recommended?: boolean;
}

export interface CultureAnalysisState {
  cultures: CultureAnalysisResult[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  refresh: () => void;
}

export type SortField = 'score' | 'name' | 'yield' | 'growth';
export type SortOrder = 'asc' | 'desc';

export type CultureCategory = 'Céréales' | 'Légumes' | 'Fruits' | 'Légumineuses' | 'Autre';

export interface FilterOptions {
  searchTerm: string;
  category: CultureCategory | 'all';
  sortBy: SortField;
  sortOrder: SortOrder;
  minScore?: number;
  maxGrowingPeriod?: number;
}
