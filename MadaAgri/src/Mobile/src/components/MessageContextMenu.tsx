import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

export const MessageContextMenu = ({
  visible,
  message,
  isOwn,
  position,
  onEdit,
  onDelete,
  onReact,
  onCopy,
  onClose,
}) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    menu: {
      position: 'absolute',
      backgroundColor: colors.card,
      borderRadius: BORDER_RADIUS.CARD,
      padding: SPACING.SM,
      minWidth: 200,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    quickReactions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      paddingVertical: SPACING.SM,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      marginBottom: SPACING.SM,
    },
    reactionBtn: {
      padding: SPACING.SM,
    },
    reactionEmoji: {
      fontSize: 24,
    },
    actions: {
      gap: SPACING.XS,
    },
    actionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: SPACING.MD,
      padding: SPACING.MD,
      borderRadius: BORDER_RADIUS.BUTTON,
    },
    actionBtnDanger: {
      backgroundColor: colors.error + '10',
    },
    actionIcon: {
      width: 20,
    },
    actionText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
      flex: 1,
    },
    actionTextDanger: {
      color: colors.error,
    },
  });

  const menuStyle = {
    ...styles.menu,
    top: position.y,
    left: Math.min(position.x, 300), // Éviter de sortir de l'écran
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={menuStyle}>
              {/* Quick Reactions */}
              <View style={styles.quickReactions}>
                {QUICK_REACTIONS.map((emoji) => (
                  <Pressable
                    key={emoji}
                    style={styles.reactionBtn}
                    onPress={() => {
                      onReact?.(emoji);
                      onClose?.();
                    }}
                  >
                    <Text style={styles.reactionEmoji}>{emoji}</Text>
                  </Pressable>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => {
                    onReact?.();
                    onClose?.();
                  }}
                >
                  <MaterialCommunityIcons
                    name="emoticon-happy-outline"
                    size={20}
                    color={colors.text}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionText}>Réagir</Text>
                </Pressable>

                <Pressable
                  style={styles.actionBtn}
                  onPress={() => {
                    onCopy?.(message);
                    onClose?.();
                  }}
                >
                  <MaterialCommunityIcons
                    name="content-copy"
                    size={20}
                    color={colors.text}
                    style={styles.actionIcon}
                  />
                  <Text style={styles.actionText}>Copier</Text>
                </Pressable>

                {isOwn && (
                  <>
                    <Pressable
                      style={styles.actionBtn}
                      onPress={() => {
                        onEdit?.(message);
                        onClose?.();
                      }}
                    >
                      <MaterialCommunityIcons
                        name="pencil-outline"
                        size={20}
                        color={colors.text}
                        style={styles.actionIcon}
                      />
                      <Text style={styles.actionText}>Modifier</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, styles.actionBtnDanger]}
                      onPress={() => {
                        onDelete?.(message);
                        onClose?.();
                      }}
                    >
                      <MaterialCommunityIcons
                        name="delete-outline"
                        size={20}
                        color={colors.error}
                        style={styles.actionIcon}
                      />
                      <Text style={[styles.actionText, styles.actionTextDanger]}>
                        Supprimer
                      </Text>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default MessageContextMenu;
