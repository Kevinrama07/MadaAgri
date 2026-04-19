import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Hook for fade-in animation on mount
 * @param {number} duration - Animation duration in seconds
 * @param {number} delay - Animation delay in seconds
 */
export function useFadeIn(duration = 0.6, delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        y: 20
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        force3D: true
      }
    );
  }, [duration, delay]);

  return ref;
}

/**
 * Hook for slide-in animation (from left)
 * @param {number} duration - Animation duration in seconds
 * @param {number} delay - Animation delay in seconds
 */
export function useSlideInLeft(duration = 0.6, delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        x: -40
      },
      {
        opacity: 1,
        x: 0,
        duration,
        delay,
        ease: 'power3.out',
        force3D: true
      }
    );
  }, [duration, delay]);

  return ref;
}

/**
 * Hook for slide-in animation (from right)
 * @param {number} duration - Animation duration in seconds
 * @param {number} delay - Animation delay in seconds
 */
export function useSlideInRight(duration = 0.6, delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        x: 40
      },
      {
        opacity: 1,
        x: 0,
        duration,
        delay,
        ease: 'power3.out',
        force3D: true
      }
    );
  }, [duration, delay]);

  return ref;
}

/**
 * Hook for slide-in animation (from bottom/up)
 * @param {number} duration - Animation duration in seconds
 * @param {number} delay - Animation delay in seconds
 */
export function useSlideInUp(duration = 0.6, delay = 0) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    gsap.fromTo(
      ref.current,
      {
        opacity: 0,
        y: 40
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: 'power3.out',
        force3D: true
      }
    );
  }, [duration, delay]);

  return ref;
}

/**
 * Hook for scroll-reveal animation (element animates when scrolling to it)
 * @param {object} fromVars - Starting animation state
 * @param {object} toVars - Ending animation state + trigger config
 */
export function useScrollReveal(fromVars = {}, toVars = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const defaultFromVars = {
      opacity: 0,
      y: 60,
      ...fromVars
    };

    const defaultToVars = {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'power3.out',
      force3D: true,
      scrollTrigger: {
        trigger: ref.current,
        start: 'top 80%',
        once: true,
        markers: false
      },
      ...toVars
    };

    gsap.fromTo(ref.current, defaultFromVars, defaultToVars);

    return () => {
      // Cleanup ScrollTrigger instance
      const trigger = gsap.getProperty(ref.current, 'data-scrolltrigger');
      if (trigger) {
        trigger.kill();
      }
    };
  }, [fromVars, toVars]);

  return ref;
}

/**
 * Animate like button on click
 * @param {HTMLElement} element - Element to animate
 */
export function animateLikeButton(element) {
  if (!element) return;

  gsap.fromTo(
    element,
    { scale: 1 },
    {
      scale: 1.2,
      duration: 0.3,
      ease: 'back.out',
      force3D: true,
      yoyo: true,
      repeat: 1
    }
  );
}

/**
 * Animate hover effect on card
 * @param {HTMLElement} element - Element to animate
 * @param {boolean} isHovering - Whether mouse is hovering
 */
export function animateCardHover(element, isHovering) {
  if (!element) return;

  gsap.to(element, {
    y: isHovering ? -4 : 0,
    boxShadow: isHovering
      ? '0 8px 24px rgba(0, 0, 0, 0.15)'
      : '0 1px 2px rgba(0, 0, 0, 0.1)',
    duration: 0.3,
    ease: 'power2.out',
    force3D: true
  });
}

/**
 * Animate counter increase (like count, etc)
 * @param {HTMLElement} element - Element showing the count
 * @param {number} from - Starting number
 * @param {number} to - Ending number
 */
export function animateCounter(element, from, to) {
  if (!element) return;

  const obj = { count: from };
  gsap.to(obj, {
    count: to,
    duration: 0.3,
    ease: 'power2.out',
    onUpdate: () => {
      element.textContent = Math.round(obj.count);
    }
  });
}

/**
 * Animate element appearance (pop in effect)
 * @param {HTMLElement} element - Element to animate
 */
export function animatePopIn(element) {
  if (!element) return;

  gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: 0.9
    },
    {
      opacity: 1,
      scale: 1,
      duration: 0.3,
      ease: 'back.out',
      force3D: true
    }
  );
}
