import { useState, useEffect, useCallback, useRef } from 'react';
import { analysisService } from '../services/analysisService';
import { dataApi } from '../lib/api';
import { CultureAnalysisResult, CultureAnalysisState } from '../types/culture.types';

const KNN_NEIGHBORS = 5;

export function useCultureAnalysis(regionId: number | null): CultureAnalysisState {
  const [cultures, setCultures] = useState<CultureAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCultures = useCallback(async (isRefreshing = false) => {
    if (!regionId) {
      setCultures([]);
      setError(null);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // Essayer d'abord avec k-NN
      const knnResults = await dataApi.fetchKnnCultures(regionId, KNN_NEIGHBORS);
      if (!abortControllerRef.current?.signal.aborted) {
        setCultures(knnResults);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      
      console.error('[useCultureAnalysis] Erreur k-NN:', err);
      
      // Fallback sur fetchRegionCultures
      try {
        const fallbackResults = await analysisService.fetchRegionCultures(regionId);
        if (!abortControllerRef.current?.signal.aborted) {
          setCultures(fallbackResults);
        }
      } catch (fallbackErr: any) {
        if (fallbackErr.name === 'AbortError') return;
        
        console.error('[useCultureAnalysis] Erreur fallback:', fallbackErr);
        if (!abortControllerRef.current?.signal.aborted) {
          setError('Impossible de charger les cultures pour cette région');
          setCultures([]);
        }
      }
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [regionId]);

  useEffect(() => {
    fetchCultures();
    
    // Cleanup: annuler les requêtes en cours lors du démontage
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCultures]);

  const refresh = useCallback(() => {
    fetchCultures(true);
  }, [fetchCultures]);

  return {
    cultures,
    loading,
    error,
    refreshing,
    refresh,
  };
}
