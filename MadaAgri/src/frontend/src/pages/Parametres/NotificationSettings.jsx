import React, { useState, useEffect } from 'react';
import { FiBell, FiMail, FiSmartphone, FiVolume2, FiMoon } from 'react-icons/fi';
import notificationService from '../../services/notificationService';
import styles from './NotificationSettings.module.css';

export default function NotificationSettings() {
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    push_enabled: true,
    sound_enabled: true,
    types_enabled: {
      message: true,
      collaboration: true,
      follow: true,
      like: true,
      comment: true
    },
    quiet_hours_start: null,
    quiet_hours_end: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await notificationService.getPreferences();
      if (prefs.types_enabled && typeof prefs.types_enabled === 'string') {
        prefs.types_enabled = JSON.parse(prefs.types_enabled);
      }
      setPreferences(prefs);
    } catch (error) {
      console.error('Failed to load preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await notificationService.updatePreferences(preferences);
      alert('Préférences enregistrées');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const toggleType = (type) => {
    setPreferences(prev => ({
      ...prev,
      types_enabled: {
        ...prev.types_enabled,
        [type]: !prev.types_enabled[type]
      }
    }));
  };

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <FiBell size={28} />
        <div>
          <h1>Paramètres des notifications</h1>
          <p>Gérez vos préférences de notifications</p>
        </div>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>Canaux de notification</h2>
          
          <div className={styles.option}>
            <div className={styles.optionLeft}>
              <FiMail size={20} />
              <div>
                <strong>Notifications par email</strong>
                <p>Recevoir des notifications par email</p>
              </div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => setPreferences({ ...preferences, email_enabled: e.target.checked })}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.option}>
            <div className={styles.optionLeft}>
              <FiSmartphone size={20} />
              <div>
                <strong>Notifications push</strong>
                <p>Recevoir des notifications push sur vos appareils</p>
              </div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.push_enabled}
                onChange={(e) => setPreferences({ ...preferences, push_enabled: e.target.checked })}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          <div className={styles.option}>
            <div className={styles.optionLeft}>
              <FiVolume2 size={20} />
              <div>
                <strong>Sons de notification</strong>
                <p>Jouer un son lors de la réception d'une notification</p>
              </div>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={preferences.sound_enabled}
                onChange={(e) => setPreferences({ ...preferences, sound_enabled: e.target.checked })}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Types de notifications</h2>
          
          {Object.entries(preferences.types_enabled || {}).map(([type, enabled]) => (
            <div key={type} className={styles.option}>
              <div className={styles.optionLeft}>
                <span className={styles.typeIcon}>{getTypeIcon(type)}</span>
                <div>
                  <strong>{getTypeLabel(type)}</strong>
                  <p>{getTypeDescription(type)}</p>
                </div>
              </div>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => toggleType(type)}
                />
                <span className={styles.slider}></span>
              </label>
            </div>
          ))}
        </section>

        <section className={styles.section}>
          <h2>Heures silencieuses</h2>
          <p className={styles.sectionDesc}>
            Ne pas recevoir de notifications pendant ces heures
          </p>
          
          <div className={styles.timeInputs}>
            <div className={styles.timeInput}>
              <label>Début</label>
              <input
                type="time"
                value={preferences.quiet_hours_start || ''}
                onChange={(e) => setPreferences({ ...preferences, quiet_hours_start: e.target.value })}
              />
            </div>
            <div className={styles.timeInput}>
              <label>Fin</label>
              <input
                type="time"
                value={preferences.quiet_hours_end || ''}
                onChange={(e) => setPreferences({ ...preferences, quiet_hours_end: e.target.value })}
              />
            </div>
          </div>
        </section>

        <div className={styles.actions}>
          <button onClick={handleSave} disabled={saving} className={styles.btnSave}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getTypeIcon(type) {
  const icons = {
    message: '💬',
    collaboration: '🤝',
    follow: '👤',
    like: '❤️',
    comment: '💭'
  };
  return icons[type] || '🔔';
}

function getTypeLabel(type) {
  const labels = {
    message: 'Messages',
    collaboration: 'Collaborations',
    follow: 'Nouveaux abonnés',
    like: 'J\'aime',
    comment: 'Commentaires'
  };
  return labels[type] || type;
}

function getTypeDescription(type) {
  const descriptions = {
    message: 'Nouveaux messages privés',
    collaboration: 'Invitations de collaboration',
    follow: 'Nouvelles demandes d\'abonnement',
    like: 'J\'aime sur vos publications',
    comment: 'Commentaires sur vos publications'
  };
  return descriptions[type] || '';
}
