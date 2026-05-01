import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import styles from '../../styles/Publique/HeroSection.module.css';

// Icon components with SVG
const LeafIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 22c10.15 0 11-8.9 11-20S20.848.75 11 0c9 11.15 8 21 0 22z"></path>
    <path d="M11 19c6.08 0 7-5.4 7-12-4.5 1-7 4.5-7 12z"></path>
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="3"></line>
    <line x1="19" y1="8" x2="19" y2="17"></line>
    <line x1="5" y1="5" x2="5" y2="17"></line>
  </svg>
);

const LightbulbIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"></circle>
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>
);

const GlobeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="2" y1="12" x2="22" y2="12"></line>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
  </svg>
);

function Typewriter({
  texts = [],
  typingSpeed = 50,
  deletingSpeed = 30,
  pause = 1500
}) {
  const [textIndex, setTextIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = texts[textIndex];

    let timeout;

    if (!isDeleting) {
      // ✍️ Phase écriture
      if (displayedText.length < currentText.length) {
        timeout = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length + 1));
        }, typingSpeed);
      } else {
        // ⏸ Pause avant suppression
        timeout = setTimeout(() => {
          setIsDeleting(true);
        }, pause);
      }
    } else {
      // ⌫ Phase suppression
      if (displayedText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayedText(currentText.slice(0, displayedText.length - 1));
        }, deletingSpeed);
      } else {
        // 🔁 Passer à la phrase suivante (boucle)
        setIsDeleting(false);
        setTextIndex((prev) => (prev + 1) % texts.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedText, isDeleting, textIndex, texts, typingSpeed, deletingSpeed, pause]);

  return (
    <div style={{ fontSize: "1.8rem" }}>
      {displayedText}
      <span className={clsx(styles['cursor'])}>|</span>
    </div>
  );
}

// Particle Field Component
function ParticleField() {
  const pointsRef = useRef(null);

  useEffect(() => {
    if (!pointsRef.current) return;

    const geometry = new THREE.BufferGeometry();
    const particlesCount = 5000;
    const posArray = new Float32Array(particlesCount * 3);
    const colorsArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i += 3) {
      posArray[i] = (Math.random() - 0.5) * 50;
      posArray[i + 1] = (Math.random() - 0.5) * 50;
      posArray[i + 2] = (Math.random() - 0.5) * 50;

      const colorChoice = Math.random();
      if (colorChoice > 0.7) {
        colorsArray[i] = 0.1;
        colorsArray[i + 1] = 0.8;
        colorsArray[i + 2] = 0.5;
      } else if (colorChoice > 0.4) {
        colorsArray[i] = 0.13;
        colorsArray[i + 1] = 0.77;
        colorsArray[i + 2] = 0.36;
      } else {
        colorsArray[i] = 0.05;
        colorsArray[i + 1] = 0.4;
        colorsArray[i + 2] = 0.2;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    pointsRef.current.geometry = geometry;
  }, []);

  useFrame(() => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += 0.00005;
      pointsRef.current.rotation.x += 0.00002;
    }
  });

  return (
    <points ref={pointsRef}>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}


// Camera Controller Component
function CameraController() {
  const { camera } = useThree();
  const mousePosition = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      mousePosition.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    camera.position.x +=
      (mousePosition.current.x * 0.5 - camera.position.x) * 0.02;
    camera.position.y +=
      (mousePosition.current.y * 0.3 - camera.position.y) * 0.02;
    camera.lookAt(0, 0, 0);
  });

  return null;
}

// Three.js Canvas Component
function HeroCanvas() {
  return (
    <Canvas
      className={clsx(styles['three-canvas'])}
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={Math.min(window.devicePixelRatio, 2)}
    >
      <fog attach="fog" args={[0x0a1f0a, 10, 50]} />

      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[0, 0, 5]} intensity={2} distance={50} color={0x22c55e} />
      <pointLight position={[-10, 5, -5]} intensity={1} distance={50} color={0x06b6d4} />
      <pointLight position={[10, -5, 5]} intensity={1} distance={50} color={0x4ade80} />

      <ParticleField/>
      <CameraController />
    </Canvas>
  );
}

