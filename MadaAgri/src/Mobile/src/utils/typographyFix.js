export const SAFE_TYPOGRAPHY = {
  display: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 1.2,
  },
  h1: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 1.2,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 1.2,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 1.2,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 1.4,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 1.6,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 1.6,
  },
  bodyLarge: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 1.6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 1.4,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 1.4,
  },
  captionBold: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 1.4,
  },
};

// Valeurs directes pour accès rapide
export const FONT_SIZES = {
  DISPLAY: 32,
  H1: 24,
  H2: 20,
  H3: 18,
  SUBHEADING: 16,
  BODY: 14,
  BODY_SMALL: 13,
  BODY_LARGE: 15,
  LABEL: 12,
  CAPTION: 11,
};

/**
 * Utilitaire pour obtenir une fontSize de manière sécurisée
 * @param {Object} typography - Objet TYPOGRAPHY du thème
 * @param {string} key - Clé de la propriété (ex: 'h2', 'body', 'caption')
 * @param {number} fallback - Valeur de fallback optionnelle
 * @returns {number} fontSize sécurisée
 */
export const getSafeFontSize = (typography, key, fallback) => {
  try {
    // Essayer d'accéder à la propriété du thème
    if (typography && typography[key] && typeof typography[key].fontSize === 'number') {
      return typography[key].fontSize;
    }
    
    // Utiliser la valeur sûre
    if (SAFE_TYPOGRAPHY[key] && SAFE_TYPOGRAPHY[key].fontSize) {
      return SAFE_TYPOGRAPHY[key].fontSize;
    }
    
    // Utiliser le fallback fourni
    if (typeof fallback === 'number') {
      return fallback;
    }
    
    // Fallback par défaut
    return FONT_SIZES.BODY;
  } catch (error) {
    console.warn(`[getSafeFontSize] Error accessing fontSize for ${key}:`, error);
    return fallback || FONT_SIZES.BODY;
  }
};

/**
 * Utilitaire pour obtenir un style de texte complet de manière sécurisée
 * @param {Object} typography - Objet TYPOGRAPHY du thème
 * @param {string} key - Clé de la propriété
 * @returns {Object} Style de texte sécurisé
 */
export const getSafeTextStyle = (typography, key) => {
  try {
    // Essayer d'utiliser le style du thème
    if (typography && typography[key] && typeof typography[key] === 'object') {
      return {
        fontSize: typography[key].fontSize || SAFE_TYPOGRAPHY[key]?.fontSize || FONT_SIZES.BODY,
        fontWeight: typography[key].fontWeight || SAFE_TYPOGRAPHY[key]?.fontWeight || '400',
        lineHeight: typography[key].lineHeight || SAFE_TYPOGRAPHY[key]?.lineHeight || 1.4,
      };
    }
    
    // Utiliser le style sûr
    if (SAFE_TYPOGRAPHY[key]) {
      return { ...SAFE_TYPOGRAPHY[key] };
    }
    
    // Fallback par défaut
    return { ...SAFE_TYPOGRAPHY.body };
  } catch (error) {
    console.warn(`[getSafeTextStyle] Error accessing text style for ${key}:`, error);
    return { ...SAFE_TYPOGRAPHY.body };
  }
};

/**
 * Hook pour utiliser la typography de manière sécurisée
 * @param {Object} theme - Objet theme complet
 * @returns {Object} Utilitaires typography sécurisés
 */
export const useSafeTypography = (theme) => {
  const typography = theme?.typography || {};
  
  return {
    // Accès direct aux tailles
    fontSize: {
      display: getSafeFontSize(typography, 'display'),
      h1: getSafeFontSize(typography, 'h1'),
      h2: getSafeFontSize(typography, 'h2'),
      h3: getSafeFontSize(typography, 'h3'),
      subheading: getSafeFontSize(typography, 'subheading'),
      body: getSafeFontSize(typography, 'body'),
      bodySmall: getSafeFontSize(typography, 'bodySmall'),
      bodyLarge: getSafeFontSize(typography, 'bodyLarge'),
      label: getSafeFontSize(typography, 'label'),
      caption: getSafeFontSize(typography, 'caption'),
    },
    
    // Accès aux styles complets
    textStyle: {
      display: getSafeTextStyle(typography, 'display'),
      h1: getSafeTextStyle(typography, 'h1'),
      h2: getSafeTextStyle(typography, 'h2'),
      h3: getSafeTextStyle(typography, 'h3'),
      subheading: getSafeTextStyle(typography, 'subheading'),
      body: getSafeTextStyle(typography, 'body'),
      bodySmall: getSafeTextStyle(typography, 'bodySmall'),
      bodyLarge: getSafeTextStyle(typography, 'bodyLarge'),
      label: getSafeTextStyle(typography, 'label'),
      caption: getSafeTextStyle(typography, 'caption'),
    },
    
    // Utilitaires
    getSafeFontSize: (key, fallback) => getSafeFontSize(typography, key, fallback),
    getSafeTextStyle: (key) => getSafeTextStyle(typography, key),
  };
};

// Export par défaut pour faciliter l'import
export default {
  SAFE_TYPOGRAPHY,
  FONT_SIZES,
  getSafeFontSize,
  getSafeTextStyle,
  useSafeTypography,
};