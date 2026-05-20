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
  const [preferences, setPreferences] = useState({
    language: user?.language || 'fr',
    timezone: user?.timezone || 'Indian/Antananarivo',
    dateFormat: user?.date_format || 'DD/MM/YYYY',
  });
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.two_factor_enabled || false);
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [notificationSettings, setNotificationSettings] = useState({
    newOrders: true,
    messages: true,
    reviews: false,
    priceAlerts: true,
    weatherAlerts: true,
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
        language: preferences.language,
        timezone: preferences.timezone,
        date_format: preferences.dateFormat,
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

  const handleEnable2FA = async () => {
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      const data = await dataApi.enable2FA();
      setTwoFactorSecret(data.secret);
      setTwoFactorSecret(data.qrCodeUrl);
      setShowTwoFactorSetup(true);
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de l\'activation de la 2FA');
    } finally {
      setSaving(false);
    }
  };

  const handleVerify2FA = async () => {
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      await dataApi.verify2FA(twoFactorCode);
      setTwoFactorEnabled(true);
      setShowTwoFactorSetup(false);
      setTwoFactorSecret(null);
      setTwoFactorCode('');
      setSaveMessage('Authentification à deux facteurs activée');
    } catch (err) {
      setSaveError(err.message || 'Code de vérification invalide');
    } finally {
      setSaving(false);
    }
  };

  const handleDisable2FA = async () => {
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      await dataApi.disable2FA();
      setTwoFactorEnabled(false);
      setSaveMessage('Authentification à deux facteurs désactivée');
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la désactivation de la 2FA');
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = async () => {
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      const blob = await dataApi.exportUserData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `madaagri_data_export_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSaveMessage('Export de données en cours de téléchargement');
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de l\'export de vos données');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER MON COMPTE') {
      setSaveError('Veuillez taper "SUPPRIMER MON COMPTE" pour confirmer');
      return;
    }
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      await dataApi.deleteAccount();
      signOut();
      navigate('/login');
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la suppression du compte');
      setSaving(false);
    }
  };

  const handleNotificationSave = async () => {
    setSaveError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      await dataApi.updateNotificationPreferences(notificationSettings);
      setSaveMessage('Préférences de notification sauvegardées');
    } catch (err) {
      setSaveError(err.message || 'Erreur lors de la sauvegarde des notifications');
    } finally {
      setSaving(false);
    }
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
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Langue</label>
                      <select
                        className={styles.input}
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                        <option value="mg">Malagasy</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Fuseau horaire</label>
                      <select
                        className={styles.input}
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      >
                        <option value="Indian/Antananarivo">Antananarivo (UTC+3)</option>
                        <option value="Europe/Paris">Paris (UTC+1/UTC+2)</option>
                        <option value="UTC">UTC</option>
                      </select>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Format de date</label>
                      <select
                        className={styles.input}
                        value={preferences.dateFormat}
                        onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      >
                        <option value="DD/MM/YYYY">JJ/MM/AAAA</option>
                        <option value="MM/DD/YYYY">MM/JJ/AAAA</option>
                        <option value="YYYY-MM-DD">AAAA-MM-JJ</option>
                      </select>
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
            <>
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

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Authentification à deux facteurs (2FA)</h2>
                <p className={styles.aboutText} style={{ marginBottom: 16 }}>
                  Ajoutez une couche de sécurité supplémentaire en要求 un code de vérification lors de la connexion.
                </p>

                {!showTwoFactorSetup && !twoFactorEnabled && (
                  <button
                    className={styles.saveBtn}
                    onClick={handleEnable2FA}
                    disabled={saving}
                  >
                    {saving ? 'Activation...' : 'Activer la 2FA'}
                  </button>
                )}

                {showTwoFactorSetup && twoFactorSecret && (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <p className={styles.aboutText}>
                        1. Scannez ce QR code avec votre application d'authentification (Google Authenticator, Authy, etc.)
                      </p>
                      <img src={twoFactorSecret.qrCodeUrl} alt="QR Code 2FA" style={{ maxWidth: 200, margin: '12px 0' }} />
                      <p className={styles.aboutText}>
                        2. Ou entrez manuellement cette clé : <code style={{ background: 'var(--background-secondary)', padding: '2px 6px', borderRadius: 4 }}>{twoFactorSecret.secret}</code>
                      </p>
                    </div>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Code de vérification</label>
                      <input
                        className={styles.input}
                        type="text"
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value)}
                        placeholder="Entrez le code à 6 chiffres"
                        maxLength={6}
                        pattern="[0-9]{6}"
                      />
                    </div>
                    <div className={styles.formActions} style={{ gap: 8 }}>
                      <button
                        className={styles.saveBtn}
                        onClick={handleVerify2FA}
                        disabled={saving || twoFactorCode.length !== 6}
                      >
                        {saving ? 'Vérification...' : 'Vérifier et activer'}
                      </button>
                      <button
                        className={styles.saveBtn}
                        style={{ background: 'var(--background-secondary)', color: 'var(--text)' }}
                        onClick={() => { setShowTwoFactorSetup(false); setTwoFactorSecret(null); setTwoFactorCode(''); }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}

                {twoFactorEnabled && !showTwoFactorSetup && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2" width="20" height="20">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>2FA activée</span>
                    </div>
                    <button
                      className={styles.dangerBtn}
                      onClick={handleDisable2FA}
                      disabled={saving}
                    >
                      {saving ? 'Désactivation...' : 'Désactiver la 2FA'}
                    </button>
                  </div>
                )}
              </Card>

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Sessions actives</h2>
                <p className={styles.aboutText} style={{ marginBottom: 16 }}>
                  Gérez les appareils connectés à votre compte.
                </p>
                <button
                  className={styles.saveBtn}
                  style={{ background: 'var(--background-secondary)', color: 'var(--text)' }}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await dataApi.revokeAllSessions();
                      setSaveMessage('Toutes les autres sessions ont été fermées');
                    } catch (err) {
                      setSaveError(err.message || 'Erreur lors de la fermeture des sessions');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                >
                  Fermer toutes les autres sessions
                </button>
              </Card>
            </>
          )}

          {activeTab === 'privacy' && (
            <>
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

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Vos données (RGPD)</h2>
                <p className={styles.aboutText} style={{ marginBottom: 16 }}>
                  Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button
                    className={styles.saveBtn}
                    onClick={handleExportData}
                    disabled={saving}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18" style={{ marginRight: 8 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    {saving ? 'Préparation de l\'export...' : 'Exporter mes données'}
                  </button>

                  <button
                    className={styles.dangerBtn}
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={saving}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                    Supprimer mon compte
                  </button>
                </div>

                {showDeleteConfirm && (
                  <div style={{ marginTop: 20, padding: 16, background: 'var(--error-light, rgba(239, 68, 68, 0.1))', borderRadius: 'var(--radius-md)', border: '1px solid var(--error)' }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--error)', marginBottom: 8 }}>
                      Confirmation de suppression
                    </h3>
                    <p className={styles.aboutText} style={{ marginBottom: 12 }}>
                      Cette action est irréversible. Toutes vos données seront supprimées définitivement.
                    </p>
                    <div className={styles.formGroup}>
                      <label className={styles.label}>
                        Tapez <strong>"SUPPRIMER MON COMPTE"</strong> pour confirmer
                      </label>
                      <input
                        className={styles.input}
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="SUPPRIMER MON COMPTE"
                      />
                    </div>
                    <div className={styles.formActions} style={{ gap: 8 }}>
                      <button
                        className={styles.dangerBtn}
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'SUPPRIMER MON COMPTE' || saving}
                      >
                        {saving ? 'Suppression...' : 'Confirmer la suppression'}
                      </button>
                      <button
                        className={styles.saveBtn}
                        style={{ background: 'var(--background-secondary)', color: 'var(--text)' }}
                        onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </Card>

              <Card className={styles.settingsCard}>
                <h2 className={styles.sectionTitle}>Conservation des données</h2>
                <div className={styles.aboutInfo}>
                  <div className={styles.aboutItem}>
                    <span className={styles.aboutLabel}>Données de compte</span>
                    <span className={styles.aboutValue}>Conservées jusqu'à suppression</span>
                  </div>
                  <div className={styles.aboutItem}>
                    <span className={styles.aboutLabel}>Historique des transactions</span>
                    <span className={styles.aboutValue}>7 ans (obligation légale)</span>
                  </div>
                  <div className={styles.aboutItem}>
                    <span className={styles.aboutLabel}>Logs de connexion</span>
                    <span className={styles.aboutValue}>12 mois</span>
                  </div>
                  <div className={styles.aboutItem}>
                    <span className={styles.aboutLabel}>Cookies</span>
                    <span className={styles.aboutValue}>13 mois</span>
                  </div>
                </div>
              </Card>
            </>
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
                { key: 'newOrders', label: 'Nouvelles commandes', desc: 'Être notifié lors d\'une nouvelle commande' },
                { key: 'messages', label: 'Messages', desc: 'Être notifié lors d\'un nouveau message' },
                { key: 'reviews', label: 'Avis', desc: 'Être notifié lors d\'un nouvel avis' },
                { key: 'priceAlerts', label: 'Alertes prix', desc: 'Être notifié des changements de prix' },
                { key: 'weatherAlerts', label: 'Alertes météo', desc: 'Être notifié des conditions météorologiques sévères' },
              ].map((pref) => (
                <div key={pref.key} className={styles.prefRow}>
                  <div>
                    <span className={styles.prefLabel}>{pref.label}</span>
                    <span className={styles.prefDesc}>{pref.desc}</span>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings[pref.key]}
                      onChange={() => setNotificationSettings({ ...notificationSettings, [pref.key]: !notificationSettings[pref.key] })}
                    />
                    <span className={styles.toggleSlider} />
                  </label>
                </div>
              ))}
              <div className={styles.formActions}>
                <button type="button" className={styles.saveBtn} onClick={handleNotificationSave} disabled={saving}>
                  {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
                </button>
              </div>
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
