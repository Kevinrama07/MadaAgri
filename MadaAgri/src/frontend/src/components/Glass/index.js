/**
 * Glass Components - Index & Exports
 * ===================================
 * Fichier d'export centralisé pour faciliter les imports
 */

// Composants
export { GlassCard } from './GlassComponents';
export { GlassButton } from './GlassComponents';
export { GlassInput } from './GlassComponents';
export { GlassGrid } from './GlassComponents';
export { GlassSection } from './GlassComponents';

// Type: Named exports pour meilleure autocomplétion
export type {
  GlassCardProps,
  GlassButtonProps,
  GlassInputProps,
  GlassGridProps,
  GlassSectionProps,
} from './GlassComponents.types';

// Default export du module
export { default as GlassComponents } from './GlassComponents';
