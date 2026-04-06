import { useEffect, useRef, useState } from 'react';
import { dataApi } from '../lib/api';
import { useAuth } from '../contexts/ContextAuthentification';

export default function Messagerie() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const usersData = await dataApi.fetchUsers();
        setUsers(usersData.filter((u) => u.id !== currentUser?.id));
      } catch (err) {
        console.error('Erreur fetch users', err);
      }
    }
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedUser) {
      fetchConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function fetchConversation() {
    if (!selectedUser || !currentUser) return;

    const conversationId = [currentUser.id, selectedUser.id].sort().join('_');
    setLoading(true);
    try {
      const msgs = await dataApi.fetchMessages(conversationId);
      setMessages(msgs);
    } catch (err) {
      console.error('Erreur fetch messages', err);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendMessage(e) {
    e.preventDefault();
    if (!selectedUser || !currentUser || !messageText.trim()) return;

    try {
      await dataApi.sendMessage(selectedUser.id, messageText);
      setMessageText('');
      await fetchConversation();
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
    }
  }

  return (
    <div className="flex gap-4 h-screen max-h-[600px]">
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto bg-white">
        <h3 className="font-bold text-lg p-4 border-b border-gray-200">Conversations</h3>
        {users.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p>Aucun utilisateur disponible</p>
          </div>
        ) : (
          <div className="space-y-1">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors ${
                  selectedUser?.id === user.id ? 'bg-green-50 border-l-4 border-green-600' : ''
                }`}
              >
                <div className="font-medium text-gray-900">{user.display_name}</div>
                <div className="text-xs text-gray-500">{user.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-lg">
        {selectedUser ? (
          <>
            <div className="border-b border-gray-200 p-4">
              <h2 className="font-bold text-lg text-gray-900">{selectedUser.display_name}</h2>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="text-center text-gray-500">Chargement...</div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500">
                  <p>Aucun message encore</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender_id === currentUser?.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-4 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Écrivez votre message..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              />
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold"
              >
                Envoyer
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p>Sélectionnez une conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

