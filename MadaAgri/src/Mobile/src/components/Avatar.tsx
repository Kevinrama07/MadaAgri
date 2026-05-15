import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';

interface AvatarProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  source?: { uri: string } | number;
  initials?: string;
  status?: 'online' | 'offline' | 'away' | 'none';
  badge?: string;
}

const sizeMaps = {
  small: { size: 32, fontSize: 12 },
  medium: { size: 40, fontSize: 14 },
  large: { size: 56, fontSize: 18 },
  xlarge: { size: 80, fontSize: 24 },
};

export const Avatar = ({
  size = 'medium',
  source,
  initials = 'MA',
  status = 'none',
}: AvatarProps) => {
  const { colors } = useTheme();
  const { size: containerSize, fontSize } = sizeMaps[size];

  const statusColors = {
    online: colors.success,
    offline: colors.textTertiary,
    away: colors.warning,
    none: 'transparent',
  };

  const styles = StyleSheet.create({
    container: {
      width: containerSize,
      height: containerSize,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: colors.primaryPale,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    },
    image: {
      width: '100%',
      height: '100%',
      borderRadius: BORDER_RADIUS.AVATAR,
    },
    initials: {
      fontSize,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    statusIndicator: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: containerSize * 0.35,
      height: containerSize * 0.35,
      borderRadius: BORDER_RADIUS.AVATAR,
      backgroundColor: statusColors[status],
      borderWidth: 2,
      borderColor: colors.card,
    },
  });

  return (
    <View style={styles.container}>
      {source ? (
        <Image source={source} style={styles.image} />
      ) : (
        <Text style={styles.initials}>{initials.substring(0, 2).toUpperCase()}</Text>
      )}
      {status !== 'none' && <View style={styles.statusIndicator} />}
    </View>
  );
};

export default Avatar;
