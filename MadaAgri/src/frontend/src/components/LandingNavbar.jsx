import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeSelector } from './ThemeSelector';
import styles from './Navbar.module.css';

export function LandingNavbar() {
  const { theme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
                <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                <path d="M12 12v6" />
                <path d="M9 16h6" />
              </svg>
            </div>
            <span className={styles.logoText}>MadaAgri</span>
          </Link>

          <div className={styles.navLinks}>
            <Link to="/" className={styles.navLink}>Accueil</Link>
            <Link to="/marketplace" className={styles.navLink}>Marketplace</Link>
          </div>
        </div>

        <div className={styles.right}>
          <div className={styles.themeWrapper}>
            <button
              className={styles.themeBtn}
              onClick={() => setThemeOpen(!themeOpen)}
              aria-label="Change theme"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            </button>
            {themeOpen && <ThemeSelector onClose={() => setThemeOpen(false)} />}
          </div>

          <Link to="/login" className={styles.loginBtn}>
            Se connecter
          </Link>

          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span className={mobileOpen ? styles.open : ''} />
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <Link to="/" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Accueil</Link>
          <Link to="/marketplace" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Marketplace</Link>
          <Link to="/login" className={styles.mobileLink} onClick={() => setMobileOpen(false)}>Se connecter</Link>
        </div>
      )}
    </nav>
  );
}
