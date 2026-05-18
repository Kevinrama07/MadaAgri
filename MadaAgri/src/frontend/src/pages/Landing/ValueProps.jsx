import styles from './ValueProps.module.css';

const props = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    title: 'Marketplace Intelligente',
    desc: 'Achetez et vendez vos produits agricoles directement. Prix transparents, transactions sécurisées.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
    ),
    title: 'Suivi des Cultures',
    desc: 'Analysez vos parcelles, suivez la croissance et optimisez vos rendements avec des données précises.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    title: 'Météo & Alertes',
    desc: 'Recevez des prévisions météo localisées et des alertes pour protéger vos cultures.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Réseau Agricole',
    desc: 'Connectez-vous avec d\'autres agriculteurs, experts et acheteurs de toute l\'île.',
  },
];

export default function ValueProps() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            Tout ce dont vous avez besoin
          </h2>
          <p className={styles.subtitle}>
            Une plateforme complète pour transformer votre activité agricole
          </p>
        </div>

        <div className={styles.grid}>
          {props.map((prop, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.icon}>{prop.icon}</div>
              <h3 className={styles.cardTitle}>{prop.title}</h3>
              <p className={styles.cardDesc}>{prop.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
