import { useEffect, useRef } from 'react';
import { FiShare2, FiUsers, FiBarChart2, FiGlobe } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/FeaturesSection.css';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    id: 1,
    icon: 'wheat',
    title: 'Partage Agricole',
    description: 'Partagez vos cultures, techniques et récoltes avec une communauté d\'agriculteurs passionnés',
  },
  {
    id: 2,
    icon: 'handshake',
    title: 'Collaboration',
    description: 'Collaborez, échangez des conseils et développez votre réseau professionnel agricole',
  },
  {
    id: 3,
    icon: 'chart',
    title: 'Suivi des Cultures',
    description: 'Suivez vos cultures en temps réel et optimisez votre production agricole',
  },
  {
    id: 4,
    icon: 'globe',
    title: 'Réseau Local',
    description: 'Connectez-vous avec des agriculteurs près de vous et renforcez votre communauté',
  },
];

const getFeatureIcon = (iconKey) => {
  const icons = {
    wheat: <FiShare2 size={32} />,
    handshake: <FiUsers size={32} />,
    chart: <FiBarChart2 size={32} />,
    globe: <FiGlobe size={32} />,
  };
  return icons[iconKey] || <FiShare2 size={32} />;
};

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

  return (
    <section className="features-section" ref={sectionRef}>
      <div className="features-container">
        <h2 className="features-title">Fonctionnalités principales</h2>
        <p className="features-subtitle">Tout ce dont vous avez besoin pour réussir</p>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className="feature-card"
              ref={(el) => (cardsRef.current[index] = el)}
            >
              <div className="feature-icon">{getFeatureIcon(feature.icon)}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
              <div className="feature-accent"></div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
