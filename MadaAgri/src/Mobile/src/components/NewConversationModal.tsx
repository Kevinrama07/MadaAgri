import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { ModernAvatar } from './ModernAvatar';
import { SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../theme';
import { fetchUsers, searchUsers } from '../lib/api';

export const NewConversationModal = ({ visible, onSelectUser, onClose }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (visible) {
      loadUsers();
    }
  }, [visible]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchUsers();
      setUsers(response?.users || response || []);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query) => {
    setSearchQuery(query);

    if (!query.trim()) {
      loadUsers();
      return;
    }

    try {
      setSearching(true);
      const response = await searchUsers(query);
      setUsers(response?.users || response || []);
    } catch (error) {
      console.error('Erreur recherche:', error);
    } finally {
      setSearching(false);
    }
  };

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
      maxHeight: '80%',
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
    searchContainer: {
      padding: SPACING.LG,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    searchInput: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.secondaryBackground,
      borderRadius: BORDER_RADIUS.BUTTON,
      paddingHorizontal: SPACING.MD,
      gap: SPACING.SM,
    },
    searchInputText: {
      flex: 1,
      paddingVertical: SPACING.MD,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.text,
    },
    userList: {
      flex: 1,
    },
    userItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: SPACING.LG,
      gap: SPACING.MD,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: TYPOGRAPHY.subheading.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      color: colors.text,
      marginBottom: SPACING.XS,
    },
    userRole: {
      fontSize: TYPOGRAPHY.caption.fontSize,
      color: colors.textSecondary,
      textTransform: 'capitalize',
    },
    loading: {
      padding: SPACING.XL,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: SPACING.MD,
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
    },
    empty: {
      padding: SPACING.XL * 2,
      alignItems: 'center',
    },
    emptyIcon: {
      marginBottom: SPACING.LG,
    },
    emptyText: {
      fontSize: TYPOGRAPHY.body.fontSize,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

  const renderUser = ({ item }) => (
    <Pressable
      style={styles.userItem}
      onPress={() => {
        onSelectUser?.(item);
        onClose?.();
      }}
    >
      <ModernAvatar
        source={item.profile_image_url ? { uri: item.profile_image_url } : null}
        initials={item.display_name?.charAt(0) || 'U'}
        size="medium"
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name || 'Utilisateur'}</Text>
        <Text style={styles.userRole}>{item.role || 'utilisateur'}</Text>
      </View>
    </Pressable>
  );

  const renderEmpty = () => (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialCommunityIcons
          name="account-search-outline"
          size={64}
          color={colors.textTertiary}
        />
      </View>
      <Text style={styles.emptyText}>
        {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur disponible'}
      </Text>
    </View>
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
                <Text style={styles.title}>Nouvelle conversation</Text>
                <Pressable style={styles.closeBtn} onPress={onClose}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color={colors.text}
                  />
                </Pressable>
              </View>

              <View style={styles.searchContainer}>
                <View style={styles.searchInput}>
                  <MaterialCommunityIcons
                    name="magnify"
                    size={20}
                    color={colors.textTertiary}
                  />
                  <TextInput
                    style={styles.searchInputText}
                    placeholder="Rechercher un utilisateur..."
                    placeholderTextColor={colors.placeholder}
                    value={searchQuery}
                    onChangeText={handleSearch}
                    autoFocus
                  />
                  {searching && (
                    <ActivityIndicator size="small" color={colors.primary} />
                  )}
                </View>
              </View>

              {loading ? (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.loadingText}>Chargement...</Text>
                </View>
              ) : (
                <FlatList
                  data={users}
                  renderItem={renderUser}
                  keyExtractor={(item) => item.id.toString()}
                  ListEmptyComponent={renderEmpty}
                  style={styles.userList}
                />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default NewConversationModal;
