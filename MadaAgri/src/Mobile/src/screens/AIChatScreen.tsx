import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { AssistantProvider, useAssistant } from '../contexts/AssistantContext';
import TypingIndicator from '../components/TypingIndicator';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

const SUGGESTIONS = [
  { icon: 'sprout', key: 'suggestion1' },
  { icon: 'rice', key: 'suggestion2' },
  { icon: 'calendar', key: 'suggestion3' },
  { icon: 'bug', key: 'suggestion4' },
];

function AIChatContent({ navigation }: any) {
  const { colors, mode } = useTheme();
  const { t } = useTranslation('assistant');
  const insets = useSafeAreaInsets();
  const isDark = mode === 'dark';
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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

  const handleSelectConversation = useCallback(async (id: string) => {
    setShowSidebar(false);
    await loadConversation(id);
  }, [loadConversation]);

  const handleDeleteConversation = useCallback((id: string) => {
    Alert.alert(
      t('deleteConfirm') || 'Supprimer la conversation ?',
      '',
      [
        { text: t('cancel', { ns: 'common' }) || 'Annuler', style: 'cancel' as const },
        { text: t('delete', { ns: 'common' }) || 'Supprimer', style: 'destructive' as const, onPress: () => deleteConversation(id) },
      ]
    );
  }, [deleteConversation, t]);

  const handleRename = useCallback((id: string, currentTitle: string) => {
    setEditingId(id);
    setEditTitle(currentTitle || '');
  }, []);

  const handleSaveRename = useCallback(async (id: string) => {
    if (editTitle.trim()) {
      await renameConversation(id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  }, [editTitle, renameConversation]);

  const handleSuggestion = useCallback((text: string) => {
    setInputText(text);
    inputRef.current?.focus();
  }, []);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c: any) => (c.title || '').toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const currentConvTitle = useMemo(() => {
    if (!currentConversation) return 'Nouveau chat';
    const conv = conversations.find((c: any) => c.id === currentConversation);
    return conv?.title || 'Assistant Agricole';
  }, [currentConversation, conversations]);

  const renderMessage = useCallback(({ item }: any) => {
    const isUser = item.role === 'user';
    const isError = item.is_error;
    const time = item.created_at
      ? new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    if (isUser) {
      return (
        <View style={[styles.messageRow, styles.userRow]}>
          <View style={[styles.userBubble, { backgroundColor: colors.primary }]}>
            <Text style={styles.userMessageText}>{item.content}</Text>
            <Text style={styles.userTime}>{time}</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.messageRow, styles.aiRow]}>
        <View style={[styles.aiAvatar, { backgroundColor: colors.glassTint }]}>
          <MaterialCommunityIcons name="robot" size={18} color={colors.primary} />
        </View>
        <View style={[styles.aiBubble, { backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.85)', borderColor: colors.glassBorder }]}>
          {isError ? (
            <View style={styles.errorRow}>
              <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{item.content}</Text>
            </View>
          ) : (
            <Markdown style={markdownStyles(colors, isDark)}>{item.content}</Markdown>
          )}
          <Text style={[styles.aiTime, { color: colors.textTertiary }]}>{time}</Text>
        </View>
      </View>
    );
  }, [colors, isDark]);

  const renderEmptyState = useCallback(() => (
    <View style={styles.emptyState}>
      <LinearGradient
        colors={[colors.primary + '20', colors.primaryLight + '10']}
        style={styles.emptyIconBg}
      >
        <MaterialCommunityIcons name="robot" size={52} color={colors.primary} />
      </LinearGradient>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Assistant Agricole IA</Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        Posez vos questions sur les cultures, la météo, les maladies ou les techniques agricoles
      </Text>
      <View style={styles.suggestionsGrid}>
        {SUGGESTIONS.map((s) => (
          <Pressable
            key={s.key}
            style={[styles.suggestionCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
            onPress={() => handleSuggestion(t(s.key))}
          >
            <View style={[styles.suggestionIcon, { backgroundColor: colors.glassTint }]}>
              <MaterialCommunityIcons name={s.icon as any} size={22} color={colors.primary} />
            </View>
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
        <View style={[styles.aiAvatar, { backgroundColor: colors.glassTint }]}>
          <MaterialCommunityIcons name="robot" size={18} color={colors.primary} />
        </View>
        <View style={[styles.aiBubble, styles.typingBubble, { backgroundColor: isDark ? colors.glass : 'rgba(255,255,255,0.85)', borderColor: colors.glassBorder }]}>
          <TypingIndicator color={colors.primary} />
        </View>
      </View>
    );
  }, [isSending, colors, isDark]);

  const renderSidebar = useCallback(() => (
    <Modal visible={showSidebar} animationType="slide" transparent onRequestClose={() => setShowSidebar(false)}>
      <View style={[styles.sidebarOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSidebar(false)} />
        <View style={[styles.sidebar, { backgroundColor: isDark ? colors.glassDarker : 'rgba(255,255,255,0.96)' }]}>
          <View style={[styles.sidebarHeader, { borderBottomColor: colors.glassBorder }]}>
            <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
            <Text style={[styles.sidebarTitle, { color: colors.text }]}>Conversations</Text>
            <Pressable onPress={() => setShowSidebar(false)} style={styles.sidebarClose}>
              <MaterialCommunityIcons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <View style={[styles.searchBar, { backgroundColor: colors.primaryBackground, borderColor: colors.glassBorder }]}>
            <MaterialCommunityIcons name="magnify" size={18} color={colors.textTertiary} />
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
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.sidebarList}
            renderItem={({ item }: any) => (
              <Pressable
                style={[
                  styles.conversationItem,
                  { backgroundColor: currentConversation === item.id ? colors.glassTint : 'transparent' },
                ]}
                onPress={() => handleSelectConversation(item.id)}
              >
                <View style={styles.convLeft}>
                  <MaterialCommunityIcons
                    name="chat-outline"
                    size={18}
                    color={currentConversation === item.id ? colors.primary : colors.textTertiary}
                  />
                </View>
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
                    {item.updated_at ? new Date(item.updated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : ''}
                  </Text>
                </View>
                <View style={styles.convActions}>
                  <Pressable onPress={() => toggleFavorite(item.id, !item.is_favorite)}>
                    <MaterialCommunityIcons
                      name={item.is_favorite ? 'star' : 'star-outline'}
                      size={16}
                      color={item.is_favorite ? '#F59E0B' : colors.textTertiary}
                    />
                  </Pressable>
                  {editingId === item.id ? (
                    <Pressable onPress={() => handleSaveRename(item.id)}>
                      <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
                    </Pressable>
                  ) : (
                    <>
                      <Pressable onPress={() => handleRename(item.id, item.title)}>
                        <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.textTertiary} />
                      </Pressable>
                      <Pressable onPress={() => handleDeleteConversation(item.id)}>
                        <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
                      </Pressable>
                    </>
                  )}
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={[styles.emptySidebar, { color: colors.textTertiary }]}>
                {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}
              </Text>
            }
          />
          <View style={[styles.sidebarFooter, { borderTopColor: colors.glassBorder }]}>
            <Pressable style={[styles.newChatBtn, { backgroundColor: colors.primary }]} onPress={handleNewChat}>
              <MaterialCommunityIcons name="plus" size={18} color="#FFF" />
              <Text style={styles.newChatLabel}>Nouvelle conversation</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  ), [showSidebar, colors, isDark, searchQuery, filteredConversations, currentConversation, editingId, editTitle, t, toggleFavorite, handleNewChat]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Glass header */}
      <View style={[
        styles.header,
        {
          backgroundColor: isDark ? 'rgba(8,12,20,0.85)' : 'rgba(246,248,250,0.85)',
          borderBottomColor: colors.glassBorder,
          paddingTop: insets.top + 8,
        },
      ]}>
        <Pressable onPress={() => setShowSidebar(true)} style={styles.headerBtn}>
          <MaterialCommunityIcons name="menu" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <View style={[styles.headerAvatar, { backgroundColor: colors.glassTint }]}>
            <MaterialCommunityIcons name="robot" size={20} color={colors.primary} />
          </View>
          <View style={styles.headerTextWrap}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {currentConvTitle}
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textTertiary }]}>
              Assistant agricole IA
            </Text>
          </View>
          {isLoading && <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 6 }} />}
        </View>
        <Pressable onPress={handleNewChat} style={styles.headerBtn}>
          <MaterialCommunityIcons name="plus-circle-outline" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item: any) => item.id}
          renderItem={renderMessage}
          ListEmptyComponent={!isLoading ? renderEmptyState : null}
          ListFooterComponent={renderTyping}
          contentContainerStyle={[styles.messageList, messages.length === 0 && styles.emptyList]}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: false })}
        />

        {messages.length === 0 && !isLoading && (
          <View style={styles.suggestionStrip}>
            <Text style={[styles.suggestionLabel, { color: colors.textTertiary }]}>Suggestions</Text>
            <FlatList
              horizontal
              data={SUGGESTIONS}
              keyExtractor={(s: any) => s.key}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsContainer}
              renderItem={({ item }: any) => (
                <Pressable
                  style={[styles.chip, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
                  onPress={() => handleSuggestion(t(item.key))}
                >
                  <MaterialCommunityIcons name={item.icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.chipText, { color: colors.text }]} numberOfLines={1}>{t(item.key)}</Text>
                </Pressable>
              )}
            />
          </View>
        )}

        {/* Glass input bar */}
        <View style={[
          styles.inputBar,
          {
            backgroundColor: isDark ? 'rgba(8,12,20,0.90)' : 'rgba(246,248,250,0.90)',
            borderTopColor: colors.glassBorder,
            paddingBottom: insets.bottom + 8,
          },
        ]}>
          <View style={[styles.inputContainer, { backgroundColor: isDark ? colors.glassDarker : 'rgba(255,255,255,0.90)', borderColor: colors.glassBorder }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: colors.text }]}
              placeholder={t('placeholder') || 'Posez votre question...'}
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
            style={[
              styles.sendBtn,
              { backgroundColor: inputText.trim() && !isSending ? colors.primary : colors.glassDarker },
            ]}
          >
            {isSending ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons
                name="send"
                size={20}
                color={inputText.trim() ? '#FFF' : colors.textTertiary}
              />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {renderSidebar()}
    </View>
  );
}

