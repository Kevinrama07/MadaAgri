import { useEffect, useState, useCallback, useRef } from 'react';
import clsx from 'clsx';
import { FiMenu, FiMessageCircle } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import socketService from '../../services/socketService';
import ChatSidebar from './ModernChatSidebar';
import ChatHeader from './ChatHeader';
import MessageList from './ModernMessageList';
import ChatInput from './ModernChatInput';
import NewConversationModal from '../../components/NewConversationModal';
import ConfirmDialog from '../../components/ConfirmDialog';
import EditMessageDialog from '../../components/EditMessageDialog';
import styles from '../../styles/Messages/ModernMessagerieStyles.module.css';

export default function ModernMessagerie() {
  const { user: currentUser } = useAuth();
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
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
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
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
        const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:4000';
        await socketService.connect(apiBase, currentUser.id);
        setIsConnected(true);
        console.log('[Messagerie] Socket.io connecté');
      } catch (error) {
        console.error('[Messagerie] Erreur connexion Socket.io:', error);
        setIsConnected(false);
      }
    };

    initSocket();

    // Écouter les changements de connexion
    const unsubConnect = socketService.onConnect(() => setIsConnected(true));
    const unsubDisconnect = socketService.onDisconnect(() => setIsConnected(false));

    return () => {
      unsubConnect();
      unsubDisconnect();
    };
  }, [currentUser]);

  // Charger les conversations existantes
  useEffect(() => {
    async function fetchConversations() {
      if (!currentUser) return;
      
      try {
        startLoading();
        console.log('[Messagerie] Chargement conversations...');
        const convData = await dataApi.fetchConversations();
        console.log('[Messagerie] Conversations reçues:', convData?.length);
        setConversations(convData || []);
      } catch (err) {
        console.error('[Messagerie] Erreur chargement conversations:', err);
        setConversations([]);
      } finally {
        stopLoading();
      }
    }
    
    fetchConversations();
  }, [currentUser]);

  // Rejoindre la conversation et écouter les messages
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const conversationId = selectedConversation.id;
    console.log('[Messagerie] Rejoindre conversation:', conversationId);

    // Rejoindre la room Socket.io
    socketService.joinConversation(conversationId);

    // Écouter les nouveaux messages
    const unsubMessage = socketService.onMessage((message) => {
      console.log('[Messagerie] Message reçu:', message);
      if (message.conversationId === conversationId || message.conversation_id === conversationId) {
        setMessages((prev) => {
          // Éviter les doublons
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
      }
    });

    // Écouter l'indicateur de saisie
    const handleTypingStart = (data) => {
      if (data.conversationId === conversationId && data.userId !== currentUser.id) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleTypingStop = (data) => {
      if (data.conversationId === conversationId) {
        setIsTyping(false);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      }
    };

    return () => {
      unsubMessage();
      socketService.leaveConversation(conversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedConversation, currentUser]);

  // Charger les messages d'une conversation
  const fetchConversationMessages = async (conversation) => {
    if (!conversation || !currentUser) return;

    const conversationId = conversation.id;
    console.log('[Messagerie] Chargement messages:', conversationId);
    startLoading();
    try {
      const data = await dataApi.fetchMessages(conversationId);
      console.log('[Messagerie] Messages chargés:', data?.messages?.length);
      setMessages(data?.messages || []);
    } catch (err) {
      console.error('[Messagerie] Erreur chargement messages:', err);
      setMessages([]);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    if (selectedConversation && currentUser) {
      fetchConversationMessages(selectedConversation);
    }
  }, [selectedConversation, currentUser]);

  const handleSendMessage = async (messageText, attachmentUrl = null, attachmentType = null) => {
    if (!selectedConversation || !currentUser || (!messageText.trim() && !attachmentUrl)) return;

    console.log('[Messagerie] Envoi message:', messageText, attachmentUrl);
    setSendingMessage(true);
    
    try {
      const recipientId = selectedConversation.other_user_id;
      
      // Envoyer via Socket.io
      await socketService.sendMessage(recipientId, messageText || '');
      console.log('[Messagerie] Message envoyé via Socket.io');
      
      // Le message arrivera via socket.on('message:received')
    } catch (err) {
      console.error('[Messagerie] Erreur envoi message:', err);
      
      // Fallback API
      try {
        const sentMessage = await dataApi.sendMessage(selectedConversation.other_user_id, messageText, attachmentUrl, attachmentType);
        if (sentMessage) {
          setMessages((prev) => [...prev, sentMessage]);
        }
      } catch (apiErr) {
        console.error('[Messagerie] Erreur fallback API:', apiErr);
        alert('Erreur lors de l\'envoi du message');
      }
    } finally {
      setSendingMessage(false);
    }
  };

  const handleEditMessage = async (message) => {
    setEditingMessage(message);
  };

  const saveEditedMessage = async (newContent) => {
    if (!editingMessage) return;

    try {
      await dataApi.editMessage(editingMessage.id, newContent);
      // Mettre à jour localement
      setMessages((prev) =>
        prev.map((m) =>
          m.id === editingMessage.id
            ? { ...m, content: newContent, edited_at: new Date().toISOString() }
            : m
        )
      );
      setEditingMessage(null);
    } catch (error) {
      console.error('Erreur édition message:', error);
      alert('Erreur lors de la modification du message');
      setEditingMessage(null);
    }
  };

  const handleDeleteMessage = async (message) => {
    setConfirmDelete(message);
  };

  const confirmDeleteMessage = async () => {
    if (!confirmDelete) return;

    try {
      await dataApi.deleteMessage(confirmDelete.id);
      // Retirer localement
      setMessages((prev) => prev.filter((m) => m.id !== confirmDelete.id));
      setConfirmDelete(null);
    } catch (error) {
      console.error('Erreur suppression message:', error);
      alert('Erreur lors de la suppression du message');
      setConfirmDelete(null);
    }
  };

  const handleNewConversation = () => {
    setShowNewConversationModal(true);
  };

  const handleSelectUserForNewConversation = async (user) => {
    // Créer ou sélectionner la conversation avec cet utilisateur
    const existingConv = conversations.find(c => c.other_user_id === user.id);
    
    if (existingConv) {
      setSelectedConversation(existingConv);
      setShowSidebar(false);
      await fetchConversationMessages(existingConv);
    } else {
      // Créer une nouvelle conversation
      const newConv = {
        id: `${currentUser.id}_${user.id}`,
        other_user_id: user.id,
        other_user_name: user.display_name,
        other_user_image: user.profile_image_url,
        other_user_online: false,
        last_message: null,
        last_message_at: null,
        unread_count: 0
      };
      
      setConversations((prev) => [newConv, ...prev]);
      setSelectedConversation(newConv);
      setShowSidebar(false);
      setMessages([]);
    }
  };

  const handleTyping = () => {
    if (!selectedConversation || !currentUser) return;
    
    // Émettre l'événement de saisie
    socketService.sendTypingNotification(selectedConversation.other_user_id);
  };

  const handleBackToSidebar = () => {
    setSelectedConversation(null);
    setShowSidebar(true);
  };

  const handleSelectConversation = async (conversation) => {
    setSelectedConversation(conversation);
    setShowSidebar(false);
    await fetchConversationMessages(conversation);
  };

  return (
    <div className={clsx(styles['chat-container'])}>
      {/* En mobile: afficher la liste ou la conversation */}
      {isMobile ? (
        selectedConversation ? (
          <div className={clsx(styles['mobile-chat-area'])}>
            <ChatHeader 
              contact={{
                id: selectedConversation.other_user_id,
                display_name: selectedConversation.other_user_name,
                profile_image_url: selectedConversation.other_user_image,
                online: selectedConversation.other_user_online
              }} 
              onBack={handleBackToSidebar}
              isConnected={isConnected}
            />
            <MessageList
              messages={messages}
              loading={isLoading}
              currentUserId={currentUser?.id}
              isTyping={isTyping}
              typingUser={selectedConversation.other_user_name}
              onEditMessage={handleEditMessage}
              onDeleteMessage={handleDeleteMessage}
            />
            <ChatInput 
              onSendMessage={handleSendMessage} 
              onTyping={handleTyping}
              disabled={sendingMessage || !isConnected} 
            />
          </div>
        ) : (
          <div className={clsx(styles['chat-sidebar'], styles['mobile-visible'])}>
            <ChatSidebar
              conversations={conversations}
              selectedConversation={selectedConversation}
              onSelectConversation={handleSelectConversation}
              onNewConversation={handleNewConversation}
              loading={isLoading && !hasShownSkeletons}
              isConnected={isConnected}
            />
          </div>
        )
      ) : (
        /* Desktop: vue split */
        <>
          <ChatSidebar
            conversations={conversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            onNewConversation={handleNewConversation}
            loading={isLoading && !hasShownSkeletons}
            isConnected={isConnected}
            className={clsx(styles['chat-sidebar'])}
          />

          <div className={clsx(styles['chat-area'], { [styles['empty-state']]: !selectedConversation })}>
            {!selectedConversation ? (
              <>
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
                  isConnected={isConnected}
                />
                <MessageList
                  messages={messages}
                  loading={isLoading}
                  currentUserId={currentUser?.id}
                  isTyping={isTyping}
                  typingUser={selectedConversation.other_user_name}
                  onEditMessage={handleEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                />
                <ChatInput 
                  onSendMessage={handleSendMessage}
                  onTyping={handleTyping}
                  disabled={sendingMessage || !isConnected} 
                />
              </>
            )}
          </div>
        </>
      )}

      {showNewConversationModal && (
        <NewConversationModal
          onClose={() => setShowNewConversationModal(false)}
          onSelectUser={handleSelectUserForNewConversation}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Supprimer le message"
          message="Voulez-vous vraiment supprimer ce message ? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          danger={true}
          onConfirm={confirmDeleteMessage}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {editingMessage && (
        <EditMessageDialog
          message={editingMessage}
          onSave={saveEditedMessage}
          onCancel={() => setEditingMessage(null)}
        />
      )}
    </div>
  );
}
