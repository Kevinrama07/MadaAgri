import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import socketService from '../services/socketService';

interface Message {
  id: string;
  conversationId: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  timestamp: Date;
}

interface RealtimeMessagesScreenProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  initialMessages?: Message[];
  onMessageReceived?: (message: Message) => void;
}

export const RealtimeMessagesScreen = ({
  conversationId,
  currentUserId,
  currentUserName,
  initialMessages = [],
  onMessageReceived,
}: RealtimeMessagesScreenProps) => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Rejoindre la conversation
  useEffect(() => {
    if (conversationId) {
      socketService.connect('http://localhost:4000');
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  // Écouter les messages reçus
  useEffect(() => {
    const unsubscribe = socketService.onMessage((message: any) => {
      if (message.conversationId === conversationId) {
        const newMsg: Message = {
          id: `msg-${Date.now()}`,
          conversationId: message.conversationId,
          content: message.content,
          senderId: message.senderId,
          senderName: message.senderName,
          senderAvatar: message.senderAvatar,
          timestamp: new Date(message.timestamp),
        };

        setMessages((prev) => [...prev, newMsg]);

        if (onMessageReceived) {
          onMessageReceived(newMsg);
        }

        // Auto-scroll
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    });

    return unsubscribe;
  }, [conversationId, onMessageReceived]);

  // Écouter les indicateurs de saisie
  useEffect(() => {
    const unsubscribe = socketService.onActivity((activity: any) => {
      if (activity.conversationId === conversationId) {
        if (activity.status === 'typing') {
          setTypingUsers((prev) => {
            if (!prev.includes(activity.userId)) {
              return [...prev, activity.userId];
            }
            return prev;
          });
        } else if (activity.status === 'stopped_typing') {
          setTypingUsers((prev) => prev.filter((id) => id !== activity.userId));
        }
      }
    });

    return unsubscribe;
  }, [conversationId]);

  // Gérer le changement du contenu du message
  const handleMessageChange = (value: string) => {
    setNewMessage(value);

    // Notifier que l'utilisateur tape
    if (value.length > 0 && typingTimeoutRef.current === undefined) {
      socketService.sendTypingNotification(conversationId);
    }

    // Arrêter la notification après 3 secondes d'inactivité
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      typingTimeoutRef.current = undefined;
    }, 3000);
  };

  // Envoyer un message
  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);

    try {
      const message: Message = {
        id: `msg-${Date.now()}`,
        conversationId,
        content: newMessage,
        senderId: currentUserId,
        senderName: currentUserName,
        timestamp: new Date(),
      };

      // Ajouter localement
      setMessages((prev) => [...prev, message]);

      // Envoyer via socket
      socketService.sendMessage(conversationId, newMessage);

      setNewMessage('');

      // Auto-scroll
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      // Supprimer en cas d'erreur
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    messagesList: {
      flex: 1,
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingVertical: SPACING.PADDING_DEFAULT,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: SPACING.SCREEN_PADDING,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      marginBottom: SPACING.PADDING_SMALL,
    },
    emptyHint: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
    },
    messageBubble: {
      marginVertical: SPACING.PADDING_SMALL,
      maxWidth: '80%',
    },
    ownMessage: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primary,
      borderRadius: BORDER_RADIUS.CARD,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
    },
    otherMessage: {
      alignSelf: 'flex-start',
      backgroundColor: colors.secondaryBackground,
      borderRadius: BORDER_RADIUS.CARD,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
    },
    messageContent: {
      fontSize: TYPOGRAPHY.body.fontSize,
      lineHeight: 20,
    },
    ownMessageText: {
      color: '#fff',
    },
    otherMessageText: {
      color: colors.text,
    },
    messageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    senderName: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      fontWeight: '600',
      color: colors.primary,
    },
    messageTime: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textTertiary,
    },
    typingIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
      backgroundColor: colors.secondaryBackground,
      borderRadius: BORDER_RADIUS.CARD,
      maxWidth: '80%',
      alignSelf: 'flex-start',
    },
    typingDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.textSecondary,
      marginRight: 4,
    },
    typingText: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
      marginLeft: SPACING.PADDING_SMALL,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: SPACING.SCREEN_PADDING,
      paddingVertical: SPACING.PADDING_DEFAULT,
      backgroundColor: colors.secondaryBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: SPACING.PADDING_SMALL,
    },
    input: {
      flex: 1,
      borderRadius: BORDER_RADIUS.CARD,
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: 100,
    },
    sendButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.CARD,
      backgroundColor: colors.primary,
    },
  });

  const renderMessage = (item: Message) => {
    const isOwn = item.senderId === currentUserId;

    return (
      <View key={item.id} style={styles.messageBubble}>
        <View style={isOwn ? styles.ownMessage : styles.otherMessage}>
          {!isOwn && (
            <View style={styles.messageHeader}>
              <Text style={styles.senderName}>{item.senderName}</Text>
            </View>
          )}
          <Text style={[styles.messageContent, isOwn ? styles.ownMessageText : styles.otherMessageText]}>
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwn && { color: 'rgba(255,255,255,0.7)' },
            ]}
          >
            {formatTime(item.timestamp)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={90}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucun message</Text>
            <Text style={styles.emptyHint}>Commencez la conversation !</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderMessage(item)}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {typingUsers.length > 0 && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <Text style={styles.typingText}>
              {typingUsers.length} personne{typingUsers.length > 1 ? 's' : ''} en train de taper
            </Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Tapez votre message..."
            placeholderTextColor={colors.textTertiary}
            value={newMessage}
            onChangeText={handleMessageChange}
            editable={!isSending}
            multiline
          />
          <Pressable
            style={[styles.sendButton, !newMessage.trim() && { opacity: 0.5 }]}
            onPress={handleSendMessage}
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size={20} />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="#fff" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

function formatTime(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'À l\'instant';
  if (minutes < 60) return `${minutes}m`;

  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default RealtimeMessagesScreen;
