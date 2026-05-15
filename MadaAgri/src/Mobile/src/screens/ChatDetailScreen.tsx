import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Pressable,
  Text,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { ModernCard } from '../components/ModernCard';
import { ModernAvatar } from '../components/ModernAvatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import { getMessages, sendMessage } from '../lib/api';
import socketService from '../services/socketService';
import messageQueue from '../utils/messageQueue';
import { fr } from '../locales/fr';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

interface Participant {
  id: string;
  name: string;
  avatar?: { uri: string };
  online?: boolean;
}

interface ChatDetailScreenProps {
  route?: { params?: { conversationId?: string; participant?: Participant; userId?: string } };
  navigation?: any;
  conversationId?: string;
  participant?: Participant;
  onBackPress?: () => void;
}

export const ChatDetailScreen = ({
  route,
  navigation,
  conversationId: propConversationId,
  participant: propParticipant,
  onBackPress,
}: ChatDetailScreenProps) => {
  // Support both React Navigation and direct props
  const routeParams = route?.params;
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const [conversationId, setConversationId] = useState(propConversationId || routeParams?.conversationId || '');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState<any[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const participant = propParticipant || routeParams?.participant || (routeParams?.userId ? { id: routeParams.userId, name: 'Utilisateur' } : null);
  const handleBackPress = onBackPress || (() => navigation?.goBack());

  // Generate conversationId if only userId is provided
  useEffect(() => {
    console.log('[ChatDetail] 🔍 Params reçus:', {
      propConversationId,
      routeConversationId: routeParams?.conversationId,
      participantId: participant?.id,
      userId: user?.id,
    });
    
    if (!conversationId && participant?.id && user?.id) {
      // Create a conversation ID from both user IDs (match backend format: id1_id2)
      const ids = [user.id, participant.id].sort();
      const newConvId = `${ids[0]}_${ids[1]}`;
      console.log('[ChatDetail] ✅ ConversationId généré:', newConvId);
      setConversationId(newConvId);
    }
  }, [participant?.id, user?.id, conversationId]);

  // Écouter les changements de connexion
  useEffect(() => {
    // Vérifier l'état initial
    setIsConnected(socketService.isConnected());

    const unsubConnect = socketService.onConnect(async () => {
      setIsConnected(true);
      // Traiter la queue à la reconnexion
      await processMessageQueue();
    });
    const unsubDisconnect = socketService.onDisconnect(() => setIsConnected(false));

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, []);

  // Rejoindre la conversation et écouter les nouveaux messages temps réel
  useEffect(() => {
    if (!conversationId) {
      console.log('[ChatDetail] ⚠️ Pas de conversationId, skip join');
      return;
    }

    console.log('[ChatDetail] 🔌 Vérification connexion Socket.io...');
    if (!socketService.isConnected()) {
      console.warn('[ChatDetail] ⚠️ Socket non connecté, tentative de connexion...');
      // Attendre un peu que le socket se connecte
      const timer = setTimeout(() => {
        if (socketService.isConnected()) {
          socketService.joinConversation(conversationId);
          console.log('[ChatDetail] 🚪 Rejoint la conversation (delayed):', conversationId);
        } else {
          console.error('[ChatDetail] ❌ Socket toujours non connecté après délai');
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }

    // Rejoindre la conversation via Socket.io
    socketService.joinConversation(conversationId);
    console.log('[ChatDetail] 🚪 Rejoint la conversation:', conversationId);

    const unsubMessage = socketService.onMessage((message: any) => {
      console.log('[ChatDetail] 📨 Message reçu via socket:', message);
      // Vérifier si le message appartient à cette conversation
      if (message.conversationId === conversationId || message.conversation_id === conversationId) {
        console.log('[ChatDetail] ✅ Message appartient à cette conversation');
        setMessages((prev) => {
          // Éviter les doublons
          if (prev.some(m => m.id === message.id)) {
            console.log('[ChatDetail] ⚠️ Message déjà présent, skip');
            return prev;
          }
          console.log('[ChatDetail] ➕ Ajout du message à la liste');
          return [...prev, {
            id: message.id,
            sender_id: message.sender_id,
            content: message.content,
            created_at: message.created_at || new Date().toISOString(),
            read: message.read || false,
          }];
        });
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      } else {
        console.log('[ChatDetail] ⚠️ Message pour une autre conversation:', message.conversationId || message.conversation_id);
      }
    });

    const unsubTyping = socketService.on('user:typing', (data: any) => {
      console.log('[ChatDetail] Typing reçu:', data);
      if (data.sender_id === participant?.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    const unsubEdited = socketService.on('message:edited', (message: any) => {
      console.log('[ChatDetail] Message édité:', message);
      if (message.conversation_id === conversationId) {
        setMessages((prev) => prev.map(m => 
          m.id === message.id ? message : m
        ));
      }
    });

    const unsubDeleted = socketService.on('message:deleted', (data: any) => {
      console.log('[ChatDetail] Message supprimé:', data);
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.filter(m => m.id !== data.messageId));
      }
    });

    const unsubRead = socketService.on('message:read', (data: any) => {
      console.log('[ChatDetail] Message lu:', data);
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(m => 
          m.id === data.messageId ? { ...m, read: true, is_read: true } : m
        ));
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubEdited();
      unsubDeleted();
      unsubRead();
      socketService.leaveConversation(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      console.log('[ChatDetail] 🚪 Quitté la conversation:', conversationId);
    };
  }, [conversationId]);

  // Charger les messages
  useEffect(() => {
    if (conversationId && conversationId !== '') {
      loadMessages();
    } else {
      // Si pas de conversationId, pas de messages historiques, juste attendre les nouveaux messages temps réel
      setLoading(false);
      setMessages([]);
    }
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      console.log('[ChatDetail] 📥 Chargement messages pour:', conversationId);
      // Charger toujours les messages depuis la BD (le conversationId est maintenant au format correct)
      if (conversationId && conversationId.includes('_')) {
        const data = await getMessages(conversationId, 0, 50);
        const messages = data?.messages || [];
        console.log('[ChatDetail] ✅ Messages chargés:', messages.length);
        setMessages(messages);
        setHasMoreMessages(data?.hasMore || false);
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: false }), 100);
        
        // Marquer la conversation comme lue
        try {
          const { markConversationAsRead } = await import('../lib/api');
          await markConversationAsRead(conversationId);
          console.log('[ChatDetail] ✅ Conversation marquée comme lue');
        } catch (err) {
          console.error('[ChatDetail] ⚠️ Erreur marquage comme lu:', err);
        }
      } else {
        setMessages([]);
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('[ChatDetail] ❌ Erreur chargement messages:', error);
      setMessages([]);
      setHasMoreMessages(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (loadingMoreMessages || !hasMoreMessages || !conversationId) return;

    try {
      setLoadingMoreMessages(true);
      console.log('[ChatDetail] 📥 Chargement plus de messages, offset:', messages.length);
      const data = await getMessages(conversationId, messages.length, 50);
      const newMessages = data?.messages || [];
      console.log('[ChatDetail] ✅ Nouveaux messages chargés:', newMessages.length);
      // Ajouter les nouveaux messages au début (car ce sont des messages plus anciens)
      setMessages((prev) => [...newMessages, ...prev]);
      setHasMoreMessages(data?.hasMore || false);
    } catch (error) {
      console.error('[ChatDetail] ❌ Erreur chargement plus de messages:', error);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const content = newMessage.trim();
      setNewMessage(''); // Vider le champ immédiatement
      
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const recipientId = participant?.id;
      
      // Créer le message temporaire
      const tempMessage = {
        id: tempId,
        sender_id: user?.id || '',
        recipient_id: recipientId,
        conversationId,
        content,
        created_at: new Date().toISOString(),
        read: false,
        status: 'sending',
      };
      
      // Ajouter immédiatement à l'affichage
      setMessages((prev) => [...prev, tempMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      
      if (!isConnected) {
        // Pas de connexion - ajouter à la queue
        console.log('[ChatDetail] Hors ligne - ajout à la queue');
        await messageQueue.add(tempMessage);
        // Mettre à jour le statut
        setMessages((prev) => prev.map(m => 
          m.id === tempId ? { ...m, status: 'queued' } : m
        ));
        return;
      }
      
      // Envoyer via Socket.io en temps réel
      if (recipientId && user?.id) {
        try {
          await socketService.sendMessage(recipientId, content);
          console.log('[ChatDetail] Message envoyé via Socket.io');
          // Retirer le message temporaire (il arrivera via socket)
          setMessages((prev) => prev.filter(m => m.id !== tempId));
        } catch (error) {
          console.error('[ChatDetail] Erreur envoi Socket.io:', error);
          // Ajouter à la queue en cas d'échec
          await messageQueue.add(tempMessage);
          setMessages((prev) => prev.map(m => 
            m.id === tempId ? { ...m, status: 'failed' } : m
          ));
        }
      }
    } catch (error) {
      console.error('[ChatDetail] Erreur envoi message:', error);
    } finally {
      setSending(false);
    }
  };

  const processMessageQueue = async () => {
    if (!isConnected || !user?.id) return;

    console.log('[ChatDetail] Traitement de la queue...');
    const results = await messageQueue.processQueue(async (queuedMessage: any) => {
      // Envoyer via Socket.io
      await socketService.sendMessage(
        queuedMessage.recipient_id,
        queuedMessage.content
      );
    });

    console.log('[ChatDetail] Queue traitée:', results);
  };

  const handleAttachment = async () => {
    try {
      // Demander la permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
        );
        return;
      }

      // Ouvrir le sélecteur d'images
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Vérifier la taille (max 5MB)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Erreur', 'L\'image est trop volumineuse. Taille max: 5MB');
          return;
        }

        setSelectedImage(asset.uri);
      }
    } catch (error) {
      console.error('[ChatDetail] Erreur sélection image:', error);
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || !participant?.id) return;

    try {
      setUploadingImage(true);
      
      // Upload de l'image
      const { dataApi } = await import('../lib/api');
      
      // Créer un FormData pour l'upload
      const formData = new FormData();
      const filename = selectedImage.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      formData.append('image', {
        uri: selectedImage,
        name: filename,
        type,
      } as any);

      // Upload via API
      const imageUrl = await dataApi.uploadImage(selectedImage);
      console.log('[ChatDetail] Image uploadée:', imageUrl);

      // Envoyer le message avec l'image
      await sendMessage({
        recipient_id: participant.id,
        content: '',
        attachment_url: imageUrl,
        attachment_type: 'image',
      });

      // Ajouter localement
      setMessages((prev) => [...prev, {
        id: `msg-${Date.now()}`,
        sender_id: user?.id || '',
        content: '',
        attachment_url: imageUrl,
        attachment_type: 'image',
        created_at: new Date().toISOString(),
        read: false,
      }]);

      // Réinitialiser
      setSelectedImage(null);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('[ChatDetail] Erreur envoi image:', error);
      Alert.alert('Erreur', 'Impossible d\'envoyer l\'image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelImage = () => {
    setSelectedImage(null);
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    try {
      const { editMessage } = await import('../lib/api');
      await editMessage(messageId, newContent);
      // Mettre à jour localement
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m
      ));
      setEditingMessageId(null);
      console.log('[ChatDetail] Message édité:', messageId);
    } catch (error) {
      console.error('[ChatDetail] Erreur édition:', error);
      throw error;
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { deleteMessage } = await import('../lib/api');
      await deleteMessage(messageId);
      // Retirer localement
      setMessages((prev) => prev.filter(m => m.id !== messageId));
      console.log('[ChatDetail] Message supprimé:', messageId);
    } catch (error) {
      console.error('[ChatDetail] Erreur suppression:', error);
      throw error;
    }
  };

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        flex: 1,
        backgroundColor: colors.primaryBackground,
      },
      header: {
        backgroundColor: colors.card,
        marginTop:50,
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      },
      headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: SPACING.SM,
      },
      headerInfo: {
        flex: 1,
      },
      headerName: {
        fontSize: TYPOGRAPHY.body.fontSize,
        fontWeight: '600',
        color: colors.text,
      },
      headerStatus: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textSecondary,
        marginTop: 2,
      },
      headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.LG,
      },
      connectionStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_SMALL,
        backgroundColor: isConnected ? colors.success + '20' : colors.error + '20',
        gap: SPACING.PADDING_SMALL,
      },
      statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: isConnected ? colors.success : colors.error,
      },
      statusText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textSecondary,
      },
      messagesList: {
        flex: 1,
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      messageRow: {
        marginBottom: SPACING.MD,
        flexDirection: 'row',
      },
      messageRowOwn: {
        justifyContent: 'flex-end',
      },
      messageBubble: {
        maxWidth: '80%',
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.BUTTON,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
      },
      messageBubbleOwn: {
        backgroundColor: colors.primary,
      },
      messageText: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.text,
        fontWeight: TYPOGRAPHY.body.fontWeight,
      },
      messageTextOwn: {
        color: '#fff',
      },
      messageTime: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textTertiary,
        marginTop: SPACING.XS,
      },
      messageTimeOwn: {
        color: colors.primaryPale,
        textAlign: 'right',
      },
      inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: SPACING.SCREEN_PADDING,
        paddingVertical: SPACING.PADDING_DEFAULT,
        backgroundColor: colors.primaryBackground,
        marginBottom:20,
        gap: SPACING.SM,
        borderTopWidth: 1,
        borderTopColor: colors.border,
      },
      attachmentButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
      },
      inputField: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.BUTTON,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        maxHeight: 100,
      },
      sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
      },
      sendButtonDisabled: {
        backgroundColor: colors.primaryPale,
      },
      emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.XL * 3,
        paddingHorizontal: SPACING.SCREEN_PADDING,
      },
      emptyIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryPale,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.LG,
      },
      emptyTitle: {
        fontSize: TYPOGRAPHY.h3.fontSize,
        fontWeight: TYPOGRAPHY.h3.fontWeight,
        color: colors.text,
        marginBottom: SPACING.SM,
        textAlign: 'center',
      },
      emptySubtitle: {
        fontSize: TYPOGRAPHY.body.fontSize,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
      },
      typingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.BUTTON,
        maxWidth: 60,
        marginBottom: SPACING.MD,
      },
      typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textSecondary,
      },
      editContainer: {
        width: '100%',
      },
      editInput: {
        backgroundColor: isConnected ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderRadius: BORDER_RADIUS.BUTTON,
        padding: SPACING.PADDING_SMALL,
        color: colors.text,
        fontSize: TYPOGRAPHY.body.fontSize,
        minHeight: 60,
        marginBottom: SPACING.SM,
      },
      editActions: {
        flexDirection: 'row',
        gap: SPACING.SM,
        justifyContent: 'flex-end',
      },
      editButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: SPACING.PADDING_DEFAULT,
        paddingVertical: SPACING.PADDING_SMALL,
        borderRadius: BORDER_RADIUS.BUTTON,
      },
      saveButton: {
        backgroundColor: colors.primary,
      },
      cancelButton: {
        backgroundColor: colors.card,
      },
      editButtonText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: '600',
        color: '#fff',
      },
      editedLabel: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontStyle: 'italic',
        opacity: 0.7,
      },
      loadingMore: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: SPACING.SM,
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      loadingMoreText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textSecondary,
      },
      noMoreMessages: {
        alignItems: 'center',
        paddingVertical: SPACING.PADDING_DEFAULT,
      },
      noMoreMessagesText: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: colors.textTertiary,
        opacity: 0.6,
      },
      messageStatusIcon: {
        fontSize: TYPOGRAPHY.caption.fontSize,
        marginLeft: 4,
      },
      messageImage: {
        width: 200,
        height: 200,
        borderRadius: BORDER_RADIUS.BUTTON,
        marginBottom: SPACING.XS,
      },
      imagePreviewContainer: {
        width: '100%',
        height: 200,
        position: 'relative',
        marginBottom: SPACING.SM,
      },
      imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: BORDER_RADIUS.BUTTON,
      },
      removeImageButton: {
        position: 'absolute',
        top: SPACING.SM,
        right: SPACING.SM,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 20,
      },
      sendImageButton: {
        position: 'absolute',
        bottom: SPACING.SM,
        right: SPACING.SM,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
      },
    });
  }, [colors, isConnected]);

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.sender_id === user?.id;
    const isEditing = editingMessageId === item.id;
    const hasAttachment = item.attachment_url && item.attachment_type === 'image';

    return (
      <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
        <Pressable
          onLongPress={() => {
            if (isOwn && !hasAttachment) {
              Alert.alert(
                'Options',
                'Que voulez-vous faire ?',
                [
                  item.content ? {
                    text: 'Modifier',
                    onPress: () => {
                      setEditingMessageId(item.id);
                      setEditedContent(item.content);
                    }
                  } : null,
                  {
                    text: 'Supprimer',
                    onPress: () => {
                      Alert.alert(
                        'Confirmer',
                        'Supprimer ce message ?',
                        [
                          { text: 'Annuler', style: 'cancel' },
                          { 
                            text: 'Supprimer', 
                            style: 'destructive',
                            onPress: () => handleDeleteMessage(item.id)
                          }
                        ]
                      );
                    },
                    style: 'destructive'
                  },
                  { text: 'Annuler', style: 'cancel' }
                ].filter(Boolean)
              );
            }
          }}
          style={[styles.messageBubble, isOwn && styles.messageBubbleOwn]}
        >
          {hasAttachment && (
            <Pressable onPress={() => {
              // Ouvrir l'image en plein écran (TODO: implémenter modal)
              console.log('Ouvrir image:', item.attachment_url);
            }}>
              <Image
                source={{ uri: item.attachment_url }}
                style={styles.messageImage}
                resizeMode="cover"
              />
            </Pressable>
          )}
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editedContent}
                onChangeText={setEditedContent}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <Pressable
                  style={[styles.editButton, styles.saveButton]}
                  onPress={async () => {
                    if (editedContent.trim()) {
                      await handleEditMessage(item.id, editedContent.trim());
                    }
                  }}
                >
                  <MaterialCommunityIcons name="check" size={16} color="#fff" />
                  <Text style={styles.editButtonText}>Enregistrer</Text>
                </Pressable>
                <Pressable
                  style={[styles.editButton, styles.cancelButton]}
                  onPress={() => {
                    setEditingMessageId(null);
                    setEditedContent('');
                  }}
                >
                  <MaterialCommunityIcons name="close" size={16} color={colors.text} />
                  <Text style={[styles.editButtonText, { color: colors.text }]}>Annuler</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <>
              {item.content && (
                <Text style={[styles.messageText, isOwn && styles.messageTextOwn]}>
                  {item.content}
                  {item.edited_at && (
                    <Text style={styles.editedLabel}> (édité)</Text>
                  )}
                </Text>
              )}
              <Text style={[styles.messageTime, isOwn && styles.messageTimeOwn]}>
                {formatTime(item.created_at)}
                {isOwn && (
                  <Text style={styles.messageStatusIcon}>
                    {item.status === 'queued' ? ' ⏳' : 
                     item.status === 'failed' ? ' ⚠️' : 
                     item.status === 'sending' ? ' ⏳' : 
                     item.read || item.is_read ? ' ✓✓' : ' ✓'}
                  </Text>
                )}
              </Text>
            </>
          )}
        </Pressable>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    return (
      <View style={styles.typingIndicator}>
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
        <View style={styles.typingDot} />
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons name="message-text-outline" size={40} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{fr.messages.noMessages}</Text>
      <Text style={styles.emptySubtitle}>
        {fr.messages.noMessagesDesc}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* WhatsApp-style Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable onPress={handleBackPress}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
          </Pressable>
          <ModernAvatar
            source={participant?.avatar}
            initials={participant?.name?.charAt(0).toUpperCase() || 'U'}
            size="medium"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{participant?.name || 'Conversation'}</Text>
            <Text style={styles.headerStatus}>
              {isConnected ? fr.common.connected : fr.common.disconnected}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <Pressable>
            <MaterialCommunityIcons name="phone" size={22} color={colors.primary} />
          </Pressable>
          <Pressable>
            <MaterialCommunityIcons name="dots-vertical" size={22} color={colors.text} />
          </Pressable>
        </View>
      </View>

      {/* Messages List */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        style={styles.container}
        keyboardVerticalOffset={0}
        enabled={true}
      >
        {messages.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            inverted={false}
            ListHeaderComponent={() => (
              loadingMoreMessages ? (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.loadingMoreText}>Chargement...</Text>
                </View>
              ) : !hasMoreMessages && messages.length > 0 ? (
                <View style={styles.noMoreMessages}>
                  <Text style={styles.noMoreMessagesText}>— Début de la conversation — </Text>
                </View>
              ) : null
            )}
            ListFooterComponent={renderTypingIndicator}
          />
        ) : (
          renderEmptyState()
        )}

        {/* Input Area - WhatsApp Style */}
        <View style={styles.inputContainer}>
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <Pressable
                style={styles.removeImageButton}
                onPress={handleCancelImage}
              >
                <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
              </Pressable>
              <Pressable
                style={styles.sendImageButton}
                onPress={handleSendImage}
                disabled={uploadingImage}
              >
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="send" size={24} color="#fff" />
                )}
              </Pressable>
            </View>
          )}
          {!selectedImage && (
            <>
              <Pressable 
                style={styles.attachmentButton}
                onPress={handleAttachment}
                disabled={uploadingImage}
              >
                <MaterialCommunityIcons name="image" size={24} color={colors.primary} />
              </Pressable>
              <TextInput
                style={styles.inputField}
                placeholder={fr.messages.typeMessage}
                placeholderTextColor={colors.textTertiary}
                value={newMessage}
                onChangeText={(text) => {
                  setNewMessage(text);
                  if (text.trim() && participant?.id) {
                    socketService.sendTypingNotification(participant.id);
                  }
                }}
                multiline
                editable={!sending && !uploadingImage}
              />
              <Pressable
                style={[styles.sendButton, (sending || !newMessage.trim()) && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={sending || !newMessage.trim()}
              >
                {sending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <MaterialCommunityIcons
                    name="send"
                    size={20}
                    color={newMessage.trim() ? '#fff' : colors.textTertiary}
                  />
                )}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;
