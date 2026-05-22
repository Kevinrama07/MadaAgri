import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import assistantService from '../services/assistantService';

const AssistantContext = createContext(null);

export function AssistantProvider({ children }) {
  const { i18n } = useTranslation();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const abortedRef = useRef(false);

  const loadConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await assistantService.getConversations();
      const list = Array.isArray(data) ? data : data?.conversations || [];
      setConversations(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadConversation = useCallback(async (id) => {
    try {
      setCurrentConversation(id);
      setIsLoading(true);
      const data = await assistantService.getMessages(id);
      const msgs = Array.isArray(data) ? data : data?.messages || [];
      setMessages(msgs);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createNewConversation = useCallback(async () => {
    try {
      const data = await assistantService.createConversation();
      const conv = data?.conversation || data;
      setConversations((prev) => [conv, ...prev]);
      setCurrentConversation(conv.id);
      setMessages([]);
      return conv;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await assistantService.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversation === id) {
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message);
    }
  }, [currentConversation]);

  const renameConversation = useCallback(async (id, title) => {
    try {
      await assistantService.updateConversation(id, { title });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title } : c))
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const toggleFavorite = useCallback(async (id, isFavorite) => {
    try {
      await assistantService.updateConversation(id, { is_favorite: isFavorite });
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_favorite: isFavorite } : c))
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const sendMessage = useCallback(async (content, imageUrl = null) => {
    if (!content?.trim() && !imageUrl) return;

    let convId = currentConversation;
    if (!convId) {
      const conv = await createNewConversation();
      if (!conv) return;
      convId = conv.id;
    }

    const userMessage = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: content?.trim() || '',
      image_url: imageUrl,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);
    abortedRef.current = false;

    try {
      const history = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await assistantService.sendChatMessage(
        userMessage.content,
        history,
        convId
      );

      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant',
        content: data?.response || data?.message || '...',
        created_at: new Date().toISOString(),
      };

      if (data?.conversation_title) {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === convId ? { ...c, title: data.conversation_title } : c
          )
        );
      }

      setMessages((prev) => [...prev, aiMessage]);
      loadConversations();
    } catch (err) {
      const errorMessage = {
        id: `err_${Date.now()}`,
        role: 'assistant',
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
        is_error: true,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  }, [currentConversation, messages, createNewConversation, loadConversations]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    searchQuery,
    error,
    setSearchQuery,
    loadConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    toggleFavorite,
    sendMessage,
    clearError,
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) throw new Error('useAssistant must be used within AssistantProvider');
  return ctx;
}
