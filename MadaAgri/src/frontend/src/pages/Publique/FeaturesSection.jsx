import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiShare2, FiUsers, FiBarChart2, FiGlobe } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from '../../styles/Publique/FeaturesSection.module.css';
import * as Icons from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    id: 1,
    icon: 'Wheat',
    title: 'Partage Agricole',
    description: 'Partagez vos cultures, techniques et récoltes avec une communauté d\'agriculteurs passionnés',
  },
  {
    id: 2,
    icon: 'HandshakeIcon',
    title: 'Collaboration',
    description: 'Collaborez, échangez des conseils et développez votre réseau professionnel agricole',
  },
  {
    id: 3,
    icon: 'BarChart3',
    title: 'Suivi des Cultures',
    description: 'Suivez vos cultures en temps réel et optimisez votre production agricole',
  },
  {
    id: 4,
    icon: 'Globe',
    title: 'Réseau Local',
    description: 'Connectez-vous avec des agriculteurs près de vous et renforcez votre communauté',
  },
  {
    id: 5,
    icon: 'Leaf',
    title: 'Agriculture Durable',
    description: 'Adoptez des pratiques écologiques pour une production responsable.',
  },
  {
    id: 6,
    icon: 'Cloud',
    title: 'Données Cloud',
    description: 'Accédez à vos données agricoles partout et à tout moment.',
  },
];

export default function FeaturesSection() {
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Animation titre
    gsap.fromTo('.features-title',
      { opacity: 0, y: 30 },
      {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        force3D: true,
      }
    );

    // Animation des cartes
    cardsRef.current.forEach((card, index) => {
      if (!card) return;
      gsap.fromTo(card,
        { opacity: 0, y: 40 },
        {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 70%',
          },
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
          delay: index * 0.12,
          force3D: true,
        }
      );

      // Hover animation
      card.addEventListener('mouseenter', () => {
        gsap.to(card, { y: -8, duration: 0.3, ease: 'power2.out' });
      });

      card.addEventListener('mouseleave', () => {
        gsap.to(card, { y: 0, duration: 0.3, ease: 'power2.out' });
      });
    });

    return () => {
      cardsRef.current.forEach((card) => {
        if (card) {
          card.removeEventListener('mouseenter', null);
          card.removeEventListener('mouseleave', null);
        }
      });
    };
  }, []);

  const getFeatureIcon = (iconName) => {
    const Icon = Icons[iconName];
    return Icon ? <Icon size={32} /> : <Icons.HelpCircle size={32} />;
  };

  return (
    <section className={clsx(styles['features-section'])} ref={sectionRef} id="features-section">
      <div className={clsx(styles['features-container'])}>
        <h2 className={clsx(styles['features-title'])}>Fonctionnalités principales</h2>
        <p className={clsx(styles['features-subtitle'])}>Tout ce dont vous avez besoin pour réussir</p>

        <div className={clsx(styles['features-grid'])}>
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={clsx(styles['feature-card'])}
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <div className={clsx(styles['feature-icon'])}>{getFeatureIcon(feature.icon)}</div>
              <h3 className={clsx(styles['feature-title'])}>{feature.title}</h3>
              <p className={clsx(styles['feature-description'])}>{feature.description}</p>
              <div className={clsx(styles['feature-accent'])}></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
