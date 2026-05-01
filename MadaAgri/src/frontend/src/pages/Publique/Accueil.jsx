import { useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import HeroSection from './HeroSection';
import FeedPreview from './FeedPreview';
import FeaturesSection from './FeaturesSection';
import CommunitySection from './CommunitySection';
import StatsSection from './StatsSection';
import CTASection from './CTASection';
import ModernFooter from '../Composants/ModernFooter';
import ThemeToggle from '../../components/ThemeToggle';
import { ThemeProvider } from '../../contexts/ThemeContext';
import styles from '../../styles/Publique/LandingPage.module.css';

// Particle Field Component
function ParticleField() {
  const pointsRef = useRef(null);

  useEffect(() => {
    if (!pointsRef.current) return;

    const geometry = new THREE.BufferGeometry();
    const particlesCount = 3000;
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

// Background Canvas Component
function BackgroundCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 75 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      }}
      dpr={Math.min(window.devicePixelRatio, 2)}
    >
      <ParticleField />
    </Canvas>
  );
}

export default function Accueil({ onConnect }) {
  const handleSignUp = () => {
    console.log('handleSignUp called, calling onConnect');
    // Redirection vers la page de connexion
    onConnect?.();
  };

  const handleLogin = () => {
    console.log('handleLogin called, scrolling to Features');
    const featuresSection = document.getElementById('features-section');
    if (featuresSection) {
      featuresSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ThemeProvider>
      <>
        <ThemeToggle />
        <BackgroundCanvas />
        <div className={clsx(styles['landing-page'])} style={{ position: 'relative', zIndex: 1 }}>
          <HeroSection onSignUp={handleSignUp} onLogin={handleLogin} />
          <FeedPreview />
          <FeaturesSection />
          <CommunitySection />
          <StatsSection />
          <CTASection onSignUp={handleSignUp} onLogin={handleLogin} />
          <ModernFooter />
        </div>
      </>
    </ThemeProvider>
  );
}