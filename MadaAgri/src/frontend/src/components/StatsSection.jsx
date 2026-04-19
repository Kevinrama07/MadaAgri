import { useEffect, useRef, useState } from 'react';
import { FiCamera, FiMapPin, FiMessageCircle, FiTarget, FiBarChart2 } from 'react-icons/fi';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/StatsSection.css';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  {
    id: 1,
    number: '10000',
    label: 'Agriculteurs actifs',
    icon: 'farmer',
  },
  {
    id: 2,
    number: '5000',
    label: 'Publications partagées',
    icon: 'camera',
  },
  {
    id: 3,
    number: '23',
    label: 'Régions couvertes',
    icon: 'map',
  },
  {
    id: 4,
    number: '100000',
    label: 'Interactions par mois',
    icon: 'message',
  },
];

const getStatIcon = (iconKey) => {
  const icons = {
    farmer: <FiTarget size={32} />,
    camera: <FiCamera size={32} />,
    map: <FiMapPin size={32} />,
    message: <FiMessageCircle size={32} />,
  };
  return icons[iconKey] || <FiTarget size={32} />;
};

export default function StatsSection() {
  const sectionRef = useRef(null);
  const [animatedNumbers, setAnimatedNumbers] = useState(
    stats.reduce((acc, stat) => ({ ...acc, [stat.id]: 0 }), {})
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleIntersection = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // Animation des nombres
          stats.forEach((stat) => {
            const numericValue = parseInt(stat.number);
            gsap.to(
              { value: 0 },
              {
                value: numericValue,
                duration: 2.5,
                ease: 'power2.out',
                onUpdate: function () {
                  setAnimatedNumbers((prev) => ({
                    ...prev,
                    [stat.id]: Math.floor(this.targets()[0].value),
                  }));
                },
              }
            );
          });
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.5,
    });

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Animation des cartes
    gsap.fromTo('.stat-card',
      { opacity: 0, y: 40 },
      {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.15,
        force3D: true,
      }
    );
  }, []);

  return (
    <section className="stats-section" ref={sectionRef}>
      <div className="stats-container">
        <h2 className="stats-title">Chiffres clés</h2>
        <p className="stats-subtitle">Une communauté agricole en croissance constante</p>

        <div className="stats-grid">
          {stats.map((stat) => (
            <div key={stat.id} className="stat-card">
              <div className="stat-icon">{getStatIcon(stat.icon)}</div>
              <div className="stat-number-display">
                {animatedNumbers[stat.id]?.toLocaleString()}
                {stat.number.length > 4 && '+'}
              </div>
              <p className="stat-label">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
