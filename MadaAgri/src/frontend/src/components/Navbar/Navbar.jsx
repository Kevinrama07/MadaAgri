import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiMenu, FiX, FiShoppingCart, FiUser, FiBell } from 'react-icons/fi';
import { ThemeSelector } from '../ThemeSelector/ThemeSelector';
import LanguageSwitcher from '../../i18n/components/LanguageSwitcher';
import styles from './Navbar.module.css';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Marketplace', path: '/marketplace' },
  { label: 'Dashboard', path: '/dashboard' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <header className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 22c4-4 8-7.5 8-12a8 8 0 1 0-16 0c0 4.5 4 8 8 12z" />
              <path d="M12 12m-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0" />
              <path d="M12 12v6" />
            </svg>
          </div>
          <span className={styles.logoText}>MadaAgri</span>
        </Link>

        <nav className={styles.nav}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.navLink} ${location.pathname === link.path ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <LanguageSwitcher />
          <ThemeSelector />
          <button className={styles.iconBtn} aria-label="Notifications">
            <FiBell size={18} />
          </button>
          <button className={styles.iconBtn} aria-label="Cart">
            <FiShoppingCart size={18} />
          </button>
          <Link to="/login" className={styles.userBtn}>
            <FiUser size={18} />
          </Link>
          <button
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`${styles.mobileNavLink} ${location.pathname === link.path ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className={styles.mobileUserLink}
            onClick={() => setMobileOpen(false)}
          >
            Sign In
          </Link>
        </div>
      )}
    </header>
  );
}
