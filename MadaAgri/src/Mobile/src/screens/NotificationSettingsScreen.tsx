import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { ScreenHeader } from '../components/ScreenHeader';
import { ModernCard } from '../components/ModernCard';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import notificationApiService, { NotificationPreferences } from '../services/notificationApiService';

export const NotificationSettingsScreen = () => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_enabled: true,
    push_enabled: true,
    sound_enabled: true,
    vibration_enabled: true,
    types_enabled: {
      message: true,
      collaboration: true,
      follow: true,
      like: true,
      comment: true,
    },
    quiet_hours_start: null,
    quiet_hours_end: null,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const prefs = await notificationApiService.getPreferences();
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
      await notificationApiService.updatePreferences(preferences);
      Alert.alert('Succès', 'Préférences enregistrées avec succès');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      Alert.alert('Erreur', "Impossible d'enregistrer les préférences");
    } finally {
      setSaving(false);
    }
  };

  const toggleType = (type: keyof typeof preferences.types_enabled) => {
    setPreferences((prev) => ({
      ...prev,
      types_enabled: {
        ...prev.types_enabled,
        [type]: !prev.types_enabled[type],
      },
    }));
  };

  const parseTime = (timeString: string | null): Date => {
    if (!timeString) return new Date();
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    scrollContent: {
      padding: SPACING.SCREEN_PADDING,
    },
    section: {
      marginBottom: SPACING.LG,
    },
    sectionTitle: {
      fontSize: TYPOGRAPHY.h3.fontSize,
      fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.text,
      marginBottom: SPACING.MD,
    },
    sectionDescription: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      marginBottom: SPACING.MD,
    },
    option: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: SPACING.MD,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    optionLast: {
      borderBottomWidth: 0,
    },
    optionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      gap: SPACING.MD,
    },
    optionIcon: {
      width: 40,
      height: 40,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primaryPale,
      justifyContent: 'center',
      alignItems: 'center',
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.XS,
    },
    optionDescription: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
    },
    timeInputs: {
      flexDirection: 'row',
      gap: SPACING.MD,
    },
    timeInput: {
      flex: 1,
    },
    timeLabel: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: '500',
      color: colors.text,
      marginBottom: SPACING.SM,
    },
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: SPACING.MD,
      backgroundColor: colors.secondaryBackground,
      borderRadius: BORDER_RADIUS.CARD,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeButtonText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
    },
    saveButton: {
      backgroundColor: colors.primary,
      padding: SPACING.MD,
      borderRadius: BORDER_RADIUS.CARD,
      alignItems: 'center',
      marginTop: SPACING.LG,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
        <ScreenHeader title="Paramètres" showBack />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["left", "right", "bottom"]} style={styles.container}>
      <ScreenHeader title="Paramètres des notifications" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Canaux */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Canaux de notification</Text>
          <ModernCard>
            <View style={styles.option}>
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Notifications par email</Text>
                  <Text style={styles.optionDescription}>Recevoir des notifications par email</Text>
                </View>
              </View>
              <Switch
                value={preferences.email_enabled}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, email_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.option}>
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <MaterialCommunityIcons name="cellphone" size={20} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Notifications push</Text>
                  <Text style={styles.optionDescription}>
                    Recevoir des notifications push sur vos appareils
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.push_enabled}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, push_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={styles.option}>
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <MaterialCommunityIcons name="volume-high" size={20} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Sons de notification</Text>
                  <Text style={styles.optionDescription}>
                    Jouer un son lors de la réception d'une notification
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.sound_enabled}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, sound_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>

            <View style={[styles.option, styles.optionLast]}>
              <View style={styles.optionLeft}>
                <View style={styles.optionIcon}>
                  <MaterialCommunityIcons name="vibrate" size={20} color={colors.primary} />
                </View>
                <View style={styles.optionText}>
                  <Text style={styles.optionTitle}>Vibrations</Text>
                  <Text style={styles.optionDescription}>
                    Vibrer lors de la réception d'une notification
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.vibration_enabled}
                onValueChange={(value) =>
                  setPreferences({ ...preferences, vibration_enabled: value })
                }
                trackColor={{ false: colors.border, true: colors.primary }}
              />
            </View>
          </ModernCard>
        </View>

        {/* Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types de notifications</Text>
          <ModernCard>
            {Object.entries(preferences.types_enabled).map(([type, enabled], index, array) => (
              <View
                key={type}
                style={[styles.option, index === array.length - 1 && styles.optionLast]}
              >
                <View style={styles.optionLeft}>
                  <Text style={styles.optionTitle}>
                    {type === 'message' && '💬 Messages'}
                    {type === 'collaboration' && '🤝 Collaborations'}
                    {type === 'follow' && '👤 Nouveaux abonnés'}
                    {type === 'like' && "❤️ J'aime"}
                    {type === 'comment' && '💭 Commentaires'}
                  </Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={() => toggleType(type as any)}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>
            ))}
          </ModernCard>
        </View>

        {/* Heures silencieuses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Heures silencieuses</Text>
          <Text style={styles.sectionDescription}>
            Ne pas recevoir de notifications pendant ces heures
          </Text>
          <ModernCard>
            <View style={styles.timeInputs}>
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Début</Text>
                <Pressable
                  style={styles.timeButton}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <Text style={styles.timeButtonText}>
                    {preferences.quiet_hours_start || '22:00'}
                  </Text>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={colors.text} />
                </Pressable>
              </View>

              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Fin</Text>
                <Pressable style={styles.timeButton} onPress={() => setShowEndTimePicker(true)}>
                  <Text style={styles.timeButtonText}>
                    {preferences.quiet_hours_end || '08:00'}
                  </Text>
                  <MaterialCommunityIcons name="clock-outline" size={20} color={colors.text} />
                </Pressable>
              </View>
            </View>
          </ModernCard>
        </View>

        {/* Bouton Enregistrer */}
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Time Pickers */}
      {showStartTimePicker && (
        <DateTimePicker
          value={parseTime(preferences.quiet_hours_start)}
          mode="time"
          is24Hour
          onChange={(event, selectedDate) => {
            setShowStartTimePicker(false);
            if (selectedDate) {
              setPreferences({
                ...preferences,
                quiet_hours_start: formatTime(selectedDate),
              });
            }
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={parseTime(preferences.quiet_hours_end)}
          mode="time"
          is24Hour
          onChange={(event, selectedDate) => {
            setShowEndTimePicker(false);
            if (selectedDate) {
              setPreferences({
                ...preferences,
                quiet_hours_end: formatTime(selectedDate),
              });
            }
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationSettingsScreen;
