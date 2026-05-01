import { useEffect, useState, useCallback } from 'react';
import clsx from 'clsx';
import { FiMenu, FiMessageCircle } from 'react-icons/fi';
import { usePageLoading } from '../../hooks/usePageLoading';
import { SkeletonLine, SkeletonBox } from '../../components/Skeleton';
import { dataApi } from '../../lib/api';
import { useAuth } from '../../contexts/ContextAuthentification';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import styles from '../../styles/Messages/MessagerieStyles.module.css';

export default function Messagerie() {
  const { user: currentUser } = useAuth();
  const { isLoading, startLoading, stopLoading, hasShownSkeletons, markSkeletonsShown } = usePageLoading();
  
  useEffect(() => {
    if (isLoading && !hasShownSkeletons) {
      markSkeletonsShown();
    }
  }, [isLoading, hasShownSkeletons, markSkeletonsShown]);

  // State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true); // Par défaut visible en mobile

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

  // Fetch all users on component mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        startLoading();
        console.log('[Messagerie] fetchUsers debut, currentUser:', currentUser?.id);
        const usersData = await dataApi.fetchUsers();
        console.log('[Messagerie] users reçus:', usersData?.length);
        const filtered = usersData.filter((u) => u.id !== currentUser?.id);
        console.log('[Messagerie] users après filtrage:', filtered?.length);
        setUsers(filtered);
      } catch (err) {
        console.error('Erreur fetch users', err);
        setUsers([]);
      } finally {
        stopLoading();
      }
    }
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchConversation = async (targetUser = selectedUser) => {
    if (!targetUser || !currentUser) {
      console.log('[Messagerie] fetchConversation: targetUser ou currentUser manquant', { targetUser: targetUser?.id, currentUser: currentUser?.id });
      return;
    }

    const conversationId = [currentUser.id, targetUser.id].sort().join('_');
    console.log('[Messagerie] fetchConversation debut:', conversationId);
    startLoading();
    try {
      const msgs = await dataApi.fetchMessages(conversationId);
      console.log('[Messagerie] fetchConversation OK:', conversationId, 'messages:', msgs);
      setMessages(msgs || []);
    } catch (err) {
      console.error('[Messagerie] fetchConversation ERREUR:', err);
      setMessages([]);
    } finally {
      stopLoading();
    }
  };

  useEffect(() => {
    if (selectedUser && currentUser) {
      fetchConversation(selectedUser);
    }
  }, [selectedUser, currentUser]);

  const handleSendMessage = async (messageText) => {
    if (!selectedUser || !currentUser || !messageText.trim()) {
      console.log('[Messagerie] handleSendMessage: pre-conditions non remplies', { selectedUser: selectedUser?.id, currentUser: currentUser?.id, messageText });
      return;
    }

    console.log('[Messagerie] handleSendMessage debut:', messageText);
    setSendingMessage(true);
    try {
      const sentMessage = await dataApi.sendMessage(selectedUser.id, messageText);
      console.log('[Messagerie] handleSendMessage result:', sentMessage);
      if (sentMessage) {
        setMessages((prev) => [...prev, sentMessage]);
      }
      await fetchConversation(selectedUser);
    } catch (err) {
      console.error('[Messagerie] handleSendMessage ERREUR:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleBackToSidebar = () => {
    setSelectedUser(null);
    setShowSidebar(true);
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setShowSidebar(false);
    await fetchConversation(user);
  };

  return (
    <div className={clsx(styles['chat-container'])}>
      {/* En mobile: afficher la liste des conversations avec recherche */}
      {isMobile ? (
        selectedUser ? (
          /* Mobile: Vue conversation - même style que desktop */
          <div className={clsx(styles['mobile-chat-area'])} style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
            <ChatHeader contact={selectedUser} onBack={handleBackToSidebar} />
            <MessageList
              messages={messages}
              loading={isLoading}
              currentUserId={currentUser?.id}
            />
            <ChatInput onSendMessage={handleSendMessage} disabled={sendingMessage} />
          </div>
        ) : (
          /* Mobile: Liste des conversations */
          <div className={clsx(styles['chat-sidebar'], styles['mobile-visible'])} style={{ width: '100%', height: '100%' }}>
            <ChatSidebar
              users={users}
              selectedUser={selectedUser}
              onSelectUser={handleSelectUser}
              loading={isLoading && !hasShownSkeletons}
              className={clsx(styles['mobile-visible'])}
            />
          </div>
        )
      ) : (
        /* Desktop: comportement original */
        <>
          <ChatSidebar
            users={users}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            loading={isLoading && !hasShownSkeletons}
            className={clsx(styles['chat-sidebar'], { [styles['mobile-visible']]: showSidebar })}
          />

          <div
            className={clsx(styles['chat-area'], { [styles['empty-state']]: !selectedUser })}
          >
            {!selectedUser ? (
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
              </>
            ) : (
              <>
                <ChatHeader contact={selectedUser} onBack={handleBackToSidebar} />
                <MessageList
                  messages={messages}
                  loading={isLoading}
                  currentUserId={currentUser?.id}
                />
                <ChatInput onSendMessage={handleSendMessage} disabled={sendingMessage} />
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}