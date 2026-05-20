import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Search, Plus, Trash2, Pencil, Star, Send, Paperclip,
  Menu, X, Cpu, LayoutDashboard, Users, Sprout, BarChart3, Settings
} from 'lucide-react';
import { useAssistant } from '../../../contexts/AssistantContext';
import { useAuth } from '../../../contexts/ContextAuthentification';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from '../../../styles/Assistant.module.css';

function formatMarkdown(text) {
  if (!text) return '';
  let html = text
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br />');
  return html;
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  if (diff < 60000) return 'A l\'instant';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min`;
  if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const NAV_ITEMS = [
  { key: 'dashboard', path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { key: 'assistant', path: '/dashboard/assistant', icon: Cpu, label: 'Assistant IA' },
  { key: 'farmers', path: '/dashboard/network', icon: Users, label: 'Agriculteurs' },
  { key: 'cultures', path: '/dashboard/analysis', icon: Sprout, label: 'Cultures' },
  { key: 'analysis', path: '/dashboard/stats', icon: BarChart3, label: 'Analyses' },
  { key: 'settings', path: '/settings', icon: Settings, label: 'Parametres' },
];

export default function AssistantPage() {
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    searchQuery,
    setSearchQuery,
    createNewConversation,
    deleteConversation,
    renameConversation,
    toggleFavorite,
    loadConversation,
    sendMessage,
  } = useAssistant();

  const { user } = useAuth();
  const { theme } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    await sendMessage(inputValue);
    setInputValue('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isLoading) return;
    await sendMessage('Analyse cette image agricole:', file);
    e.target.value = '';
  };

  const handleStartEdit = (conv) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveEdit = () => {
    if (editTitle.trim()) {
      renameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleSuggestionClick = async (suggestion) => {
    setInputValue(suggestion);
    await sendMessage(suggestion);
  };

  const suggestions = [
    'Quelles sont les meilleures cultures pour ma region?',
    'Existe-t-il des agriculteurs qui cultivent du riz?',
    'Comment ameliorer le rendement de mes parcelles?',
    'Quelles sont les statistiques agricoles disponibles?'
  ];

  const currentConv = conversations.find(c => c.id === currentConversation);

  return (
    <div className={styles['assistant-container']}>
      <div className={`${styles['sidebar-overlay']} ${sidebarOpen ? styles.open : ''}`} onClick={() => setSidebarOpen(false)} />

      <div className={`${styles['assistant-sidebar']} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles['assistant-sidebar-header']}>
          <button className={styles['new-chat-btn']} onClick={() => { createNewConversation(); setSidebarOpen(false); }}>
            <Plus size={16} /> Nouveau chat
          </button>
          <div className={styles['search-wrapper']}>
            <Search className={styles['search-icon']} size={14} />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles['search-input']}
            />
          </div>
        </div>

        <div className={styles['conversations-list']}>
          {conversations.length === 0 ? (
            <div className={styles['empty-conversations']}>
              <MessageSquare size={32} />
              <p>Aucune conversation</p>
              <p style={{ fontSize: 12, marginTop: 4, opacity: 0.7 }}>Commencez un nouveau chat pour discuter</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles['conversation-item']} ${currentConversation === conv.id ? styles.active : ''}`}
                onClick={() => { loadConversation(conv.id); setSidebarOpen(false); }}
              >
                <div className={styles['conversation-item-header']}>
                  {editingId === conv.id ? (
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={handleSaveEdit}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                      className={styles['rename-input']}
                      autoFocus
                    />
                  ) : (
                    <p className={styles['conversation-title']}>{conv.title}</p>
                  )}
                  <div className={styles['conversation-actions']}>
                    <button
                      className={`${styles['conversation-action-btn']} ${conv.is_favorite ? styles['is-favorite'] : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(conv.id); }}
                      title={conv.is_favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    >
                      <Star size={14} />
                    </button>
                    <button
                      className={styles['conversation-action-btn']}
                      onClick={(e) => { e.stopPropagation(); handleStartEdit(conv); }}
                      title="Renommer"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className={styles['conversation-action-btn']}
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className={styles['conversation-meta']}>
                  <span>{formatTime(conv.updated_at)}</span>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = item.key === 'assistant';
            return (
              <button
                key={item.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 12px',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'var(--transition-smooth)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  textAlign: 'left',
                }}
                onClick={() => { if (item.path) window.location.href = item.path; }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles['chat-main']}>
        <div className={styles['chat-header']}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button className={styles['sidebar-toggle']} onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h2 className={styles['chat-header-title']}>
                {currentConv ? currentConv.title : 'Assistant MadaAgri'}
              </h2>
              <p className={styles['chat-header-subtitle']}>Specialise en agriculture et donnees agricoles</p>
            </div>
          </div>
        </div>

        {!currentConversation ? (
          <div className={styles['welcome-screen']}>
            <div className={styles['welcome-icon']}>
              <Cpu size={40} />
            </div>
            <h1 className={styles['welcome-title']}>Bienvenue sur l'Assistant MadaAgri</h1>
            <p className={styles['welcome-subtitle']}>
              Votre assistant intelligent pour l'agriculture. Posez des questions sur les cultures,
              les agriculteurs, les donnees agricoles ou l'utilisation de MadaAgri.
            </p>
            <div className={styles['welcome-suggestions']}>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className={styles['welcome-suggestion-card']}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className={styles['welcome-suggestion-icon']}>
                    {index === 0 ? <Sprout size={24} /> : index === 1 ? <Users size={24} /> : index === 2 ? <BarChart3 size={24} /> : <LayoutDashboard size={24} />}
                  </div>
                  <p className={styles['welcome-suggestion-text']}>{suggestion}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className={styles['messages-container']}>
              {messages.map(message => (
                <div key={message.id} className={`${styles.message} ${styles[message.role]}`}>
                  <div className={styles['message-avatar']}>
                    {message.role === 'user' ? (
                      user?.profile_image_url ? (
                        <img src={user.profile_image_url} alt={user.display_name} />
                      ) : (
                        <span style={{ fontSize: 14, fontWeight: 600 }}>
                          {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )
                    ) : (
                      <Cpu size={20} />
                    )}
                  </div>
                  <div className={styles['message-bubble']}>
                    <div className={styles['message-content']}>
                      {message.imageUrl && (
                        <img src={message.imageUrl} alt="Image uploaded" className={styles['message-image']} />
                      )}
                      <div dangerouslySetInnerHTML={{ __html: formatMarkdown(message.content) }} />
                    </div>
                    <div className={styles['message-time']}>
                      {new Date(message.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className={`${styles.message} ${styles.assistant}`}>
                  <div className={styles['message-avatar']}>
                    <Cpu size={20} />
                  </div>
                  <div className={styles['message-content']}>
                    <div className={styles['typing-indicator']}>
                      <div className={styles['typing-dot']} />
                      <div className={styles['typing-dot']} />
                      <div className={styles['typing-dot']} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles['chat-input-container']}>
              <div className={styles['suggestions-container']}>
                {suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    className={styles['suggestion-btn']}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className={styles['input-glass-wrapper']}>
                <textarea
                  ref={inputRef}
                  className={styles['input-field']}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Posez votre question sur l'agriculture..."
                  rows={1}
                  disabled={isLoading}
                />
                <div className={styles['input-actions']}>
                  <button
                    className={styles['input-action-btn']}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Uploader une image"
                  >
                    <Paperclip size={18} />
                  </button>
                  <button
                    className={styles['send-btn']}
                    onClick={handleSend}
                    disabled={!inputValue.trim() || isLoading}
                    title="Envoyer"
                  >
                    <Send size={18} />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
