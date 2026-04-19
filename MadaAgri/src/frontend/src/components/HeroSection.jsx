import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import '../styles/HeroSection.css';

export default function HeroSection({ onSignUp, onLogin }) {
  const textRef = useRef(null);
  const buttonRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Kill any existing animations to prevent conflicts
    gsap.killTweensOf('.hero-title, .hero-subtitle, .hero-buttons .btn, .scroll-indicator-hero');

    // Animation du texte titre - FIXE (ne disparaît pas)
    gsap.fromTo('.hero-title',
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.2,
        force3D: true,
      }
    );

    // Animation du sous-titre - FIXE (ne disparaît pas)
    gsap.fromTo('.hero-subtitle',
      { opacity: 0, y: 20 },
      {
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        delay: 0.4,
        force3D: true,
      }
    );

    // Animation des boutons - FIXE (ne disparaît pas)
    gsap.fromTo('.hero-buttons .btn',
      { opacity: 0, y: 15 },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.6,
        stagger: 0.1,
        force3D: true,
      }
    );

    // Animation scroll indicator - boucle infinie
    const tl = gsap.timeline({ repeat: -1 });
    tl.fromTo('.scroll-indicator-hero',
      { y: 0, opacity: 0.6 },
      {
        y: 10,
        opacity: 1,
        duration: 0.6,
        ease: 'sine.inOut',
      }
    ).to('.scroll-indicator-hero',
      {
        y: 0,
        opacity: 0.6,
        duration: 0.6,
        ease: 'sine.inOut',
      }
    );

    return () => {
      gsap.killTweensOf('.hero-title, .hero-subtitle, .hero-buttons .btn, .scroll-indicator-hero');
    };
  }, []);

  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-image-overlay"></div>
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          Connectez les agriculteurs de Madagascar
        </h1>

        <p className="hero-subtitle">
          Partagez vos cultures, apprenez de la communauté et développez votre agriculture ensemble
        </p>

        <div className="hero-buttons" ref={buttonRef}>
          <button className="btn btn-primary" onClick={onSignUp}>
            S'inscrire gratuitement
          </button>
          <button className="btn btn-secondary" onClick={onLogin}>
            Se connecter
          </button>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Agriculteurs</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">5K+</span>
            <span className="stat-label">Publications</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat">
            <span className="stat-number">23</span>
            <span className="stat-label">Régions</span>
          </div>
        </div>
      </div>

      <div className="scroll-indicator-hero" ref={scrollRef}>
        <span>Découvrir</span>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
    </section>
  );
}
