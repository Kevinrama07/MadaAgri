import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernCard } from './ModernCard';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import socketService from '../services/socketService';
import { useRealtimeNotifications } from '../contexts/RealtimeNotificationsContext';

interface CollaborationInviteScreenProps {
  projectId: string;
  projectName: string;
  recipientId: string;
  recipientName: string;
  onInviteSent?: (data: { recipientId: string; projectId: string }) => void;
}

export const CollaborationInviteScreen = ({
  projectId,
  projectName,
  recipientId,
  recipientName,
  onInviteSent,
}: CollaborationInviteScreenProps) => {
  const { colors } = useTheme();
  const { showNotification } = useRealtimeNotifications();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [inviteSent, setInviteSent] = useState(false);

  const handleSendInvite = async () => {
    if (!recipientId || !projectId) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Données manquantes',
      });
      return;
    }

    setIsSending(true);

    try {
      socketService.sendCollaborationInvite(
        recipientId,
        projectId,
        message || `Voulez-vous collaborer sur "${projectName}" ?`
      );

      setInviteSent(true);
      setMessage('');

      showNotification({
        type: 'success',
        title: 'Invitation envoyée',
        message: `Invitation envoyée à ${recipientName}`,
        duration: 3000,
      });

      if (onInviteSent) {
        onInviteSent({ recipientId, projectId });
      }

      setTimeout(() => {
        setInviteSent(false);
      }, 3000);
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors de l\'envoi de l\'invitation',
      });
    } finally {
      setIsSending(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingVertical: SPACING.PADDING_DEFAULT,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.PADDING_DEFAULT,
      gap: SPACING.PADDING_DEFAULT,
    },
    icon: {
      width: 50,
      height: 50,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerText: {
      flex: 1,
    },
    title: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
    },
    subtitle: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
      marginTop: 4,
    },
    formGroup: {
      marginBottom: SPACING.PADDING_DEFAULT,
    },
    label: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      fontWeight: '600',
      color: colors.text,
      marginBottom: SPACING.PADDING_SMALL,
      textTransform: 'uppercase',
      opacity: 0.8,
    },
    input: {
      borderRadius: BORDER_RADIUS.CARD,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.secondaryBackground,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_DEFAULT,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      minHeight: 100,
      textAlignVertical: 'top',
    },
    hint: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
      marginTop: SPACING.PADDING_SMALL,
      fontStyle: 'italic',
    },
    submitButton: {
      borderRadius: BORDER_RADIUS.CARD,
      backgroundColor: colors.primary,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_DEFAULT,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: SPACING.PADDING_SMALL,
      opacity: isSending || inviteSent ? 0.6 : 1,
    },
    submitText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: '#fff',
    },
    info: {
      marginTop: SPACING.PADDING_DEFAULT,
      borderRadius: BORDER_RADIUS.CARD,
      backgroundColor: colors.primary + '10',
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_DEFAULT,
    },
    infoText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.text,
      lineHeight: 18,
    },
    infoBold: {
      fontWeight: '600',
      color: colors.primary,
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.icon}>
          <MaterialCommunityIcons name="handshake" size={28} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Inviter à collaborer</Text>
          <Text style={styles.subtitle}>sur {projectName}</Text>
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.label}>Message personnalisé</Text>
        <TextInput
          style={styles.input}
          placeholder={`Inviter ${recipientName} à collaborer...`}
          placeholderTextColor={colors.textTertiary}
          value={message}
          onChangeText={setMessage}
          editable={!isSending}
          multiline
        />
        <Text style={styles.hint}>
          Message par défaut: "Voulez-vous collaborer sur {projectName} ?"
        </Text>
      </View>

      <Pressable
        style={styles.submitButton}
        onPress={handleSendInvite}
        disabled={isSending || inviteSent}
      >
        {isSending ? (
          <ActivityIndicator color="#fff" size={18} />
        ) : (
          <MaterialCommunityIcons
            name={inviteSent ? 'check-circle' : 'handshake'}
            size={20}
            color="#fff"
          />
        )}
        <Text style={styles.submitText}>
          {isSending ? 'Envoi en cours...' : inviteSent ? 'Invitation envoyée' : `Inviter ${recipientName}`}
        </Text>
      </Pressable>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          <Text style={styles.infoBold}>{recipientName}</Text> recevra l'invitation en temps réel
          et pourra accepter ou refuser immédiatement.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
};

export default CollaborationInviteScreen;
