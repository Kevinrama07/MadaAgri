import { useEffect, useRef } from 'react';

/**
 * Hook pour gérer les scrollbars modernes
 * - Masquées par défaut
 * - Apparaissent lors du scroll
 * - Disparaissent après 2 secondes d'inactivité
 * @param {React.RefObject} ref - Référence à l'élément scrollable
 * @param {number} hideDelay - Délai avant de masquer la scrollbar (ms)
 */
export const useModernScrollbar = (ref, hideDelay = 2000) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    const element = ref?.current;
    if (!element) return;

    // Ajouter la classe moderne scrollbar
    element.classList.add('modern-scrollbar');

    const handleScroll = () => {
      // Afficher la scrollbar
      element.classList.add('scrolling');

      // Nettoyer l'ancien timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Cacher après le délai
      timeoutRef.current = setTimeout(() => {
        element.classList.remove('scrolling');
      }, hideDelay);
    };

    element.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      element.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [ref, hideDelay]);
};

/**
 * Hook pour appliquer les scrollbars modernes à la fenêtre globale
 */
export const useGlobalModernScrollbar = (hideDelay = 2000) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Appliquer au body et html
    const root = document.documentElement;
    root.classList.add('modern-scrollbar');

    const handleScroll = () => {
      root.classList.add('scrolling');

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        root.classList.remove('scrolling');
      }, hideDelay);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      root.classList.remove('modern-scrollbar');
    };
  }, [hideDelay]);
};
