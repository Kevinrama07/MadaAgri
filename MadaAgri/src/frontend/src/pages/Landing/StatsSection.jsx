import styles from './StatsSection.module.css';

const stats = [
  { value: '2,500+', label: 'Agriculteurs actifs' },
  { value: '15,000+', label: 'Produits vendus' },
  { value: '98%', label: 'Satisfaction client' },
  { value: '22', label: 'Régions couvertes' },
];

export default function StatsSection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.grid}>
          {stats.map((stat, i) => (
            <div key={i} className={styles.stat}>
              <span className={styles.value}>{stat.value}</span>
              <span className={styles.label}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
