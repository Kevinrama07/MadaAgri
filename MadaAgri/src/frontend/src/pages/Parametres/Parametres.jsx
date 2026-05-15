import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { FiSettings, FiMoon, FiSun, FiLogOut, FiEdit2, FiLock, FiShield, FiHelpCircle, FiFileText, FiChevronRight, FiArrowRight, FiBell, FiGlobe, FiCheckCircle } from 'react-icons/fi';
import { useModernScrollbar } from '../../hooks/useModernScrollbar';
import styles from '../../styles/Composants/TableauDeBord.module.css';
import settingsStyles from '../../styles/Parametres/Parametres.module.css';

export default function SettingsPage({ user, onLogout }) {
  const scrollContainerRef = useRef(null);
  const [theme, setTheme] = useState('dark');
  const [showSaveMessage, setShowSaveMessage] = useState(false);
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    language: 'fr',
    privacy: 'friends',
  });

  // Appliquer les scrollbars modernes
  useModernScrollbar(scrollContainerRef, 2000);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(currentTheme);
  }, []);

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme-mode', newTheme);
    setTheme(newTheme);
  };

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      console.log('Saving settings:', settings);
      setShowSaveMessage(true);
      setTimeout(() => setShowSaveMessage(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      if (onLogout) {
        await onLogout();
      }
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className={clsx('modern-scrollbar')}
      style={{
        height: '100%',
        overflow: 'auto',
        paddingRight: '8px'
      }}
    >
      <div className={clsx(styles['space-y-3'])}>
        {/* Header */}
        <div className={clsx(styles['mb-30'])}>
          <h2 className={clsx(styles['text-mg'], styles['font-700'])}>
            <FiSettings size={24} style={{ marginRight: '12px', display: 'inline' }} />
            Paramètres
          </h2>
        </div>

        {/* Success Message */}
        {showSaveMessage && (
          <div className={clsx(settingsStyles['save-success-message'])}>
            <FiCheckCircle />
            Paramètres sauvegardés avec succès
          </div>
        )}

        {/* Profile Card */}
        <div className={clsx(styles['mg-card'], settingsStyles['profile-card'])}>
          <div className={clsx(settingsStyles['profile-content'])}>
            <div className={clsx(settingsStyles['user-avatar'])}>
              <img src={user?.profile_image_url || '/src/images/avatar.gif'} alt="Avatar" />
            </div>
            <div className={clsx(settingsStyles['user-details'])}>
              <p className={clsx(settingsStyles['user-name'])}>{user?.name || user?.display_name || 'Utilisateur'}</p>
              <p className={clsx(settingsStyles['user-email'])}>{user?.email}</p>
              <p className={clsx(settingsStyles['user-role'])}>
                {user?.role === 'farmer' ? '🌾 Agriculteur' : '👤 Client'}
              </p>
            </div>
            <FiChevronRight className={clsx(settingsStyles['chevron-icon'])} />
          </div>
        </div>

        {/* Account Section */}
        <div className={clsx(styles['mg-card'])}>
          <h3 className={clsx(settingsStyles['section-title'])}>Compte</h3>
          
          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiEdit2 size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Modifier le profil</p>
              <p className={clsx(settingsStyles['menu-item-subtitle'])}>Nom, photo, bio, etc.</p>
            </div>
            <FiChevronRight size={20} />
          </div>

          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiLock size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Sécurité</p>
              <p className={clsx(settingsStyles['menu-item-subtitle'])}>Mot de passe, authentification</p>
            </div>
            <FiChevronRight size={20} />
          </div>
        </div>

        {/* Preferences Section */}
        <div className={clsx(styles['mg-card'])}>
          <h3 className={clsx(settingsStyles['section-title'])}>Préférences</h3>

          {/* Theme */}
          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              {theme === 'dark' ? <FiMoon size={20} /> : <FiSun size={20} />}
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Mode sombre</p>
              <p className={clsx(settingsStyles['menu-item-subtitle'])}>
                {theme === 'dark' ? 'Activé' : 'Désactivé'}
              </p>
            </div>
            <label className={clsx(settingsStyles['toggle-switch'])}>
              <input 
                type="checkbox" 
                checked={theme === 'dark'}
                onChange={toggleTheme}
              />
              <span className={clsx(settingsStyles['slider'])}></span>
            </label>
          </div>

          {/* Notifications */}
          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiBell size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Notifications push</p>
              <p className={clsx(settingsStyles['menu-item-subtitle'])}>Recevoir les notifications</p>
            </div>
            <label className={clsx(settingsStyles['toggle-switch'])}>
              <input 
                type="checkbox" 
                checked={settings.notifications}
                onChange={(e) => handleSettingChange('notifications', e.target.checked)}
              />
              <span className={clsx(settingsStyles['slider'])}></span>
            </label>
          </div>

          {/* Email Notifications */}
          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiGlobe size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Notifications email</p>
              <p className={clsx(settingsStyles['menu-item-subtitle'])}>Recevoir des emails</p>
            </div>
            <label className={clsx(settingsStyles['toggle-switch'])}>
              <input 
                type="checkbox" 
                checked={settings.emailAlerts}
                onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
              />
              <span className={clsx(settingsStyles['slider'])}></span>
            </label>
          </div>

          {/* Language */}
          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiGlobe size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Langue préférée</p>
            </div>
            <select 
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className={clsx(settingsStyles['language-select'])}
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="mg">Malagasy</option>
            </select>
          </div>
        </div>

        {/* Privacy & Security Section */}
        <div className={clsx(styles['mg-card'])}>
          <h3 className={clsx(settingsStyles['section-title'])}>Confidentialité & Sécurité</h3>

          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiShield size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Qui peut voir mon profil</p>
            </div>
            <select 
              value={settings.privacy}
              onChange={(e) => handleSettingChange('privacy', e.target.value)}
              className={clsx(settingsStyles['privacy-select'])}
            >
              <option value="public">Public</option>
              <option value="friends">Amis uniquement</option>
              <option value="private">Privé</option>
            </select>
          </div>

          <button className={clsx(settingsStyles['action-button'])}>
            <FiLock size={18} />
            Changer le mot de passe
            <FiArrowRight size={16} />
          </button>

          <button className={clsx(settingsStyles['action-button'])}>
            <FiShield size={18} />
            Activer l'authentification à deux facteurs
            <FiArrowRight size={16} />
          </button>
        </div>

        {/* About Section */}
        <div className={clsx(styles['mg-card'])}>
          <h3 className={clsx(settingsStyles['section-title'])}>À propos</h3>

          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiHelpCircle size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Aide & Support</p>
            </div>
            <FiChevronRight size={20} />
          </div>

          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiShield size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Confidentialité</p>
            </div>
            <FiChevronRight size={20} />
          </div>

          <div className={clsx(settingsStyles['menu-item'])}>
            <div className={clsx(settingsStyles['menu-item-icon'])}>
              <FiFileText size={20} />
            </div>
            <div className={clsx(settingsStyles['menu-item-content'])}>
              <p className={clsx(settingsStyles['menu-item-title'])}>Conditions d'utilisation</p>
            </div>
            <FiChevronRight size={20} />
          </div>

          <p className={clsx(settingsStyles['app-version'])}>Version 1.0.0</p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
          <button 
            type="button"
            className={clsx(styles['mg-tab-btn'])}
            onClick={handleSaveSettings}
            style={{ flex: 1, minWidth: '200px' }}
          >
            Sauvegarder les paramètres
          </button>
          <button 
            type="button"
            className={clsx(styles['mg-tab-btn'])}
            onClick={handleLogout}
            style={{ 
              background: 'linear-gradient(135deg, rgba(220, 53, 69, 0.2), rgba(220, 53, 69, 0.1))',
              color: '#ff6b7a',
              border: '1.5px solid rgba(220, 53, 69, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <FiLogOut size={18} />
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
