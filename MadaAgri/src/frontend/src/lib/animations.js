import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

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
      const trigger = gsap.getProperty(ref.current, 'data-scrolltrigger');
      if (trigger) {
        trigger.kill();
      }
    };
  }, [fromVars, toVars]);

  return ref;
}

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