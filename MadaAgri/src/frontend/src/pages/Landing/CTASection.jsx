import { Link } from 'react-router-dom';
import styles from './CTASection.module.css';

export default function CTASection() {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.card}>
          <h2 className={styles.title}>
            Prêt à transformer votre agriculture ?
          </h2>
          <p className={styles.subtitle}>
            Rejoignez des milliers d'agriculteurs qui utilisent MadaAgri pour développer leur activité.
          </p>
          <div className={styles.actions}>
            <Link to="/login" className={styles.primaryBtn}>
              Créer un compte gratuit
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to="/marketplace" className={styles.secondaryBtn}>
              Parcourir la marketplace
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
