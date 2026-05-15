export const ANIMATION_TIMINGS = {
  // Duration in milliseconds
  INSTANT: 0,
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,

  // Easing functions
  EASING: {
    LINEAR: 'linear',
    EASE_IN: 'ease-in',
    EASE_OUT: 'ease-out',
    EASE_IN_OUT: 'ease-in-out',
    EASE_OUT_CUBIC: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
    EASE_IN_OUT_CUBIC: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
    EASE_OUT_QUAD: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  },

  // Common animation combinations
  FADE_IN: {
    duration: 300,
    easing: 'ease-out',
  },
  FADE_OUT: {
    duration: 200,
    easing: 'ease-in',
  },
  SLIDE_IN: {
    duration: 300,
    easing: 'ease-out',
  },
  SLIDE_OUT: {
    duration: 250,
    easing: 'ease-in',
  },
  SCALE_IN: {
    duration: 250,
    easing: 'ease-out',
  },
  BOUNCE: {
    duration: 600,
    easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
};

export type AnimationTiming = keyof typeof ANIMATION_TIMINGS;
