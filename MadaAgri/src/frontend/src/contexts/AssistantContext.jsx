import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getToken } from '../lib/api';

const AssistantContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export function AssistantProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const response = await fetch(`${API_BASE}/assistant/conversations`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('[Assistant] Failed to load conversations:', error);
    } finally {
      setIsSynced(true);
    }
  }

  async function loadMessages(convId) {
    try {
      const response = await fetch(`${API_BASE}/assistant/conversations/${convId}/messages`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
    } catch (error) {
      console.error('[Assistant] Failed to load messages:', error);
    }
    return [];
  }

  const createNewConversation = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/assistant/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ title: 'Nouvelle conversation' })
      });
      if (response.ok) {
        const data = await response.json();
        const conv = data.conversation;
        setConversations(prev => [conv, ...prev]);
        setCurrentConversation(conv.id);
        setMessages([]);
        return conv.id;
      }
    } catch (error) {
      console.error('[Assistant] Failed to create conversation:', error);
    }
    const fallbackId = Date.now().toString();
    const newConv = {
      id: fallbackId,
      title: 'Nouvelle conversation',
      is_favorite: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentConversation(fallbackId);
    setMessages([]);
    return fallbackId;
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/assistant/conversations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
    } catch (error) {
      console.error('[Assistant] Failed to delete conversation:', error);
    }
    setConversations(prev => prev.filter(c => c.id !== id));
    setCurrentConversation(prev => {
      if (prev === id) {
        setMessages([]);
        return null;
      }
      return prev;
    });
  }, []);

  const renameConversation = useCallback(async (id, newTitle) => {
    try {
      await fetch(`${API_BASE}/assistant/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ title: newTitle })
      });
    } catch (error) {
      console.error('[Assistant] Failed to rename conversation:', error);
    }
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, title: newTitle, updated_at: new Date().toISOString() } : c)
    );
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    try {
      await fetch(`${API_BASE}/assistant/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({ is_favorite: !conv.is_favorite })
      });
    } catch (error) {
      console.error('[Assistant] Failed to toggle favorite:', error);
    }
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, is_favorite: !c.is_favorite } : c)
    );
  }, [conversations]);

  const loadConversation = useCallback(async (id) => {
    setCurrentConversation(id);
    const dbMessages = await loadMessages(id);
    const formatted = dbMessages.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.created_at,
      imageUrl: m.image_url,
      isError: m.is_error === 1
    }));
    setMessages(formatted);
  }, []);

  const sendMessage = useCallback(async (content, imageFile = null) => {
    if (!content.trim() && !imageFile) return;

    let convId = currentConversation;
    let isFirstMessage = false;

    if (!convId) {
      convId = await createNewConversation();
      isFirstMessage = true;
    }

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toISOString(),
      imageUrl: null
    };

    if (imageFile) {
      try {
        const token = getToken();
        const formData = new FormData();
        formData.append('image', imageFile);
        const response = await fetch(`${API_BASE}/upload`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData
        });
        const data = await response.json();
        if (response.ok) userMessage.imageUrl = data.imageUrl;
      } catch (err) {
        console.error('Image upload failed:', err);
      }
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    if (isFirstMessage) {
      const title = content.trim().slice(0, 50) + (content.trim().length > 50 ? '...' : '');
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, title, updated_at: new Date().toISOString() } : c)
      );
    } else {
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c)
      );
    }

    setIsLoading(true);

    try {
      const conversationHistory = newMessages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await fetch(`${API_BASE}/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify({
          message: content,
          history: conversationHistory,
          conversationId: convId
        })
      });

      let data;
      try {
        data = await response.json();
      } catch {
        data = { response: null, error: 'Reponse invalide du serveur' };
      }

      if (!response.ok) {
        console.error('[Assistant] API error:', response.status, data);
        throw new Error(data.error || `Erreur serveur (${response.status})`);
      }

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response || 'Desole, je n\'ai pas pu traiter votre demande.',
        timestamp: new Date().toISOString(),
        sources: data.sources || []
      };

      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);

      if (isFirstMessage) {
        await loadConversations();
        await loadConversation(convId);
      }
    } catch (error) {
      console.error('[Assistant] Error details:', error.message);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'Desole, une erreur est survenue. Veuillez reessayer.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      const finalMessages = [...newMessages, errorMessage];
      setMessages(finalMessages);
    } finally {
      setIsLoading(false);
    }
  }, [currentConversation, messages, createNewConversation, loadConversations, loadConversation]);

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AssistantContext.Provider value={{
      conversations: filteredConversations,
      allConversations: conversations,
      currentConversation,
      messages,
      isLoading,
      searchQuery,
      setSearchQuery,
      isSynced,
      createNewConversation,
      deleteConversation,
      renameConversation,
      toggleFavorite,
      loadConversation,
      sendMessage,
      setCurrentConversation
    }}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const context = useContext(AssistantContext);
  if (!context) {
    throw new Error('useAssistant must be used within AssistantProvider');
  }
  return context;
}
