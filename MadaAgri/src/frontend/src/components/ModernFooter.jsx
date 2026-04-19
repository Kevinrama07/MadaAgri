import { FiHeart } from 'react-icons/fi';
import '../styles/ModernFooter.css';

export default function ModernFooter() {
  return (
    <footer className="modern-footer">
      <div className="footer-container">
        {/* Footer Content */}
        <div className="footer-content">
          {/* Logo Section */}
          <div className="footer-section footer-branding">
            <h3 className="footer-logo">MadaAgri</h3>
            <p className="footer-description">
              Connecter les agriculteurs de Madagascar et construire une agriculture durable.
            </p>
            <div className="footer-social">
              <a href="#" className="social-link" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z"></path>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"></path>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="none" stroke="currentColor" strokeWidth="2"></rect>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" fill="none" stroke="currentColor" strokeWidth="2"></path>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor"></circle>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="footer-section-title">Ressources</h4>
            <ul className="footer-links">
              <li>
                <a href="#features">Fonctionnalités</a>
              </li>
              <li>
                <a href="#community">Communauté</a>
              </li>
              <li>
                <a href="#blog">Blog</a>
              </li>
              <li>
                <a href="#faq">FAQ</a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-section">
            <h4 className="footer-section-title">Entreprise</h4>
            <ul className="footer-links">
              <li>
                <a href="#about">À propos</a>
              </li>
              <li>
                <a href="#contact">Contact</a>
              </li>
              <li>
                <a href="#careers">Carrières</a>
              </li>
              <li>
                <a href="#press">Presse</a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="footer-section">
            <h4 className="footer-section-title">Légal</h4>
            <ul className="footer-links">
              <li>
                <a href="#privacy">Politique de confidentialité</a>
              </li>
              <li>
                <a href="#terms">Conditions d'utilisation</a>
              </li>
              <li>
                <a href="#cookies">Cookies</a>
              </li>
              <li>
                <a href="#security">Sécurité</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p className="footer-copyright">
            © 2026 MadaAgri. Tous droits réservés. • Construit avec <FiHeart style={{display: 'inline', marginLeft: '4px', marginRight: '4px', color: '#e91e63'}} size={14} /> pour les agriculteurs malgaches
          </p>
        </div>
      </div>
    </footer>
  );
}
