export const AUTOMATIC_REPLACEMENTS = {
  // Remplacements directs des fontSize
  'TYPOGRAPHY.display.fontSize': '32',
  'TYPOGRAPHY.h1.fontSize': '24', 
  'TYPOGRAPHY.h2.fontSize': '20',
  'TYPOGRAPHY.h3.fontSize': '18',
  'TYPOGRAPHY.subheading.fontSize': '16',
  'TYPOGRAPHY.body.fontSize': '14',
  'TYPOGRAPHY.bodySmall.fontSize': '13',
  'TYPOGRAPHY.bodyLarge.fontSize': '15',
  'TYPOGRAPHY.label.fontSize': '12',
  'TYPOGRAPHY.caption.fontSize': '11',
  
  // Remplacements avec commentaires pour clarté
  'fontSize: TYPOGRAPHY.display.fontSize': 'fontSize: 32, // TYPOGRAPHY.display.fontSize',
  'fontSize: TYPOGRAPHY.h1.fontSize': 'fontSize: 24, // TYPOGRAPHY.h1.fontSize',
  'fontSize: TYPOGRAPHY.h2.fontSize': 'fontSize: 20, // TYPOGRAPHY.h2.fontSize',
  'fontSize: TYPOGRAPHY.h3.fontSize': 'fontSize: 18, // TYPOGRAPHY.h3.fontSize',
  'fontSize: TYPOGRAPHY.subheading.fontSize': 'fontSize: 16, // TYPOGRAPHY.subheading.fontSize',
  'fontSize: TYPOGRAPHY.body.fontSize': 'fontSize: 14, // TYPOGRAPHY.body.fontSize',
  'fontSize: TYPOGRAPHY.bodySmall.fontSize': 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize',
  'fontSize: TYPOGRAPHY.bodyLarge.fontSize': 'fontSize: 15, // TYPOGRAPHY.bodyLarge.fontSize',
  'fontSize: TYPOGRAPHY.label.fontSize': 'fontSize: 12, // TYPOGRAPHY.label.fontSize',
  'fontSize: TYPOGRAPHY.caption.fontSize': 'fontSize: 11, // TYPOGRAPHY.caption.fontSize',
};

/**
 * Instructions pour appliquer les corrections manuellement
 */
export const MANUAL_CORRECTION_STEPS = `
ÉTAPES DE CORRECTION MANUELLE:

1. OUVRIR CHAQUE FICHIER ÉCRAN (.tsx)

2. RECHERCHER ET REMPLACER:
   - Ctrl+H (Find & Replace)
   - Rechercher: "fontSize: TYPOGRAPHY.h2.fontSize"
   - Remplacer: "fontSize: 20, // TYPOGRAPHY.h2.fontSize"
   - Répéter pour toutes les tailles

3. VÉRIFIER LES IMPORTS:
   - Ajouter: import { TYPOGRAPHY_SAFE_VALUES } from '../utils/safeStyles';
   - Ou utiliser les valeurs directes

4. TESTER L'ÉCRAN:
   - Vérifier l'affichage
   - Pas d'erreurs dans la console
   - Textes bien dimensionnés

5. FICHIERS À CORRIGER:
   - FeedHomeScreen.tsx
   - MarketplaceScreen.tsx  
   - MessagesScreen.tsx
   - NotificationsScreen.tsx
   - ProductDetailScreen.tsx
   - ProfileScreen.tsx
   - SearchScreen.tsx
   - UserProfileScreen.tsx
   - SettingsScreen.tsx
`;

export const FILE_SPECIFIC_CORRECTIONS = {
  'FeedHomeScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.subheading.fontSize',
        replace: 'fontSize: 16, // TYPOGRAPHY.subheading.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.caption.fontSize',
        replace: 'fontSize: 11, // TYPOGRAPHY.caption.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      }
    ]
  },
  
  'MarketplaceScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.subheading.fontSize',
        replace: 'fontSize: 16, // TYPOGRAPHY.subheading.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.bodySmall.fontSize',
        replace: 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      }
    ]
  },
  
  'MessagesScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.caption.fontSize',
        replace: 'fontSize: 11, // TYPOGRAPHY.caption.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.bodySmall.fontSize',
        replace: 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize'
      }
    ]
  },
  
  'NotificationsScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.bodySmall.fontSize',
        replace: 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.caption.fontSize',
        replace: 'fontSize: 11, // TYPOGRAPHY.caption.fontSize'
      }
    ]
  },
  
  'ProductDetailScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.h2.fontSize',
        replace: 'fontSize: 20, // TYPOGRAPHY.h2.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.h3.fontSize',
        replace: 'fontSize: 18, // TYPOGRAPHY.h3.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.bodySmall.fontSize',
        replace: 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize'
      }
    ]
  },
  
  'ProfileScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.h2.fontSize',
        replace: 'fontSize: 20, // TYPOGRAPHY.h2.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.h3.fontSize',
        replace: 'fontSize: 18, // TYPOGRAPHY.h3.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.caption.fontSize',
        replace: 'fontSize: 11, // TYPOGRAPHY.caption.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.subheading.fontSize',
        replace: 'fontSize: 16, // TYPOGRAPHY.subheading.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.bodySmall.fontSize',
        replace: 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize'
      }
    ]
  },
  
  'SearchScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.bodySmall.fontSize',
        replace: 'fontSize: 13, // TYPOGRAPHY.bodySmall.fontSize'
      }
    ]
  },
  
  'UserProfileScreen.tsx': {
    corrections: [
      {
        find: 'fontSize: TYPOGRAPHY.h2.fontSize',
        replace: 'fontSize: 20, // TYPOGRAPHY.h2.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.body.fontSize',
        replace: 'fontSize: 14, // TYPOGRAPHY.body.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.h3.fontSize',
        replace: 'fontSize: 18, // TYPOGRAPHY.h3.fontSize'
      },
      {
        find: 'fontSize: TYPOGRAPHY.caption.fontSize',
        replace: 'fontSize: 11, // TYPOGRAPHY.caption.fontSize'
      }
    ]
  }
};

/**
 * Validation après correction
 */
export const VALIDATION_CHECKLIST = `
CHECKLIST DE VALIDATION:

□ Tous les écrans s'affichent correctement
□ Aucune erreur fontSize dans la console
□ Textes bien dimensionnés sur tous les écrans
□ Mode sombre/clair fonctionne
□ Responsive design préservé
□ Performance maintenue

COMMANDES DE TEST:
1. npm start
2. Ouvrir chaque écran
3. Vérifier la console (pas d'erreurs)
4. Tester les interactions
5. Changer de thème (sombre/clair)
`;

export default {
  AUTOMATIC_REPLACEMENTS,
  MANUAL_CORRECTION_STEPS,
  FILE_SPECIFIC_CORRECTIONS,
  VALIDATION_CHECKLIST,
};