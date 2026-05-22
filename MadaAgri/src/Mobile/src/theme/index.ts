export * from './colors';
export * from './spacing';
export * from './shadows';
export * from './animations';

// Re-export typography from spacing
export { TYPOGRAPHY, FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS } from './spacing';

import * as Colors from './colors';
import * as Spacing from './spacing';
import * as Shadows from './shadows';
import * as Animations from './animations';

export const DESIGN_SYSTEM = {
  colors: Colors,
  spacing: Spacing.SPACING,
  borderRadius: Spacing.BORDER_RADIUS,
  typography: Spacing.TYPOGRAPHY,
  shadows: Shadows.SHADOWS,
  animations: Animations.ANIMATION_TIMINGS,
};
