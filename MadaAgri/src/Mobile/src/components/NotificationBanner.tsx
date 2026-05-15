import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Text,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, TYPOGRAPHY } from '../theme';

interface NotificationBannerProps {
  type: 'success' | 'error' | 'info' | 'warning' | 'collaboration' | 'follow';
  title: string;
  message: string;
  duration?: number;
  onDismiss?: () => void;
  onActionPress?: () => void;
  actionLabel?: string;
}

export const NotificationBanner = ({
  type = 'info',
  title,
  message,
  duration = 4000,
  onDismiss,
  onActionPress,
  actionLabel,
}: NotificationBannerProps) => {
  const { colors } = useTheme();
  const [slideAnim] = useState(new Animated.Value(-150));
  const [opacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return { bg: '#10b981', icon: 'check-circle' };
      case 'error':
        return { bg: '#ef4444', icon: 'alert-circle' };
      case 'warning':
        return { bg: '#f59e0b', icon: 'alert' };
      case 'collaboration':
        return { bg: '#f59e0b', icon: 'handshake' };
      case 'follow':
        return { bg: '#06b6d4', icon: 'plus-circle' };
      case 'info':
      default:
        return { bg: '#3b82f6', icon: 'information' };
    }
  };

  const { bg, icon } = getTypeColors();

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 999,
    },
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: bg,
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_DEFAULT,
      marginTop: SPACING.PADDING_DEFAULT,
      marginHorizontal: SPACING.PADDING_DEFAULT,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    },
    icon: {
      marginRight: SPACING.PADDING_DEFAULT,
    },
    content: {
      flex: 1,
    },
    title: {
      color: '#fff',
      fontSize: TYPOGRAPHY.body.fontSize,
      fontWeight: TYPOGRAPHY.subheading.fontWeight,
      marginBottom: 2,
    },
    message: {
      color: '#fff',
      fontSize: TYPOGRAPHY.caption.fontSize,
      opacity: 0.9,
    },
    actions: {
      flexDirection: 'row',
      gap: SPACING.PADDING_SMALL,
      marginLeft: SPACING.PADDING_DEFAULT,
    },
    actionButton: {
      paddingHorizontal: SPACING.PADDING_DEFAULT,
      paddingVertical: SPACING.PADDING_SMALL,
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 6,
    },
    actionText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600',
    },
    closeButton: {
      padding: SPACING.PADDING_SMALL,
      marginLeft: SPACING.PADDING_SMALL,
    },
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity,
        },
      ]}
    >
      <View style={styles.banner}>
        <MaterialCommunityIcons
          name={icon}
          size={24}
          color="#fff"
          style={styles.icon}
        />
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
        {onActionPress && actionLabel && (
          <Pressable style={styles.actionButton} onPress={onActionPress}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        )}
        <Pressable style={styles.closeButton} onPress={handleDismiss}>
          <MaterialCommunityIcons name="close" size={20} color="#fff" />
        </Pressable>
      </View>
    </Animated.View>
  );
};

export default NotificationBanner;
