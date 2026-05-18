import styles from './FeaturesSection.module.css';

const features = [
  {
    title: 'Gestion de production',
    desc: 'Planifiez, suivez et optimisez chaque étape de votre production agricole.',
    items: ['Suivi de croissance', 'Planification des récoltes', 'Analyse de rendement'],
  },
  {
    title: 'Commerce équitable',
    desc: 'Vendez au meilleur prix avec transparence et sécurité sur chaque transaction.',
    items: ['Prix du marché en temps réel', 'Paiements sécurisés', 'Historique des ventes'],
  },
  {
    title: 'Support & Formation',
    desc: 'Accédez à des ressources et experts pour améliorer vos pratiques agricoles.',
    items: ['Guides techniques', 'Webinaires experts', 'Communauté active'],
  },
];

export default function FeaturesSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Fonctionnalités puissantes</h2>
          <p className={styles.subtitle}>
            Des outils conçus pour les réalités de l'agriculture malgache
          </p>
        </div>

        <div className={styles.grid}>
          {features.map((feature, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardNumber}>{String(i + 1).padStart(2, '0')}</div>
              <h3 className={styles.cardTitle}>{feature.title}</h3>
              <p className={styles.cardDesc}>{feature.desc}</p>
              <ul className={styles.items}>
                {feature.items.map((item, j) => (
                  <li key={j} className={styles.item}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
