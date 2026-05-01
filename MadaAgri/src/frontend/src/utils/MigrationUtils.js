// 🔄 Utilitaire de Migration Progressive
// Permet de switcher entre HeroSection et HeroSectionV2

import { useEffect, useState } from 'react';

/**
 * Hook pour détecter le support WebGL
 * @returns {boolean} true si WebGL est supporté
 */
export function useWebGLSupport() {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('webgl2');
      setIsSupported(!!gl);
    } catch (error) {
      setIsSupported(false);
    }
  }, []);

  return isSupported;
}

/**
 * Hook pour détecter la performance
 * @returns {'high' | 'medium' | 'low'} niveau de performance
 */
export function usePerformanceLevel() {
  const [level, setLevel] = useState('medium');

  useEffect(() => {
    // Détecter via device memory et cores
    const navigator_ = navigator;
    const deviceMemory = navigator_.deviceMemory || 4;
    const cores = navigator_.hardwareConcurrency || 4;

    if (deviceMemory >= 8 && cores >= 4) {
      setLevel('high');
    } else if (deviceMemory >= 4 && cores >= 2) {
      setLevel('medium');
    } else {
      setLevel('low');
    }

    // Ou via performance API
    if (performance.memory) {
      const ratio = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      if (ratio > 0.8) {
        setLevel('low');
      }
    }
  }, []);

  return level;
}

/**
 * Hook pour détecter le device
 * @returns {{isMobile: boolean, isTablet: boolean, isDesktop: boolean}}
 */
export function useDeviceDetection() {
  const [device, setDevice] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setDevice({
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  return device;
}

/**
 * Composant adaptif qui choisit la meilleure version
 * en fonction des capacités du device
 */
export function AdaptiveHeroSection(props) {
  const webglSupport = useWebGLSupport();
  const performanceLevel = usePerformanceLevel();
  const device = useDeviceDetection();

  // Déterminer quelle version utiliser
  let HeroComponent;

  if (!webglSupport) {
    // Fallback pour pas de WebGL
    console.warn('WebGL not supported, using fallback');
    HeroComponent = HeroSectionFallback;
  } else if (performanceLevel === 'low' || device.isMobile) {
    // Version light pour mobile/low-end
    console.log('Using HeroSection (optimized)');
    HeroComponent = HeroSectionOptimized;
  } else {
    // Version complète pour desktop/high-end
    console.log('Using HeroSectionV2 (full features)');
    HeroComponent = HeroSectionV2;
  }

  return <HeroComponent {...props} />;
}

/**
 * Configuration pour différents scénarios de performance
 */
export const PERFORMANCE_CONFIGS = {
  high: {
    particlesCount: 3000,
    objectsCount: 15,
    dpr: 2,
    antialias: true,
    postProcessing: true,
  },
  medium: {
    particlesCount: 2000,
    objectsCount: 10,
    dpr: 1.5,
    antialias: true,
    postProcessing: false,
  },
  low: {
    particlesCount: 1000,
    objectsCount: 5,
    dpr: 1,
    antialias: false,
    postProcessing: false,
  },
};

/**
 * Wrapper pour évaluer les performances
 */
export class PerformanceMonitor {
  constructor() {
    this.metrics = {
      fps: 0,
      memory: 0,
      renderTime: 0,
    };
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  update() {
    this.frameCount++;
    const now = performance.now();
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.metrics.fps = Math.round(this.frameCount * (1000 / delta));
      this.frameCount = 0;
      this.lastTime = now;

      if (performance.memory) {
        this.metrics.memory =
          Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB';
      }

      console.log('[Performance]', this.metrics);
    }
  }

  getMetrics() {
    return this.metrics;
  }
}

// Import des versions (à adapter selon votre structure)
// import HeroSectionV2 from './HeroSectionV2';
// import HeroSectionOptimized from './HeroSectionOptimized';
// import HeroSectionFallback from './HeroSectionFallback';

// Placeholder exports
const HeroSectionV2 = () => null;
const HeroSectionOptimized = () => null;
const HeroSectionFallback = () => null;

export default AdaptiveHeroSection;
