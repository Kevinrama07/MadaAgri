import { useState } from 'react';
import { FiSettings, FiMoon, FiSun, FiLogOut, FiUser, FiBell, FiLock, FiGlobe, FiCheckCircle } from 'react-icons/fi';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/ContextAuthentification';
import styles from '../../styles/Parametres/Parametres.module.css';
import ThemeToggle from '../../components/ThemeToggle';
import clsx from 'clsx';

export default function Parametres() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  
  const [settings, setSettings] = useState({
    notifications: true,
    emailAlerts: true,
    smsAlerts: false,
    language: 'fr',
    privacy: 'friends',
  });

  const [showSaveMessage, setShowSaveMessage] = useState(false);

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      // TODO: Implement API call to save settings
      console.log('Saving settings:', settings);
      setShowSaveMessage(true);
      setTimeout(() => setShowSaveMessage(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Error logging out:', error);
      }
    }
  };

  return (
    <div className={clsx(styles['parametres-page'])}>
      <ThemeToggle />
      
      <div className={clsx(styles['parametres-container'])}>
        {/* Header */}
        <div className={clsx(styles['parametres-header'])}>
          <div className={clsx(styles['header-content'])}>
            <h1 className={clsx(styles['parametres-title'])}>
              <FiSettings size={32} />
              Paramètres
            </h1>
            <p className={clsx(styles['parametres-subtitle'])}>Gérez vos préférences et paramètres personnels</p>
          </div>
        </div>

        {/* Success Message */}
        {showSaveMessage && (
          <div className={clsx(styles['save-success-message'])}>
            <FiCheckCircle />
            Paramètres sauvegardés avec succès
          </div>
        )}

        {/* Settings Sections */}
        <div className={clsx(styles['settings-sections'])}>
          
          {/* User Profile Section */}
          <div className={clsx(styles['settings-section'])}>
            <div className={clsx(styles['section-header'])}>
              <FiUser size={20} />
              <h2>Profil Utilisateur</h2>
            </div>
            <div className={clsx(styles['section-content'])}>
              <div className={clsx(styles['user-info'])}>
                <div className={clsx(styles['user-avatar'])}>
                  <img src={user?.avatar || 'https://via.placeholder.com/100'} alt="User Avatar" />
                </div>
                <div className={clsx(styles['user-details'])}>
                  <p className={clsx(styles['user-name'])}>{user?.name || 'Utilisateur'}</p>
                  <p className={clsx(styles['user-email'])}>{user?.email || 'email@example.com'}</p>
                  <p className={clsx(styles['user-role'])}>Rôle: {user?.role === 'farmer' ? 'Agriculteur' : 'Client'}</p>
                </div>
              </div>
              <button className={clsx(styles['btn-edit-profile'])}>Éditer le profil</button>
            </div>
          </div>

          {/* Theme Settings Section */}
          <div className={clsx(styles['settings-section'])}>
            <div className={clsx(styles['section-header'])}>
              <FiSun size={20} />
              <h2>Apparence</h2>
            </div>
            <div className={clsx(styles['section-content'])}>
              <div className={clsx(styles['theme-option'])}>
                <div className={clsx(styles['theme-info'])}>
                  <label>Thème</label>
                  <p className={clsx(styles['theme-description'])}>
                    Sélectionnez entre le mode sombre et le mode clair
                  </p>
                </div>
                <div className={clsx(styles['theme-toggle-container'])}>
                  <div className={clsx(styles['theme-display'])}>
                    {theme === 'dark' ? (
                      <FiMoon size={24} />
                    ) : (
                      <FiSun size={24} />
                    )}
                    <span>{theme === 'dark' ? 'Mode Sombre' : 'Mode Clair'}</span>
                  </div>
                  <button 
                    className={clsx(styles['btn-toggle-theme'])}
                    onClick={toggleTheme}
                  >
                    {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
                    Changer de thème
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications Section */}
          <div className={clsx(styles['settings-section'])}>
            <div className={clsx(styles['section-header'])}>
              <FiBell size={20} />
              <h2>Notifications</h2>
            </div>
            <div className={clsx(styles['section-content'])}>
              <div className={clsx(styles['notification-item'])}>
                <div className={clsx(styles['notification-info'])}>
                  <label>Notifications en application</label>
                  <p className={clsx(styles['notification-description'])}>
                    Recevoir les notifications dans l'application
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                  className={clsx(styles['toggle-checkbox'])}
                />
              </div>
              <div className={clsx(styles['notification-item'])}>
                <div className={clsx(styles['notification-info'])}>
                  <label>Alertes par email</label>
                  <p className={clsx(styles['notification-description'])}>
                    Recevoir les notifications par email
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.emailAlerts}
                  onChange={(e) => handleSettingChange('emailAlerts', e.target.checked)}
                  className={clsx(styles['toggle-checkbox'])}
                />
              </div>
              <div className={clsx(styles['notification-item'])}>
                <div className={clsx(styles['notification-info'])}>
                  <label>Alertes par SMS</label>
                  <p className={clsx(styles['notification-description'])}>
                    Recevoir les notifications par SMS
                  </p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.smsAlerts}
                  onChange={(e) => handleSettingChange('smsAlerts', e.target.checked)}
                  className={clsx(styles['toggle-checkbox'])}
                />
              </div>
            </div>
          </div>

          {/* Language Section */}
          <div className={clsx(styles['settings-section'])}>
            <div className={clsx(styles['section-header'])}>
              <FiGlobe size={20} />
              <h2>Langue</h2>
            </div>
            <div className={clsx(styles['section-content'])}>
              <div className={clsx(styles['language-option'])}>
                <label>Langue préférée</label>
                <select 
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className={clsx(styles['language-select'])}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="mg">Malagasy</option>
                </select>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className={clsx(styles['settings-section'])}>
            <div className={clsx(styles['section-header'])}>
              <FiLock size={20} />
              <h2>Confidentialité & Sécurité</h2>
            </div>
            <div className={clsx(styles['section-content'])}>
              <div className={clsx(styles['privacy-option'])}>
                <label>Qui peut voir mon profil</label>
                <select 
                  value={settings.privacy}
                  onChange={(e) => handleSettingChange('privacy', e.target.value)}
                  className={clsx(styles['privacy-select'])}
                >
                  <option value="public">Public</option>
                  <option value="friends">Amis uniquement</option>
                  <option value="private">Privé</option>
                </select>
              </div>
              <button className={clsx(styles['btn-change-password'])}>Changer le mot de passe</button>
              <button className={clsx(styles['btn-two-factor'])}>Activer l'authentification à deux facteurs</button>
            </div>
          </div>

          {/* Save Button */}
          <div className={clsx(styles['settings-actions'])}>
            <button 
              className={clsx(styles['btn-save-settings'])}
              onClick={handleSaveSettings}
            >
              Sauvegarder les paramètres
            </button>
            <button 
              className={clsx(styles['btn-logout'])}
              onClick={handleLogout}
            >
              <FiLogOut size={18} />
              Se déconnecter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
