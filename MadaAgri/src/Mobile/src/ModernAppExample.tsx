import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { RealtimeNotificationsProvider } from './contexts/RealtimeNotificationsContext';
// import { ModernBottomTabs } from './components/ModernBottomTabs'; // Component not found
import { ModernFeedScreen } from './screens/ModernFeedScreen';
import { ModernMarketplaceScreen } from './screens/ModernMarketplaceScreen';
import { ModernMessagesScreen } from './screens/ModernMessagesScreen';
import { ModernNotificationsScreen } from './screens/ModernNotificationsScreen';
import { ModernProfileScreen } from './screens/ModernProfileScreen';
import { ChatDetailScreen } from './screens/ChatDetailScreen';

const ModernAppContent = () => {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('home');
  const [notificationCount, setNotificationCount] = useState(3);
  const [messageCount, setMessageCount] = useState(2);
  const [selectedConversation, setSelectedConversation] = useState<{
    id: string;
    participant: { id: string; name: string; avatar?: { uri: string }; online?: boolean };
  } | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    screenContainer: {
      flex: 1,
    },
  });

  // Render active screen based on tab
  const renderScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ModernFeedScreen
            onCreatePost={() => console.log('Create post')}
            onNotificationPress={() => setActiveTab('notifications')}
            onMessagePress={() => setActiveTab('messages')}
            onProfilePress={() => setActiveTab('profile')}
            onPostPress={(postId) => console.log('Post pressed:', postId)}
            onAuthorPress={(authorId) => console.log('Author pressed:', authorId)}
          />
        );

      case 'marketplace':
        return (
          <ModernMarketplaceScreen
            onProductPress={(productId) => console.log('Product pressed:', productId)}
            onContactPress={(productId) => console.log('Contact seller:', productId)}
            onCategoryPress={(category) => console.log('Category:', category)}
            onSearchPress={() => console.log('Search pressed')}
          />
        );

      case 'messages':
        if (selectedConversation) {
          return (
            <ChatDetailScreen
              conversationId={selectedConversation.id}
              participant={selectedConversation.participant}
              onBackPress={() => setSelectedConversation(null)}
            />
          );
        }
        return (
          <ModernMessagesScreen
            onConversationPress={(conversationId, participant) =>
              setSelectedConversation({ id: conversationId, participant })
            }
            onNewMessagePress={() => console.log('New message')}
          />
        );

      case 'notifications':
        return (
          <ModernNotificationsScreen
            onNotificationPress={(notificationId) =>
              console.log('Notification:', notificationId)
            }
            onMarkAllAsRead={() => {
              setNotificationCount(0);
              console.log('All marked as read');
            }}
          />
        );

      case 'profile':
        return (
          <ModernProfileScreen
            isOwnProfile={true}
            onEditPress={() => console.log('Edit profile')}
            onFollowPress={() => console.log('Follow')}
            onMessagePress={() => console.log('Message')}
            onSettingsPress={() => console.log('Settings')}
          />
        );

      default:
        return <ModernFeedScreen />;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>

      {/* TODO: Implement tab navigation. ModernBottomTabs component not found.
          For now, using simple touch-based tab switching would be needed here.
          Consider using React Navigation's BottomTabNavigator instead.
      */}
    </View>
  );
};

export const ModernApp = () => {
  return (
    <ThemeProvider>
      <RealtimeNotificationsProvider>
        <ModernAppContent />
      </RealtimeNotificationsProvider>
    </ThemeProvider>
  );
};

export default ModernApp;