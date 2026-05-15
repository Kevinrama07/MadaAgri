import React, { useMemo } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS, TYPOGRAPHY } from '../theme';

type AvatarSize = 'small' | 'medium' | 'large' | 'xlarge';

interface ModernAvatarProps {
  source?: { uri: string } | number;
  initials?: string;
  size?: AvatarSize;
  onPress?: () => void;
  status?: 'online' | 'offline' | 'away';
  badge?: string | number;
  style?: ViewStyle;
}

export const ModernAvatar = ({
  source,
  initials,
  size = 'medium',
  onPress,
  status,
  badge,
  style,
}: ModernAvatarProps) => {
  const { colors } = useTheme();

  const sizeConfig = {
    small: { size: 32, fontSize: 12 },
    medium: { size: 40, fontSize: 14 },
    large: { size: 56, fontSize: 16 },
    xlarge: { size: 80, fontSize: 20 },
  };

  const config = sizeConfig[size];

  const styles = useMemo(() => {
    return StyleSheet.create({
      container: {
        position: 'relative',
        width: config.size,
        height: config.size,
      },
      avatar: {
        width: config.size,
        height: config.size,
        borderRadius: BORDER_RADIUS.AVATAR,
        backgroundColor: colors.primaryBackground,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
      },
      image: {
        width: '100%',
        height: '100%',
      },
      initials: {
        fontSize: config.fontSize,
        fontWeight: TYPOGRAPHY.h3.fontWeight,
        color: colors.primary,
      },
      statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: config.size * 0.35,
        height: config.size * 0.35,
        borderRadius: BORDER_RADIUS.AVATAR,
        borderWidth: 2,
        borderColor: colors.card,
      },
      badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.error,
        borderRadius: BORDER_RADIUS.AVATAR,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.card,
      },
      badgeText: {
        color: colors.WHITE,
        fontSize: TYPOGRAPHY.caption.fontSize,
        fontWeight: TYPOGRAPHY.captionBold.fontWeight,
      },
    });
  }, [config, colors]);

  const statusColor = {
    online: colors.success,
    offline: colors.textTertiary,
    away: colors.warning,
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[styles.container, style]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.avatar}>
        {source ? (
          <Image source={source} style={styles.image} />
        ) : (
          <Text style={styles.initials}>{initials || 'U'}</Text>
        )}
      </View>

      {status && (
        <View
          style={[
            styles.statusIndicator,
            { backgroundColor: statusColor[status] },
          ]}
        />
      )}

      {badge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {typeof badge === 'number' && badge > 9 ? '9+' : badge}
          </Text>
        </View>
      )}
    </Component>
  );
};

export default ModernAvatar;
