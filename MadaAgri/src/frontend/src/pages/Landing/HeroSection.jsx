import { useTheme } from '../../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const { theme } = useTheme();

  return (
    <section className={styles.hero}>
      <div className={styles.bgGradient} />
      <div className={styles.grid} />

      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Plateforme Agricole #1 à Madagascar
          </div>

          <h1 className={styles.title}>
            Connecter l'agriculture
            <span className={styles.accent}> malagasy</span>
            <br />au monde numérique
          </h1>

          <p className={styles.subtitle}>
            Marketplace, gestion de cultures, météo et collaboration — tout en un seul endroit
            pour les agriculteurs, acheteurs et fournisseurs de Madagascar.
          </p>

          <div className={styles.actions}>
            <Link to="/marketplace" className={styles.primaryBtn}>
              Explorer la Marketplace
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/dashboard" className={styles.secondaryBtn}>
              Voir le Dashboard
            </Link>
          </div>

          <div className={styles.trust}>
            <div className={styles.avatars}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.avatar} style={{ zIndex: 5 - i }}>
                  <div className={styles.avatarInner} style={{ background: `hsl(${140 + i * 20}, 60%, ${60 + i * 5}%)` }}>
                    {String.fromCharCode(64 + i)}
                  </div>
                </div>
              ))}
            </div>
            <div className={styles.trustText}>
              <span className={styles.trustNumber}>2,500+</span>
              <span className={styles.trustLabel}>agriculteurs nous font confiance</span>
            </div>
          </div>
        </div>

        <div className={styles.visual}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                  <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <path d="M9 9h.01M15 9h.01" />
                </svg>
              </div>
              <span>Récolte de Riz</span>
              <span className={styles.cardStatus}>En cours</span>
            </div>
            <div className={styles.cardStats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>2.5T</span>
                <span className={styles.statLabel}>Production</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>98%</span>
                <span className={styles.statLabel}>Qualité</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>15</span>
                <span className={styles.statLabel}>Acheteurs</span>
              </div>
            </div>
            <div className={styles.chart}>
              {[35, 55, 40, 70, 55, 80, 65, 90, 75, 95].map((h, i) => (
                <div key={i} className={styles.bar} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>

          <div className={styles.floatingCard1}>
            <div className={styles.floatingIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div>
              <span className={styles.floatingLabel}>Revenu mensuel</span>
              <span className={styles.floatingValue}>4,250,000 Ar</span>
            </div>
          </div>

          <div className={styles.floatingCard2}>
            <div className={styles.floatingIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <path d="M22 4L12 14.01l-3-3" />
              </svg>
            </div>
            <span>Vérifié</span>
          </div>
        </div>
      </div>
    </section>
  );
}
