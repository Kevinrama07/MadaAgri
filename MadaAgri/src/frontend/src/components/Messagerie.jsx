import { useEffect, useState, useCallback } from 'react';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import '../styles/MessagerieStyles.css';

export default function Messagerie() {
  const { user: currentUser } = useAuth();

  // State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Fetch all users on component mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersData = await dataApi.fetchUsers();
        setUsers(usersData.filter((u) => u.id !== currentUser?.id));
      } catch (err) {
        console.error('Erreur fetch users', err);
        setUsers([]);
      }
    }
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Fetch messages when user is selected
  useEffect(() => {
    if (selectedUser) {
      fetchConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  const fetchConversation = useCallback(async () => {
    if (!selectedUser || !currentUser) return;

    const conversationId = [currentUser.id, selectedUser.id].sort().join('_');
    setLoading(true);
    try {
      const msgs = await dataApi.fetchMessages(conversationId);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Erreur fetch messages', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [selectedUser, currentUser]);

  const handleSendMessage = useCallback(
    async (messageText) => {
      if (!selectedUser || !currentUser || !messageText.trim()) return;

      setSendingMessage(true);
      try {
        await dataApi.sendMessage(selectedUser.id, messageText);
        // Refresh messages
        await fetchConversation();
      } catch (err) {
        console.error("Erreur lors de l'envoi du message:", err);
      } finally {
        setSendingMessage(false);
      }
    },
    [selectedUser, currentUser, fetchConversation]
  );

  const handleBackToSidebar = () => {
    setSelectedUser(null);
    setShowSidebar(true);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setShowSidebar(false);
  };

  return (
    <div className="chat-container">
      <ChatSidebar
        users={users}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        loading={loading}
        className={`${showSidebar ? 'mobile-visible' : ''}`}
      />

      <div
        className={`chat-area ${!selectedUser ? 'empty-state' : ''}`}
      >
        {!selectedUser ? (
          <>
            <button
              className="chat-action-btn"
              onClick={() => setShowSidebar(true)}
              style={{ position: 'absolute', top: '16px', left: '16px', display: 'none' }}
              title="Afficher les conversations"
            >
              <i className="fas fa-bars"></i>
            </button>
            <i className="fas fa-comments empty-chat-icon"></i>
            <p className="empty-chat-text">
              Sélectionnez une conversation pour démarrer
            </p>
          </>
        ) : (
          <>
            <ChatHeader contact={selectedUser} onBack={handleBackToSidebar} />
            <MessageList
              messages={messages}
              loading={loading}
              currentUserId={currentUser?.id}
            />
            <ChatInput onSendMessage={handleSendMessage} disabled={sendingMessage} />
          </>
        )}
      </div>
    </div>
  );
}

