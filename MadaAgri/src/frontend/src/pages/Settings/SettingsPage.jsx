import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card/Card';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/ContextAuthentification';
import { dataApi, authApi } from '../../lib/api';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const { theme, preset, themes, selectTheme, mode, setMode, customPrimary, setPrimaryColor } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [colorMode, setColorMode] = useState(customPrimary ? 'custom' : 'preset');
  const [profileForm, setProfileForm] = useState({
    name: user?.display_name || '',
    email: user?.email || '',
    location: user?.location || '',
    bio: user?.bio || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [privacySettings, setPrivacySettings] = useState({
    profileVisible: true,
    showEmail: false,
    showLocation: true,
    allowMessages: true,
    showActivity: true,
  });
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saveError, setSaveError] = useState(null);

  const tabs = [
    { id: 'profile', label: 'Profil', icon: 'user' },
    { id: 'security', label: 'Sécurité', icon: 'lock' },
    { id: 'privacy', label: 'Confidentialité', icon: 'eye' },
    { id: 'appearance', label: 'Apparence', icon: 'palette' },
    { id: 'notifications', label: 'Notifications', icon: 'bell' },
    { id: 'about', label: 'À propos', icon: 'info' },
  ];

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);
    if (passwordForm.new !== passwordForm.confirm) {
      setSaveError('Les mots de passe ne correspondent pas');
      return;
    }
    setSaving(true);
    try {
      await dataApi.changePassword(passwordForm.current, passwordForm.new);
      setSaveMessage('Mot de passe mis à jour avec succès');
      setPasswordForm({ current: '', new: '', confirm: '' });
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la mise à jour du mot de passe');
    } finally {
      setSaving(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      const updatedUser = await dataApi.updateUserProfile({
        display_name: profileForm.name,
        location: profileForm.location,
        bio: profileForm.bio,
      });
      setSaveMessage('Profil mis à jour avec succès');
      authApi.me();
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde du profil');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate('/login');
  };

  const renderIcon = (name) => {
    const icons = {
      user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
      lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
      eye: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
      palette: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" /><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" /><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" /><circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" /></svg>,
      bell: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
      info: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>,
    };
    return icons[name] || null;
  };

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>Paramètres</h1>

          {(saveMessage || saveError) && (
            <div className={`${styles.notification} ${saveError ? styles.notificationError : styles.notificationSuccess}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                {saveError ? (
                  <>
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </>
                ) : (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </>
                )}
              </svg>
              <span>{saveError || saveMessage}</span>
              <button className={styles.notificationClose} onClick={() => { setSaveMessage(null); setSaveError(null); }}>×</button>
            </div>
          )}

          <div className={styles.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {renderIcon(tab.icon)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {activeTab === 'profile' && (
            <>
              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Informations du profil</h2>
                <form onSubmit={handleProfileSave}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Nom complet</label>
                      <input
                        className={styles.input}
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Email</label>
                      <input
                        className={styles.input}
                        type="email"
                        value={profileForm.email}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Localisation</label>
                      <input
                        className={styles.input}
                        value={profileForm.location}
                        onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Rôle</label>
                      <input className={styles.input} value={user?.role === 'farmer' ? 'Agriculteur' : 'Client'} disabled />
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Bio</label>
                      <textarea
                        className={styles.textarea}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn} disabled={saving}>
                      {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  </div>
                </form>
              </Card>

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Compte</h2>
                <button className={styles.dangerBtn} onClick={handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Se déconnecter
                </button>
              </Card>
            </>
          )}

          {activeTab === 'security' && (
            <Card className={styles.settingsCard}>
              <h2 className={styles.sectionTitle}>Modifier le mot de passe</h2>
              <form onSubmit={handlePasswordChange}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Mot de passe actuel</label>
                    <input
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.current}
                      onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                      required
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nouveau mot de passe</label>
                    <input
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.new}
                      onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Confirmer le nouveau mot de passe</label>
                    <input
                      className={styles.input}
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.confirm}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      required
                      minLength={8}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.toggle}>
                      <input type="checkbox" checked={showPassword} onChange={() => setShowPassword(!showPassword)} />
                      <span className={styles.toggleSlider} />
                    </label>
                    Afficher les mots de passe
                  </div>
                </div>
                {passwordForm.new && passwordForm.confirm && passwordForm.new !== passwordForm.confirm && (
                  <p className={styles.errorText}>Les mots de passe ne correspondent pas</p>
                )}
                <div className={styles.formActions}>
                  <button type="submit" className={styles.saveBtn} disabled={saving || passwordForm.new !== passwordForm.confirm || !passwordForm.new}>
                    {saving ? 'Mise à jour...' : 'Mettre à jour'}
                  </button>
                </div>
              </form>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card className={styles.settingsCard}>
              <h2 className={styles.sectionTitle}>Paramètres de confidentialité</h2>
              {[
                { key: 'profileVisible', label: 'Profil visible', desc: 'Les autres utilisateurs peuvent voir votre profil' },
                { key: 'showEmail', label: 'Afficher l\'email', desc: 'Montrer votre email sur votre profil public' },
                { key: 'showLocation', label: 'Afficher la localisation', desc: 'Montrer votre région sur votre profil' },
                { key: 'allowMessages', label: 'Autoriser les messages', desc: 'Recevoir des messages d\'autres utilisateurs' },
                { key: 'showActivity', label: 'Afficher l\'activité', desc: 'Montrer votre activité récente sur le profil' },
              ].map((pref) => (
                <div key={pref.key} className={styles.prefRow}>
                  <div>
                    <span className={styles.prefLabel}>{pref.label}</span>
                    <span className={styles.prefDesc}>{pref.desc}</span>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={privacySettings[pref.key]}
                      onChange={() => setPrivacySettings({ ...privacySettings, [pref.key]: !privacySettings[pref.key] })}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'appearance' && (
            <>
              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Mode d'affichage</h2>
                <div className={styles.modeToggle}>
                  <button
                    className={`${styles.modeBtn} ${mode === 'light' ? styles.modeBtnActive : ''}`}
                    onClick={() => setMode('light')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <circle cx="12" cy="12" r="5" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    <span>Clair</span>
                  </button>
                  <button
                    className={`${styles.modeBtn} ${mode === 'dark' ? styles.modeBtnActive : ''}`}
                    onClick={() => setMode('dark')}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                    <span>Sombre</span>
                  </button>
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Couleur principale</h2>
                <p className={styles.colorDescription}>Choisissez une couleur qui sera appliquée globalement à toutes les pages.</p>

                <div className={styles.secondaryModeToggle}>
                  <button
                    className={`${styles.secondaryModeBtn} ${colorMode === 'preset' ? styles.secondaryModeBtnActive : ''}`}
                    onClick={() => { setColorMode('preset'); setPrimaryColor(null); }}
                  >
                    Thèmes
                  </button>
                  <button
                    className={`${styles.secondaryModeBtn} ${colorMode === 'custom' ? styles.secondaryModeBtnActive : ''}`}
                    onClick={() => setColorMode('custom')}
                  >
                    Personnalisé
                  </button>
                </div>

                {colorMode === 'preset' && (
                  <div className={styles.themeGrid}>
                    {Object.entries(themes).map(([key, t]) => (
                      <button
                        key={key}
                        className={`${styles.themeBtn} ${preset === key && !customPrimary ? styles.themeBtnActive : ''}`}
                        onClick={() => { selectTheme(key); setPrimaryColor(null); setColorMode('preset'); }}
                      >
                        <div className={styles.themePreview}>
                          <span className={styles.themeDot} style={{ background: t[mode].primary }} />
                          <span className={styles.themeDot} style={{ background: t[mode].secondary }} />
                          <span className={styles.themeDot} style={{ background: t[mode].accent }} />
                        </div>
                        <span className={styles.themeName}>{t.name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {colorMode === 'custom' && (
                  <div className={styles.customSecondary}>
                    <input
                      type="color"
                      value={customPrimary ? customPrimary[mode] : theme.primary}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className={styles.customColorInput}
                    />
                    <span className={styles.customColorLabel}>Choisir une couleur</span>
                    <span className={styles.customColorValue}>
                      {customPrimary ? customPrimary[mode] : theme.primary}
                    </span>
                  </div>
                )}

                <div className={styles.secondaryPreview}>
                  <span className={styles.previewLabel}>Aperçu</span>
                  <div className={styles.previewRow}>
                    <button className={styles.previewBtnPrimary}>Bouton principal</button>
                    <span className={styles.previewBadge}>Badge</span>
                    <span className={styles.previewText} style={{ color: theme.primary }}>Texte coloré</span>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeTab === 'notifications' && (
            <Card className={styles.settingsCard}>
              <h2 className={styles.sectionTitle}>Préférences de notification</h2>
              {[
                { label: 'Nouvelles commandes', desc: 'Être notifié lors d\'une nouvelle commande', defaultChecked: true },
                { label: 'Messages', desc: 'Être notifié lors d\'un nouveau message', defaultChecked: true },
                { label: 'Avis', desc: 'Être notifié lors d\'un nouvel avis', defaultChecked: false },
                { label: 'Alertes prix', desc: 'Être notifié des changements de prix', defaultChecked: true },
                { label: 'Alertes météo', desc: 'Être notifié des conditions météorologiques sévères', defaultChecked: true },
              ].map((pref, i) => (
                <div key={i} className={styles.prefRow}>
                  <div>
                    <span className={styles.prefLabel}>{pref.label}</span>
                    <span className={styles.prefDesc}>{pref.desc}</span>
                  </div>
                  <label className={styles.toggle}>
                    <input type="checkbox" defaultChecked={pref.defaultChecked} />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              ))}
            </Card>
          )}

          {activeTab === 'about' && (
            <>
              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>À propos de MadaAgri</h2>
                <div className={styles.aboutContent}>
                  <p className={styles.aboutText}>
                    MadaAgri est une plateforme agricole innovante conçue pour les agriculteurs de Madagascar.
                    Notre mission est de connecter les producteurs avec les acheteurs, faciliter le commerce
                    agricole et fournir des outils d'analyse pour optimiser la production.
                  </p>
                  <div className={styles.aboutInfo}>
                    <div className={styles.aboutItem}>
                      <span className={styles.aboutLabel}>Version</span>
                      <span className={styles.aboutValue}>1.0.0</span>
                    </div>
                    <div className={styles.aboutItem}>
                      <span className={styles.aboutLabel}>Développé par</span>
                      <span className={styles.aboutValue}>MadaAgri Team</span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Conditions d'utilisation</h2>
                <div className={styles.termsContent}>
                  <p className={styles.termsText}>
                    En utilisant MadaAgri, vous acceptez les conditions suivantes :
                  </p>
                  <ul className={styles.termsList}>
                    <li>Vous devez être un agriculteur ou acheteur légitime à Madagascar</li>
                    <li>Les informations fournies doivent être exactes et à jour</li>
                    <li>Vous êtes responsable de la qualité des produits listés</li>
                    <li>Les transactions sont soumises aux lois commerciales malgaches</li>
                    <li>MadaAgri se réserve le droit de suspendre les comptes frauduleux</li>
                    <li>Vos données personnelles sont protégées conformément à la législation</li>
                  </ul>
                </div>
              </Card>

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Politique de confidentialité</h2>
                <div className={styles.termsContent}>
                  <p className={styles.termsText}>
                    MadaAgri s'engage à protéger vos données personnelles :
                  </p>
                  <ul className={styles.termsList}>
                    <li>Vos données ne sont jamais vendues à des tiers</li>
                    <li>Les informations de profil sont visibles selon vos paramètres de confidentialité</li>
                    <li>Les données de transaction sont conservées de manière sécurisée</li>
                    <li>Vous pouvez demander la suppression de votre compte à tout moment</li>
                    <li>Les cookies sont utilisés uniquement pour améliorer l'expérience utilisateur</li>
                  </ul>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
