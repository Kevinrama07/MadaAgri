import styles from './ModernFooter.module.css';

const links = {
  Produit: ['Marketplace', 'Dashboard', 'Météo', 'Messages'],
  Entreprise: ['À propos', 'Blog', 'Carrières', 'Contact'],
  Ressources: ['Documentation', 'Guides', 'API', 'Support'],
  Légal: ['Confidentialité', 'Conditions', 'Cookies'],
};

export default function ModernFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              </svg>
              MadaAgri
            </div>
            <p className={styles.desc}>
              La plateforme agricole de référence à Madagascar.
            </p>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title} className={styles.col}>
              <h4 className={styles.colTitle}>{title}</h4>
              <ul className={styles.colLinks}>
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className={styles.link}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={styles.bottom}>
          <p className={styles.copy}>
            &copy; 2026 MadaAgri. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
