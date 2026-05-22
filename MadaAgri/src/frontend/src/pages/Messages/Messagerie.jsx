import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { FiMenu, FiMessageCircle } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import socketService from '../../services/socketService';
import messageQueue from '../../utils/messageQueue';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import styles from './MessagerieStyles.module.css';

export default function Messagerie({ targetUserId }) {
  const { user: currentUser } = useAuth();
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);

  // State
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [queuedMessages, setQueuedMessages] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Détecter le mode mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialiser Socket.io
  useEffect(() => {
    if (!currentUser) return;

    const initSocket = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
        const socketUrl = apiBaseUrl.replace('/api', '');
        console.log('[Messagerie] Connexion Socket.io à:', socketUrl);
        await socketService.connect(socketUrl, currentUser.id);
        setIsConnected(true);
        console.log('[Messagerie] Socket.io connecté');
        
        // Traiter la queue de messages en attente
        await processMessageQueue();
      } catch (error) {
        console.error('[Messagerie] Erreur connexion Socket.io:', error);
        setIsConnected(false);
      }
    };

    initSocket();

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
  }, [currentUser]);

  // Charger les conversations existantes (uniquement celles avec messages)
  useEffect(() => {
    async function fetchConversations() {
      if (!currentUser) return;
      
      try {
        startLoading();
        console.log('[Messagerie] Chargement conversations...');
        const convData = await dataApi.fetchConversations();
        console.log('[Messagerie] Conversations reçues:', convData?.length);
        // Ne filtrer que les conversations nulles (erreurs API)
        const conversationsWithMessages = (convData || []).filter(conv => conv !== null);
        console.log('[Messagerie] Conversations avec messages:', conversationsWithMessages.length);
        setConversations(conversationsWithMessages);

        // Si un targetUserId est fourni, ouvrir la conversation correspondante
        if (targetUserId) {
          const existingConv = conversationsWithMessages.find(
            (conv) => conv.other_user_id === targetUserId
          );
          if (existingConv) {
            setSelectedConversation(existingConv);
            setShowSidebar(false);
          } else {
            // Récupérer les infos de l'utilisateur
            try {
              const profileData = await dataApi.fetchUserProfile(targetUserId);
              const targetUser = profileData?.user || profileData;
              const conversationId = [currentUser.id, targetUserId].sort().join('_');
              const newConv = {
                id: conversationId,
                other_user_id: targetUserId,
                other_user_name: targetUser?.display_name || 'Utilisateur',
                other_user_image: targetUser?.profile_image_url || null,
                other_user_online: false,
                last_message: null,
                last_message_at: null,
              };
              setSelectedConversation(newConv);
              setShowSidebar(false);
              setMessages([]);
            } catch (err) {
              console.error('[Messagerie] Erreur chargement profil utilisateur:', err);
            }
          }
        }
      } catch (err) {
        console.error('[Messagerie] Erreur chargement conversations:', err);
        setConversations([]);
      } finally {
        stopLoading();
      }
    }
    
    fetchConversations();
  }, [currentUser, targetUserId]);

  // Rejoindre la conversation et écouter les messages
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const conversationId = selectedConversation.id;
    console.log('[Messagerie] Rejoindre conversation:', conversationId);

    socketService.joinConversation(conversationId);

    const unsubMessage = socketService.onMessage((message) => {
      console.log('[Messagerie] Message reçu:', message);
      if (message.conversationId === conversationId || message.conversation_id === conversationId) {
        setMessages((prev) => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    const unsubTyping = socketService.on('user:typing', (data) => {
      console.log('[Messagerie] Typing reçu:', data);
      if (data.sender_id === selectedConversation.other_user_id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    });

    const unsubStatus = socketService.on('user:status', (data) => {
      console.log('[Messagerie] Statut utilisateur:', data);
      if (data.userId === selectedConversation.other_user_id) {
        setSelectedConversation(prev => ({
          ...prev,
          other_user_online: data.status === 'online'
        }));
      }
    });

    const unsubDeleted = socketService.on('message:deleted', (data) => {
      console.log('[Messagerie] Message supprimé:', data);
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.filter(m => m.id !== data.messageId));
      }
    });

    const unsubEdited = socketService.on('message:edited', (message) => {
      console.log('[Messagerie] Message édité:', message);
      if (message.conversation_id === conversationId) {
        setMessages((prev) => prev.map(m => 
          m.id === message.id ? message : m
        ));
      }
    });

    const unsubRead = socketService.on('message:read', (data) => {
      console.log('[Messagerie] Message lu:', data);
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(m => 
          m.id === data.messageId ? { ...m, is_read: true, read: true } : m
        ));
      }
    });

    const unsubReactionAdded = socketService.on('message:reaction:added', (data) => {
      console.log('[Messagerie] Réaction ajoutée:', data);
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(m => 
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        ));
      }
    });

    const unsubReactionRemoved = socketService.on('message:reaction:removed', (data) => {
      console.log('[Messagerie] Réaction supprimée:', data);
      if (data.conversationId === conversationId) {
        setMessages((prev) => prev.map(m => 
          m.id === data.messageId ? { ...m, reactions: data.reactions } : m
        ));
      }
    });

    return () => {
      unsubMessage();
      unsubTyping();
      unsubStatus();
      unsubDeleted();
      unsubEdited();
      unsubRead();
      unsubReactionAdded();
      unsubReactionRemoved();
      socketService.leaveConversation(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedConversation, currentUser]);

  const fetchConversation = async (conversation) => {
    if (!conversation || !currentUser) return;

    const conversationId = conversation.id;
    console.log('[Messagerie] fetchConversation debut:', conversationId);
    startLoading();
    try {
      const data = await dataApi.fetchMessages(conversationId, 0, 50);
      console.log('[Messagerie] fetchConversation OK:', conversationId, 'messages:', data);
      setMessages(data.messages || []);
      setHasMoreMessages(data.hasMore || false);
    } catch (err) {
      console.error('[Messagerie] fetchConversation ERREUR:', err);
      setMessages([]);
      setHasMoreMessages(false);
    } finally {
      stopLoading();
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || loadingMoreMessages || !hasMoreMessages) return;

    console.log('[Messagerie] loadMoreMessages debut, offset:', messages.length);
    setLoadingMoreMessages(true);
    try {
      const data = await dataApi.fetchMessages(selectedConversation.id, messages.length, 50);
      console.log('[Messagerie] loadMoreMessages OK, nouveaux messages:', data.messages?.length);
      // Ajouter les nouveaux messages au début (car ce sont des messages plus anciens)
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMoreMessages(data.hasMore || false);
    } catch (err) {
      console.error('[Messagerie] loadMoreMessages ERREUR:', err);
    } finally {
      setLoadingMoreMessages(false);
    }
  };

  useEffect(() => {
    if (selectedConversation && currentUser) {
      fetchConversation(selectedConversation);
      // Marquer la conversation comme lue
      dataApi.markConversationAsRead(selectedConversation.id, currentUser.id).catch(err => {
        console.error('[Messagerie] Erreur marquage comme lu:', err);
      });
      
      // Charger les messages en queue pour cette conversation
      loadQueuedMessages();
    }
  }, [selectedConversation, currentUser]);

  // Écouter les changements de la queue
  useEffect(() => {
    const unsubscribe = messageQueue.addListener((queue) => {
      if (selectedConversation) {
        const conversationQueue = queue.filter(
          m => m.conversationId === selectedConversation.id
        );
        setQueuedMessages(conversationQueue);
      }
    });

    return unsubscribe;
  }, [selectedConversation]);

  const loadQueuedMessages = () => {
    if (selectedConversation) {
      const queue = messageQueue.getByConversation(selectedConversation.id);
      setQueuedMessages(queue);
    }
  };

  const processMessageQueue = async () => {
    if (!isConnected || !currentUser) return;

    console.log('[Messagerie] Traitement de la queue...');
    const results = await messageQueue.processQueue(async (queuedMessage) => {
      // Envoyer via Socket.io
      await socketService.sendMessage(
        queuedMessage.recipient_id,
        queuedMessage.content
      );
    });

    console.log('[Messagerie] Queue traitée:', results);
  };

  const handleSendMessage = async (messageText, attachedFile = null, voiceData = null) => {
    if (!selectedConversation || !currentUser || (!messageText.trim() && !attachedFile && !voiceData)) return;

    const isVoice = voiceData?.type === 'voice';

    console.log('[Messagerie] handleSendMessage debut:', { messageText, attachedFile, voiceData });
    setSendingMessage(true);
    
    const recipientId = selectedConversation.other_user_id;
    const conversationId = selectedConversation.id;
    const tempId = `temp-${Date.now()}-${Math.random()}`;
    
    // Créer le message temporaire
    const tempMessage = {
      id: tempId,
      sender_id: currentUser.id,
      recipient_id: recipientId,
      conversationId,
      content: isVoice ? '' : (messageText || ''),
      type: isVoice ? 'voice' : 'text',
      audio_url: voiceData?.audio_url || null,
      audio_duration: voiceData?.audio_duration || null,
      public_id: voiceData?.public_id || null,
      attachment_url: attachedFile?.url || null,
      attachment_type: attachedFile?.type || null,
      created_at: new Date().toISOString(),
      is_read: false,
      status: 'sending',
    };
    
    // Ajouter immédiatement à l'affichage
    setMessages((prev) => [...prev, tempMessage]);
    
    try {
      if (!isConnected) {
        // Pas de connexion - ajouter à la queue
        console.log('[Messagerie] Hors ligne - ajout à la queue');
        messageQueue.add(tempMessage);
        // Mettre à jour le statut
        setMessages((prev) => prev.map(m => 
          m.id === tempId ? { ...m, status: 'queued' } : m
        ));
        return;
      }
      
      if (isVoice) {
        // Envoyer message vocal via API REST (pour garantir la persistance BD)
        const sentMessage = await dataApi.sendMessage(
          recipientId,
          '',
          null,
          null,
          {
            type: 'voice',
            audio_url: voiceData.audio_url,
            audio_duration: voiceData.audio_duration,
            public_id: voiceData.public_id,
          }
        );
        setMessages((prev) => prev.map(m => 
          m.id === tempId ? { ...m, ...sentMessage, status: 'sent' } : m
        ));
      } else if (attachedFile) {
        // Envoyer avec pièce jointe via API
        const sentMessage = await dataApi.sendMessage(
          recipientId,
          messageText || '',
          attachedFile.url,
          attachedFile.type
        );
        // Remplacer le message temporaire par le message réel
        setMessages((prev) => prev.map(m => 
          m.id === tempId ? { ...sentMessage, status: 'sent' } : m
        ));
      } else {
        // Envoyer via Socket.io
        await socketService.sendMessage(recipientId, messageText);
        // Le message arrivera via socket.on('message:received')
        // Retirer le message temporaire
        setMessages((prev) => prev.filter(m => m.id !== tempId));
        console.log('[Messagerie] Message envoyé via Socket.io');
      }
    } catch (err) {
      console.error('[Messagerie] Erreur envoi:', err);
      // Ajouter à la queue en cas d'échec
      messageQueue.add(tempMessage);
      // Mettre à jour le statut
      setMessages((prev) => prev.map(m => 
        m.id === tempId ? { ...m, status: 'failed' } : m
      ));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBackToSidebar = () => {
    setSelectedConversation(null);
    setShowSidebar(true);
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setShowSidebar(false);
    await fetchConversation(conversation);
  };

  const handleTyping = useCallback(() => {
    if (selectedConversation) {
      socketService.sendTypingNotification(selectedConversation.other_user_id);
    }
  }, [selectedConversation]);

  const handleDeleteMessage = useCallback(async (messageId) => {
    try {
      await dataApi.deleteMessage(messageId);
      setMessages((prev) => prev.filter(m => m.id !== messageId));
      console.log('[Messagerie] Message supprimé:', messageId);
    } catch (error) {
      console.error('[Messagerie] Erreur suppression:', error);
      throw error;
    }
  }, []);

  const handleEditMessage = useCallback(async (messageId, newContent) => {
    try {
      const result = await dataApi.editMessage(messageId, newContent);
      // Mettre à jour localement
      setMessages((prev) => prev.map(m => 
        m.id === messageId ? { ...m, content: newContent, edited_at: new Date().toISOString() } : m
      ));
      console.log('[Messagerie] Message édité:', messageId);
    } catch (error) {
      console.error('[Messagerie] Erreur édition:', error);
      throw error;
    }
  }, []);

  const handleCopyMessage = useCallback((message) => {
    console.log('[Messagerie] Copie message:', message);
  }, []);

  const handleReaction = useCallback(async (messageId, emoji, remove = false) => {
    try {
      if (remove) {
        await dataApi.removeReaction(messageId, emoji);
      } else {
        await dataApi.addReaction(messageId, emoji);
      }
      console.log('[Messagerie] Réaction:', remove ? 'supprimée' : 'ajoutée', emoji);
    } catch (error) {
      console.error('[Messagerie] Erreur réaction:', error);
      throw error;
    }
  }, []);

  return (
    <div className={clsx(styles['chat-container'])}>
      {isMobile ? (
        selectedConversation ? (
          <div className={clsx(styles['mobile-chat-area'])} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <ChatHeader 
              contact={{
                id: selectedConversation.other_user_id,
                display_name: selectedConversation.other_user_name,
                profile_image_url: selectedConversation.other_user_image,
                online: selectedConversation.other_user_online
              }} 
              onBack={handleBackToSidebar} 
            />
            <MessageList
              messages={messages}
              loading={isLoading}
              currentUserId={currentUser?.id}
              isTyping={isTyping}
              typingUser={selectedConversation?.other_user_name}
              onDeleteMessage={handleDeleteMessage}
              onEditMessage={handleEditMessage}
              onCopyMessage={handleCopyMessage}
              onReaction={handleReaction}
              onLoadMore={loadMoreMessages}
              hasMore={hasMoreMessages}
              loadingMore={loadingMoreMessages}
            />
            <ChatInput onSendMessage={handleSendMessage} disabled={sendingMessage || !isConnected} onTyping={handleTyping} />
          </div>
        ) : (
          <div className={clsx(styles['chat-sidebar'], styles['mobile-visible'])} style={{ width: '100%', height: '100%' }}>
            <ChatSidebar
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              loading={isLoading && !hasShownSkeletons}
              isConnected={isConnected}
              className={clsx(styles['mobile-visible'])}
            />
          </div>
        )
      ) : (
        <>
          <ChatSidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            loading={isLoading && !hasShownSkeletons}
            isConnected={isConnected}
            className={clsx(styles['chat-sidebar'], { [styles['mobile-visible']]: showSidebar })}
          />

          <div
            className={clsx(styles['chat-area'], { [styles['empty-state']]: !selectedConversation })}
          >
            {!selectedConversation ? (
              <>
                <button
                  className={clsx(styles['chat-action-btn'])}
                  onClick={() => setShowSidebar(true)}
                  style={{ position: 'absolute', top: '16px', left: '16px', display: 'none' }}
                  title="Afficher les conversations"
                >
                  <FiMenu />
                </button>
                <FiMessageCircle className={clsx(styles['empty-chat-icon'])} />
                <p className={clsx(styles['empty-chat-text'])}>
                  Sélectionnez une conversation pour démarrer
                </p>
                {!isConnected && (
                  <p className={clsx(styles['connection-warning'])}>
                    ⚠️ Connexion temps réel indisponible
                  </p>
                )}
              </>
            ) : (
              <>
                <ChatHeader 
                  contact={{
                    id: selectedConversation.other_user_id,
                    display_name: selectedConversation.other_user_name,
                    profile_image_url: selectedConversation.other_user_image,
                    online: selectedConversation.other_user_online
                  }} 
                  onBack={handleBackToSidebar} 
                />
                <MessageList
                  messages={messages}
                  loading={isLoading}
                  currentUserId={currentUser?.id}
                  isTyping={isTyping}
                  typingUser={selectedConversation?.other_user_name}
                  onDeleteMessage={handleDeleteMessage}
                  onEditMessage={handleEditMessage}
                  onCopyMessage={handleCopyMessage}
                  onReaction={handleReaction}
                  onLoadMore={loadMoreMessages}
                  hasMore={hasMoreMessages}
                  loadingMore={loadingMoreMessages}
                />
                <ChatInput onSendMessage={handleSendMessage} disabled={sendingMessage || !isConnected} onTyping={handleTyping} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}