export default function HeroSection({ onSignUp, onLogin }) {
  const textRef = useRef(null);
  const buttonRef = useRef(null);
  const scrollRef = useRef(null);

  const handleDiscoverClick = () => {
    onLogin?.();
  };

  const handleStartClick = () => {
    onSignUp?.();
  };

  useEffect(() => {
    // GSAP entrance animations
    const tl = gsap.timeline();

    tl.fromTo(
      '.hero-title',
      { opacity: 0, y: 50, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 1.2,
        ease: 'power4.out',
      }
    )
      .fromTo(
        '.hero-subtitle',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power3.out',
        },
        '-=0.6'
      )
      .fromTo(
        '.hero-buttons .btn',
        { opacity: 0, y: 20, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: 'back.out(1.7)',
          stagger: 0.15,
        },
        '-=0.4'
      )
      .fromTo(
        '.hero-stats .stat',
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.1,
        },
        '-=0.3'
      )
      .fromTo(
        '.social-orbital-container',
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1,
          duration: 0.8,
          ease: 'back.out(1.5)',
        },
        '-=0.2'
      );

    // Orbital rotation for values
    const orbitalTl = gsap.timeline({ repeat: -1 });
    orbitalTl.to(
      '.value-icon-orbit',
      {
        rotation: 360,
        transformOrigin: '120px 120px',
        duration: 25,
        ease: 'none',
      },
      0
    );

    gsap.to('.value-icon-circle', {
      y: -6,
      duration: 2.5,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
      stagger: 0.15,
    });

    gsap.to('.value-card', {
      boxShadow: [
        '0 8px 32px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        '0 12px 48px rgba(34, 197, 94, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
        '0 8px 32px rgba(34, 197, 94, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      ],
      duration: 3,
      repeat: -1,
      ease: 'sine.inOut',
      stagger: 0.2,
    });

    const scrollTl = gsap.timeline({ repeat: -1 });
    scrollTl
      .fromTo(
        '.scroll-indicator-hero',
        { y: 0, opacity: 0.6 },
        {
          y: 10,
          opacity: 1,
          duration: 0.8,
          ease: 'sine.inOut',
        }
      )
      .to('.scroll-indicator-hero', {
        y: 0,
        opacity: 0.6,
        duration: 0.8,
        ease: 'sine.inOut',
      });

    return () => {
      gsap.killTweensOf(
        '.hero-title, .hero-subtitle, .hero-buttons .btn, .scroll-indicator-hero, .hero-stats .stat, .value-icon-orbit, .value-icon-circle, .value-card, .connection-line, .central-node, .social-orbital-container'
      );
    };
  }, []);

  return (
    <section className={clsx(styles['hero-section'])}>
      <HeroCanvas />

      <div className={clsx(styles['hero-glow'], styles['hero-glow-1'])}></div>
      <div className={clsx(styles['hero-glow'], styles['hero-glow-2'])}></div>
      <div className={clsx(styles['hero-glow'], styles['hero-glow-3'])}></div>

      <div className={clsx(styles['hero-content'])} ref={textRef}>
        <div className={clsx(styles['hero-badge'])}>
          <span>Mada Agri</span>
        </div>

        <h1 className={clsx(styles['hero-title'])}>
          <span className={clsx(styles['title-accent'])}>
            <Typewriter
              texts={[
                "La nouvelle génération agricole malagasy",
                "L'agriculture malagasy connectée",
                "Bienvenue sur Mada Agri"
              ]}
              typingSpeed={50}
              deletingSpeed={25}
              pause={3000}
            />
          </span>
        </h1>

        <p className={clsx(styles['hero-subtitle'])}>
          Révolutionnez l'agriculture malgache avec notre plateforme numérique. Connectez-vous,
          partagez et développez ensemble.
        </p>

        <div className={clsx(styles['hero-buttons'])} ref={buttonRef}>
          <button className={clsx(styles['btn'], styles['btn-primary'])} onClick={(e) => {
            handleStartClick();
          }}>
            <span className={clsx(styles['btn-content'])}>
              <span className={clsx(styles['btn-text'])}>Commencer</span>
              <span className={clsx(styles['btn-icon'])}>→</span>
            </span>
            <span className={clsx(styles['btn-glow'])}></span>
          </button>
          <button className={clsx(styles['btn'], styles['btn-secondary'])} onClick={(e) => {
            handleDiscoverClick();
          }}>
            <span className={clsx(styles['btn-content'])}>
              <span className={clsx(styles['btn-text'])}>Découvrir</span>
            </span>
          </button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className={clsx(styles['scroll-indicator-hero'])} ref={scrollRef}>
        <span>Découvrir</span>
        <div className={clsx(styles['scroll-arrow'])}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      {/* Orbital Values Animation */}
      <div className={clsx(styles['social-orbital-container'])}>
        <svg className={clsx(styles['orbital-svg'])} viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="glow-filter">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          {/* Glowing orbits */}
          <circle cx="200" cy="200" r="120" className={clsx(styles['orbit'], styles['orbit-1'])} filter="url(#glow-filter)" />
          <circle cx="200" cy="200" r="80" className={clsx(styles['orbit'], styles['orbit-2'])} filter="url(#glow-filter)" />
          <circle cx="200" cy="200" r="40" className={clsx(styles['orbit'], styles['orbit-3'])} filter="url(#glow-filter)" />

          {/* Central glowing node */}
          <circle cx="200" cy="200" r="8" className={clsx(styles['central-node'])} filter="url(#glow-filter)" />

          {/* Connection lines */}
          <g className={clsx(styles['connections'])}>
            {[0, 1, 2, 3, 4, 5].map((i) => {
              const angle = (i * 60) * (Math.PI / 180);
              const x1 = 200;
              const y1 = 200;
              const x2 = 200 + 120 * Math.cos(angle);
              const y2 = 200 + 120 * Math.sin(angle);
              return (
                <line
                  key={`line-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className={clsx(styles['connection-line'])}
                  style={{ '--index': i }}
                  filter="url(#glow-filter)"
                />
              );
            })}
          </g>
        </svg>

        <div className={clsx(styles['social-icons-wrapper'])}>
          {[
            {
              name: 'Agriculture Durable',
              Icon: LeafIcon,
              color: '#10b981',
              desc: 'Cultiver l\'avenir'
            },
            {
              name: 'Technologie Verte',
              Icon: ZapIcon,
              color: '#34d399',
              desc: 'Innovation pour tous'
            },
            {
              name: 'Connexion Locale',
              Icon: UsersIcon,
              color: '#06b6d4',
              desc: 'Ensemble on grandit'
            },
            {
              name: 'Données Intelligentes',
              Icon: BarChartIcon,
              color: '#22c55e',
              desc: 'Décisions éclairées'
            },
            {
              name: 'Partage de Savoir',
              Icon: LightbulbIcon,
              color: '#14b8a6',
              desc: 'Apprendre ensemble'
            },
            {
              name: 'Impact Global',
              Icon: GlobeIcon,
              color: '#06b6d4',
              desc: 'Transformer le monde'
            },
          ].map((value, index) => (
            <div
              key={value.name}
              className={clsx(styles['value-icon-orbit'])}
              style={{
                '--orbit-index': index,
                '--accent-color': value.color
              }}
              title={value.name}
            >
              <div className={clsx(styles['value-card'])}>
                <div className={clsx(styles['value-icon-circle'])}>
                  <div className={clsx(styles['value-icon'])}>
                    <value.Icon />
                  </div>
                </div>
                <div className={clsx(styles['value-content'])}>
                  <h4 className={clsx(styles['value-title'])}>{value.name}</h4>
                  <p className={clsx(styles['value-tagline'])}>{value.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Particles */}
      <div className={clsx(styles['hero-particles'])}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className={clsx(styles['particle'])}
            style={{
              '--delay': `${i * 0.5}s`,
              '--x': `${Math.random() * 100}%`,
              '--duration': `${3 + Math.random() * 4}s`,
            }}
          ></div>
        ))}
      </div>
    </section>
  );
}
