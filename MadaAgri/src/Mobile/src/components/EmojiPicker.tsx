import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';

const EMOJI_CATEGORIES = {
  smileys: {
    icon: 'emoticon-happy-outline',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  },
  gestures: {
    icon: 'hand-back-right-outline',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  },
  hearts: {
    icon: 'heart-outline',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝'],
  },
  animals: {
    icon: 'paw-outline',
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤'],
  },
  food: {
    icon: 'food-apple-outline',
    emojis: ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽'],
  },
  activities: {
    icon: 'soccer',
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🎯'],
  },
  symbols: {
    icon: 'star-outline',
    emojis: ['✅', '❌', '⭐', '🌟', '💫', '✨', '🔥', '💯', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '💰', '💎'],
  },
};

export const EmojiPicker = ({ visible, onSelect, onClose }) => {
  const { colors } = useTheme();
  const [activeCategory, setActiveCategory] = useState('smileys');

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    container: {
      backgroundColor: colors.card,
      borderTopLeftRadius: BORDER_RADIUS.CARD * 2,
      borderTopRightRadius: BORDER_RADIUS.CARD * 2,
      maxHeight: '60%',
      paddingBottom: SPACING.LG,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.LG,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: TYPOGRAPHY.h3.fontSize,
      fontWeight: TYPOGRAPHY.h3.fontWeight,
      color: colors.text,
    },
    closeBtn: {
      padding: SPACING.SM,
    },
    categories: {
      flexDirection: 'row',
      paddingHorizontal: SPACING.MD,
      paddingVertical: SPACING.MD,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: SPACING.SM,
    },
    categoryBtn: {
      padding: SPACING.MD,
      borderRadius: BORDER_RADIUS.BUTTON,
      backgroundColor: colors.secondaryBackground,
    },
    categoryBtnActive: {
      backgroundColor: colors.primary,
    },
    emojiGrid: {
      padding: SPACING.MD,
    },
    emojiBtn: {
      width: '12.5%',
      aspectRatio: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.SM,
    },
    emoji: {
      fontSize: 28,
    },
  });

  const renderEmoji = ({ item }) => (
    <Pressable
      style={styles.emojiBtn}
      onPress={() => {
        onSelect?.(item);
        onClose?.();
      }}
    >
      <Text style={styles.emoji}>{item}</Text>
    </Pressable>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Choisir un emoji</Text>
                <Pressable style={styles.closeBtn} onPress={onClose}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categories}
              >
                {Object.keys(EMOJI_CATEGORIES).map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryBtn,
                      activeCategory === cat && styles.categoryBtnActive,
                    ]}
                    onPress={() => setActiveCategory(cat)}
                  >
                    <MaterialCommunityIcons
                      name={EMOJI_CATEGORIES[cat].icon}
                      size={24}
                      color={
                        activeCategory === cat ? '#fff' : colors.textSecondary
                      }
                    />
                  </Pressable>
                ))}
              </ScrollView>

              <FlatList
                data={EMOJI_CATEGORIES[activeCategory].emojis}
                renderItem={renderEmoji}
                keyExtractor={(item, index) => `${item}-${index}`}
                numColumns={8}
                contentContainerStyle={styles.emojiGrid}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default EmojiPicker;
