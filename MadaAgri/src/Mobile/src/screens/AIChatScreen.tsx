import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Animated,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { AssistantProvider, useAssistant } from '../contexts/AssistantContext';
import TypingIndicator from '../components/TypingIndicator';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SUGGESTIONS = [
  { icon: 'sprout', key: 'suggestion1' },
  { icon: 'rice', key: 'suggestion2' },
  { icon: 'calendar', key: 'suggestion3' },
  { icon: 'bug', key: 'suggestion4' },
];

function AIChatContent({ navigation }) {
  const { colors, isDark } = useTheme();
  const { t } = useTranslation('assistant');
  const insets = useSafeAreaInsets();
  const {
    conversations,
    currentConversation,
    messages,
    isLoading,
    isSending,
    searchQuery,
    setSearchQuery,
    loadConversations,
    loadConversation,
    createNewConversation,
    deleteConversation,
    renameConversation,
    toggleFavorite,
    sendMessage,
  } = useAssistant();

  const [inputText, setInputText] = useState('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, isSending]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    Keyboard.dismiss();
    await sendMessage(text);
  }, [inputText, sendMessage]);

  const handleNewChat = useCallback(async () => {
    setShowSidebar(false);
    await createNewConversation();
  }, [createNewConversation]);

  const handleSelectConversation = useCallback(async (id) => {
    setShowSidebar(false);
    await loadConversation(id);
  }, [loadConversation]);

  const handleDeleteConversation = useCallback((id) => {
    Alert.alert(
      t('deleteConfirm') || 'Supprimer la conversation ?',
      '',
      [
        { text: t('cancel', { ns: 'common' }) || 'Annuler', style: 'cancel' },
        { text: t('delete', { ns: 'common' }) || 'Supprimer', style: 'destructive', onPress: () => deleteConversation(id) },
      ]
    );
  }, [deleteConversation, t]);

  const handleRename = useCallback((id, currentTitle) => {
    setEditingId(id);
    setEditTitle(currentTitle || '');
  }, []);

  const handleSaveRename = useCallback(async (id) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  }, [editTitle, renameConversation]);

  const handleSuggestion = useCallback((text) => {
    setInputText(text);
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const currentConvTitle = useMemo(() => {
    if (!currentConversation) return '';
    const conv = conversations.find((c) => c.id === currentConversation);
    return conv?.title || t('assistant') || 'Assistant';
  }, [currentConversation, conversations, t]);

  const renderMessage = useCallback(({ item }) => {
    const isUser = item.role === 'user';
    const isError = item.is_error;
    const time = item.created_at ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryPale }]}>
            <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? [styles.userBubble, { backgroundColor: colors.primary }] : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]]}>
          {isUser ? (
            <Text style={[styles.userMessageText, { color: '#fff' }]}>{item.content}</Text>
          ) : (
            <Markdown style={markdownStyles(colors, isError)}>{item.content}</Markdown>
          )}
          {item.image_url && (
            <Text style={[styles.imageIndicator, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textSecondary }]}>
              📷 {item.image_url.split('/').pop()}
            </Text>
          )}
          <Text style={[styles.timeStamp, { color: isUser ? 'rgba(255,255,255,0.6)' : colors.textTertiary }]}>{time}</Text>
        </View>
        {isUser && (
          <View style={[styles.avatarCircle, { backgroundColor: colors.primaryPale }]}>
            <MaterialCommunityIcons name="account" size={16} color={colors.primary} />
          </View>
        )}
      </View>
    );
  }, [colors]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.primaryPale }]}>
        <MaterialCommunityIcons name="robot" size={48} color={colors.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{t('title')}</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>{t('subtitle')}</Text>

      <View style={styles.suggestionsGrid}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.key}
            style={[styles.suggestionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => handleSuggestion(t(s.key))}
          >
            <MaterialCommunityIcons name={s.icon as any} size={24} color={colors.primary} />
            <Text style={[styles.suggestionText, { color: colors.text }]} numberOfLines={2}>
              {t(s.key)}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  ), [colors, t, handleSuggestion]);

  const renderTyping = useCallback(() => {
    if (!isSending) return null;
    return (
      <View style={[styles.messageRow, styles.aiRow]}>
        <View style={[styles.avatarCircle, { backgroundColor: colors.primaryPale }]}>
          <MaterialCommunityIcons name="robot" size={16} color={colors.primary} />
        </View>
        <View style={[styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TypingIndicator color={colors.primary} />
        </View>
      </View>
    );
  }, [isSending, colors]);

  const renderSidebar = useCallback(() => (
    <Modal visible={showSidebar} animationType="slide" transparent onRequestClose={() => setShowSidebar(false)}>
      <View style={[styles.sidebarOverlay, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSidebar(false)} />
        <View style={[styles.sidebar, { backgroundColor: colors.card }]}>
          <View style={[styles.sidebarHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.sidebarTitle, { color: colors.text }]}>Conversations</Text>
            <Pressable onPress={() => setShowSidebar(false)}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.searchBar, { backgroundColor: colors.primaryBackground, borderColor: colors.border }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Rechercher..."
              placeholderTextColor={colors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <FlatList
            data={filteredConversations}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.sidebarList}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.conversationItem, currentConversation === item.id && { backgroundColor: colors.primaryPale }]}
                onPress={() => handleSelectConversation(item.id)}
              >
                <View style={styles.convContent}>
                  {editingId === item.id ? (
                    <TextInput
                      style={[styles.renameInput, { color: colors.text, borderColor: colors.primary }]}
                      value={editTitle}
                      onChangeText={setEditTitle}
                      onSubmitEditing={() => handleSaveRename(item.id)}
                      autoFocus
                    />
                  ) : (
                    <Text style={[styles.convTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title || 'Nouvelle conversation'}
                    </Text>
                  )}
                  <Text style={[styles.convDate, { color: colors.textTertiary }]}>
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}
                  </Text>
                </View>
                <View style={styles.convActions}>
                  {editingId === item.id ? (
                    <Pressable onPress={() => handleSaveRename(item.id)}>
                      <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                    </Pressable>
                  ) : (
                    <>
                      <Pressable onPress={() => handleRename(item.id, item.title)}>
                        <MaterialCommunityIcons name="pencil" size={16} color={colors.textSecondary} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteConversation(item.id)}>
                        <MaterialCommunityIcons name="delete" size={16} color={colors.error} />
                      </Pressable>
                    </>
                  )}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptySidebar, { color: colors.textSecondary }]}>
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </Text>
            }
          />
        </View>
      </View>
    </Modal>
  ), [showSidebar, colors, searchQuery, filteredConversations, currentConversation, editingId, editTitle, t]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: isDark ? 'rgba(18,29,58,0.92)' : 'rgba(255,255,255,0.92)', borderBottomColor: colors.border }]}>
        <Pressable onPress={() => setShowSidebar(true)} style={styles.headerBtn}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
            {currentConvTitle || t('title')}
          </Text>
          {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />}
        </View>
        <Pressable onPress={handleNewChat} style={styles.headerBtn}>
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          ListFooterComponent={renderTyping}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        />

        {messages.length === 0 && !isLoading && (
          <View style={styles.suggestionStrip}>
            <Text style={[styles.suggestionLabel, { color: colors.textSecondary }]}>{t('suggestions')}</Text>
            <FlatList
              horizontal
              data={SUGGESTIONS}
              keyExtractor={(s) => s.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => handleSuggestion(t(item.key))}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{t(item.key)}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        <View style={[styles.inputBar, { backgroundColor: isDark ? 'rgba(18,29,58,0.95)' : 'rgba(255,255,255,0.95)', borderTopColor: colors.border }]}>
          <View style={[styles.inputContainer, { backgroundColor: colors.primaryBackground, borderColor: colors.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('placeholder')}
              placeholderTextColor={colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={2000}
              onSubmitEditing={handleSend}
              blurOnSubmit
            />
          </View>
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() && !isSending ? colors.primary : colors.border }]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color={inputText.trim() ? '#fff' : colors.textTertiary} />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {renderSidebar()}
    </View>
  );
}

export default function AIChatScreen({ navigation }) {
  return (
    <AssistantProvider>
      <AIChatContent navigation={navigation} />
    </AssistantProvider>
  );
}

const markdownStyles = (colors, isError) => ({
  body: { color: isError ? colors.error : colors.text, fontSize: 15, lineHeight: 22 },
  strong: { fontWeight: '700' },
  em: { fontStyle: 'italic' },
  code_inline: {
    backgroundColor: colors.primaryPale,
    color: colors.primary,
    paddingHorizontal: 4,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
  },
  code_block: {
    backgroundColor: colors.secondaryBackground,
    color: colors.text,
    padding: 12,
    borderRadius: 8,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 13,
    marginVertical: 4,
  },
  fence: {
    backgroundColor: colors.secondaryBackground,
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 12,
    marginVertical: 4,
    opacity: 0.8,
  },
  link: { color: colors.primary, textDecorationLine: 'underline' },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  heading1: { fontSize: 22, fontWeight: '700', color: colors.text, marginVertical: 8 },
  heading2: { fontSize: 19, fontWeight: '700', color: colors.text, marginVertical: 6 },
  heading3: { fontSize: 17, fontWeight: '600', color: colors.text, marginVertical: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '600' },

  messageList: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1 },
  emptyList: { justifyContent: 'center' },

  messageRow: { flexDirection: 'row', marginVertical: 4, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },

  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
  },

  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    borderBottomLeftRadius: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },

  userMessageText: { fontSize: 15, lineHeight: 21 },
  imageIndicator: { fontSize: 11, marginTop: 4 },
  timeStamp: { fontSize: 10, marginTop: 4, textAlign: 'right' },

  emptyState: { alignItems: 'center', paddingHorizontal: 24 },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 6 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 24, lineHeight: 20 },

  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  suggestionCard: {
    width: (SCREEN_WIDTH - 68) / 2,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 8,
  },
  suggestionText: { fontSize: 12, textAlign: 'center', lineHeight: 16, fontWeight: '500' },

  suggestionStrip: { paddingHorizontal: 12, paddingBottom: 8 },
  suggestionLabel: { fontSize: 11, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsContainer: { gap: 8, paddingRight: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 12, fontWeight: '500' },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
  },
  textInput: {
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Sidebar
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: SCREEN_WIDTH * 0.8,
    maxWidth: 320,
    paddingTop: 50,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sidebarTitle: { fontSize: 18, fontWeight: '700' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10, marginLeft: 8 },
  sidebarList: { paddingBottom: 20 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 8,
    borderRadius: 10,
    marginBottom: 2,
  },
  convContent: { flex: 1 },
  convTitle: { fontSize: 14, fontWeight: '500' },
  convDate: { fontSize: 11, marginTop: 2 },
  convActions: { flexDirection: 'row', gap: 8, marginLeft: 8 },
  renameInput: {
    borderBottomWidth: 1,
    fontSize: 14,
    paddingVertical: 2,
  },
  emptySidebar: { textAlign: 'center', marginTop: 32, fontSize: 13 },
});
