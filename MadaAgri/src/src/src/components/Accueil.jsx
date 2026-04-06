import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import '../styles/Accueil.css';

export default function Accueil({ onConnect }) {
  const [hasError, setHasError] = useState(false);
  const cardsRef = useRef([]);
  const heroRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const cleanupHandlers = [];

    try {
      console.log('Accueil useEffect démarré');
      gsap.registerPlugin(ScrollTrigger);

      const cards = cardsRef.current.filter(Boolean);

      // Fallback pour s'assurer que le wrapper est visible
      const wrapper = document.querySelector('.carousel-wrapper');
      if (wrapper) {
        wrapper.style.opacity = '1';
        wrapper.style.visibility = 'visible';
      }

      gsap.from('.carousel-wrapper', {
        autoAlpha: 1,
        duration: 0.5,
        ease: 'power2.out',
      });

      if (heroRef.current) {
        gsap.set(heroRef.current, { autoAlpha: 1, scale: 1 });

        // Hero pin and fade-out on scroll, style like cards
        gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top -20%',
            end: 'top 50%',
            scrub: 1,
            pin: true,
            pinSpacing: false,
            // markers: true,
          },
        }).fromTo(
          heroRef.current,
          { autoAlpha: 1, scale: 1.0 },
          { autoAlpha: 0, scale: 0.95, ease: 'none' }
        );

        // élément textuel : zoom-out léger pendant scroll (optionnel)
        gsap.to(heroRef.current, {
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top 50%',
            end: 'top 25%',
            scrub: 1,
          },
          scale: 0.97,
          ease: 'none',
        });
      }

      gsap.from('.scroll-indicator', {
        duration: 0.8,
        autoAlpha: 1,
        y: 0,
        ease: 'power1.out',
        delay: 0.3,
      });

    cards.forEach((card) => {
      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: card,
          start: 'top 0%',
          end: 'top 50%',
          scrub: 1,
          pin: true,
          // markers: true,
        },
      });

      timeline.fromTo(
        card,
        { autoAlpha: 1, scale: 1 },
        { autoAlpha: 0, scale: 0.92, ease: 'none' }
      );

      const cardImg = card.querySelector('.card-img img');
      if (cardImg) {
        gsap.to(cardImg, {
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
          y: -40,
          scale: 1.05,
          ease: 'none',
        });
      }

      const onEnter = () => {
        gsap.to(card, {
          duration: 0.25,
          scale: 1.02,
          boxShadow: '0 18px 40px rgba(0, 0, 0, 0.5)',
          ease: 'power1.out',
        });
      };

      const onLeave = () => {
        gsap.to(card, {
          duration: 0.25,
          scale: 1,
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
          ease: 'power1.out',
        });
      };

      card.addEventListener('mouseenter', onEnter);
      card.addEventListener('mouseleave', onLeave);
      cleanupHandlers.push(() => {
        card.removeEventListener('mouseenter', onEnter);
        card.removeEventListener('mouseleave', onLeave);
      });
    });
  } catch (error) {
    console.error('GSAP animation initialization failed:', error);
    setTimeout(() => setHasError(true), 0);
  }

    return () => {
      cleanupHandlers.forEach((fn) => fn());
      if (ScrollTrigger && typeof ScrollTrigger.getAll === 'function') {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      }
      if (gsap && typeof gsap.killTweensOf === 'function') {
        gsap.killTweensOf('*');
      }
    };
  }, []);

  const features = [
    {
      num: '01',
      label: 'COMMUNICATION',
      title: 'Connexion Agriculteurs-Consommateurs',
      description: 'Plateforme sociale dédiée reliant les agriculteurs malagasy directement aux consommateurs, facilitant les échanges et la transparence.',
      image: '/src/assets/fraise.png',
    },
    {
      num: '02',
      label: 'VENTE DIRECTE',
      title: 'Marché Agricole Numérique',
      description: 'Vendez vos produits agricoles directement aux consommateurs sans intermédiaires, maximisant vos revenus et votre visibilité.',
      image: '/src/assets/legumes.png',
    },
    {
      num: '03',
      label: 'LOGISTIQUE',
      title: 'Optimisation des Livraisons',
      description: 'Routes de livraison optimisées vers les marchés urbains, réduisant les coûts et les délais de transport pour une meilleure efficacité.',
      image: '/src/assets/usine.png',
    },
    {
      num: '04',
      label: 'CONSEILS',
      title: 'Conseils Régionaux Adaptés',
      description: 'Informations personnalisées sur les cultures adaptées à chaque région de Madagascar, basées sur des données climatiques et géographiques.',
      image: '/src/assets/terre.png',
    },
  ];

  if (hasError) {
    return (
      <div className="carousel-wrapper" style={{ padding: '5rem', textAlign: 'center' }}>
        <h2 style={{ color: '#fff' }}>Un problème est survenu lors du chargement des animations.</h2>
        <p style={{ color: '#a9f5b6' }}>La page est toujours accessible en mode dégradé.</p>
        <button className="cta-button" onClick={onConnect}>Se connecter</button>
      </div>
    );
  }

  return (
    <>
      <div className="carousel-wrapper">
        <div style={{ textAlign: 'center' }}>
          <button className="cta-button" onClick={onConnect}>Se connecter</button>
        </div>

        <section className="hero" ref={heroRef}>
          <div className="hero-bg" />
          <div className="hero-inner">
            <h1 className="reveal-text">
              <img src="/src/assets/logo.png" alt="Logo" /><br />
              <span>MADA AGRI</span>
            </h1>
            <p className="hero-subtitle">Réseau social agricole malagasy pour cultiver, partager, vendre.</p>
          </div>
          <div className="scroll-indicator">EXPLOREZ NOS SERVICES AGRICOLES</div>
        </section>

        <section className="community-summary">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>12k+</h3>
              <p>Agriculteurs connectés</p>
            </div>
            <div className="stat-card">
              <h3>34k+</h3>
              <p>Offres de produits</p>
            </div>
            <div className="stat-card">
              <h3>91%</h3>
              <p>Satisfaction réseau</p>
            </div>
          </div>
          <div className="act-now">
            <h2>Rejoignez la chaîne de valeur agricole maintenant</h2>
            <p>Créez votre profil, publiez vos récoltes et trouvez des acheteurs locaux rapidement.</p>
            <button className="primary-cta" onClick={onConnect}>Démarrer</button>
          </div>
        </section>

        <section className="how-it-works">
          <h2>Comment ça marche</h2>
          <div className="workflow-cards">
            <article><strong>1-</strong> Inscription simple</article>
            <article><strong>2-</strong> Publier vos produits</article>
            <article><strong>3-</strong> Conclure en direct</article>
          </div>
        </section>

        <div className="stack-area">
          {features.map((feature, index) => (
            <div
              key={index}
              ref={(el) => {
                cardsRef.current[index] = el;
              }}
              className="card"
            >
              <div className="card-content">
                <span className="card-num">{feature.label}</span>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
              </div>
              <div className="card-img">
                <img src={feature.image} alt={feature.title} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