export default function AIChatScreen({ navigation }: any) {
  return (
    <AssistantProvider>
      <AIChatContent navigation={navigation} />
    </AssistantProvider>
  );
}

const markdownStyles = (colors: any, isDark: boolean) => ({
  body: { color: colors.text, fontSize: 15, lineHeight: 22 },
  strong: { fontWeight: '700' as const },
  em: { fontStyle: 'italic' as const },
  code_inline: {
    backgroundColor: colors.primaryPale,
    color: colors.primary,
    paddingHorizontal: 6,
    borderRadius: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' as string,
    fontSize: 13,
  },
  code_block: {
    backgroundColor: isDark ? 'rgba(0,0,0,0.30)' : colors.secondaryBackground,
    color: colors.text,
    padding: 14,
    borderRadius: 10,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' as string,
    fontSize: 13,
    marginVertical: 6,
  },
  fence: {
    backgroundColor: isDark ? 'rgba(0,0,0,0.30)' : colors.secondaryBackground,
    padding: 14,
    borderRadius: 10,
    marginVertical: 6,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: 14,
    marginVertical: 6,
    opacity: 0.8,
  },
  link: { color: colors.primary, textDecorationLine: 'underline' as const },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 6 },
  ordered_list: { marginVertical: 6 },
  heading1: { fontSize: 20, fontWeight: '700' as const, color: colors.text, marginVertical: 8 },
  heading2: { fontSize: 18, fontWeight: '700' as const, color: colors.text, marginVertical: 6 },
  heading3: { fontSize: 16, fontWeight: '600' as const, color: colors.text, marginVertical: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // ─── Header ─────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { padding: 8 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', marginHorizontal: 4 },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerTextWrap: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600' },
  headerSubtitle: { fontSize: 11, marginTop: 1, fontWeight: '500' },

  // ─── Messages ────────────────────────────────────────────
  messageList: { paddingHorizontal: 14, paddingVertical: 10, flexGrow: 1 },
  emptyList: { justifyContent: 'center' },

  messageRow: { flexDirection: 'row', marginVertical: 5, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
  },

  userBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userMessageText: { color: '#FFF', fontSize: 15, lineHeight: 21 },
  userTime: { color: 'rgba(255,255,255,0.55)', fontSize: 10, marginTop: 6, textAlign: 'right' },

  aiBubble: {
    maxWidth: SCREEN_WIDTH * 0.72,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  typingBubble: {
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
  },
  aiTime: { fontSize: 10, marginTop: 6, textAlign: 'right' },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 14, flex: 1 },

  // ─── Empty state ─────────────────────────────────────────
  emptyState: { alignItems: 'center', paddingHorizontal: 28 },
  emptyIconBg: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '700', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 20 },

  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  suggestionCard: {
    width: (SCREEN_WIDTH - 76) / 2,
    padding: 18,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    gap: 10,
  },
  suggestionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: { fontSize: 13, textAlign: 'center', lineHeight: 18, fontWeight: '500' },

  // ─── Suggestion chips ────────────────────────────────────
  suggestionStrip: { paddingHorizontal: 14, paddingBottom: 8 },
  suggestionLabel: { fontSize: 11, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  chipsContainer: { gap: 8, paddingRight: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontWeight: '500' },

  // ─── Input bar ───────────────────────────────────────────
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 18,
  },
  textInput: {
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 11,
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ─── Sidebar ─────────────────────────────────────────────
  sidebarOverlay: { flex: 1, flexDirection: 'row' },
  sidebar: {
    width: SCREEN_WIDTH * 0.82,
    maxWidth: 340,
    paddingTop: 0,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sidebarTitle: { fontSize: 17, fontWeight: '700', flex: 1 },
  sidebarClose: { padding: 4 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 14,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10, marginLeft: 8 },
  sidebarList: { paddingBottom: 12 },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  convLeft: { marginRight: 12 },
  convContent: { flex: 1 },
  convTitle: { fontSize: 14, fontWeight: '500' },
  convDate: { fontSize: 11, marginTop: 3 },
  convActions: { flexDirection: 'row', gap: 10, marginLeft: 8, alignItems: 'center' },
  renameInput: { borderBottomWidth: 1, fontSize: 14, paddingVertical: 2 },
  emptySidebar: { textAlign: 'center', marginTop: 40, fontSize: 13 },
  sidebarFooter: {
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  newChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
  },
  newChatLabel: { color: '#FFF', fontSize: 14, fontWeight: '600' },
});
