import { useState, useEffect, useCallback, useRef } from 'react';
import { dataApi } from '../lib/api';
import { Region } from '../types/culture.types';

interface UseRegionsResult {
  regions: Region[];
  selectedRegion: Region | null;
  loading: boolean;
  error: string | null;
  setSelectedRegion: (region: Region | null) => void;
  refresh: () => Promise<void>;
}

const CACHE_KEY = 'regions_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export function useRegions(): UseRegionsResult {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheTimestampRef = useRef<number>(0);

  const fetchRegions = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const isCacheValid = now - cacheTimestampRef.current < CACHE_DURATION;

    // Utiliser le cache si valide et pas de forceRefresh
    if (!forceRefresh && isCacheValid && regions.length > 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const regionsData = await dataApi.fetchRegions();
      setRegions(regionsData);
      cacheTimestampRef.current = now;

      // Sélectionner automatiquement la première région si aucune n'est sélectionnée
      if (regionsData.length > 0 && !selectedRegion) {
        setSelectedRegion(regionsData[0]);
      }
    } catch (err: any) {
      console.error('[useRegions] Erreur fetch regions:', err);
      setError('Impossible de charger les régions');
    } finally {
      setLoading(false);
    }
  }, [regions.length, selectedRegion]);

  useEffect(() => {
    fetchRegions();
  }, []);

  const refresh = useCallback(async () => {
    await fetchRegions(true);
  }, [fetchRegions]);

  return {
    regions,
    selectedRegion,
    loading,
    error,
    setSelectedRegion,
    refresh,
  };
}
