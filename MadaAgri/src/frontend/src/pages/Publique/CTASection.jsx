import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import clsx from 'clsx';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/Publique/CTASection.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function CTASection({ onSignUp, onLogin }) {
  const sectionRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    gsap.fromTo('.cta-content',
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        y: 0,
        duration: 1,
        ease: 'power3.out',
        force3D: true,
      }
    );

    gsap.fromTo('.cta-button',
      { opacity: 0, scale: 0.9 },
      {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 70%',
        },
        opacity: 1,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.3,
        force3D: true,
      }
    );
  }, []);

  return (
    <section className={clsx(styles['cta-section'])} ref={sectionRef}>
      <div className={clsx(styles['cta-background'])}></div>
      <div className={clsx(styles['cta-container'])}>
        <div className={clsx(styles['cta-content'])}>
          <h2 className={clsx(styles['cta-title'])}>Prêt à rejoindre la communauté?</h2>
          <p className={clsx(styles['cta-subtitle'])}>
            Commencez à partager, apprendre et grandir avec des agriculteurs de votre région
          </p>
          <p className={clsx(styles['cta-note'])}>
            Pas de carte bancaire requise • Simple et gratuit • Rejoignez la révolution agricole
          </p>
          <div className={clsx(styles['cta-buttons'])}>
            <button className={clsx(styles['cta-button'], styles['btn-primary-large'])} onClick={onSignUp}>
              S'inscrire gratuitement
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
