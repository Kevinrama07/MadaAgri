import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../contexts/ThemeContext';
import { BORDER_RADIUS } from '../theme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'store', title: 'Marketplace', desc: 'Vendez vos produits', color: '#22c55e' },
  { icon: 'account-group', title: 'Communauté', desc: 'Partagez vos expériences', color: '#8B5CF6' },
  { icon: 'chart-line', title: 'Optimisation', desc: 'Améliorez vos rendements', color: '#4A90E2' },
];

export default function LandingScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback((navigateTo: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
    ]).start();
    setTimeout(() => navigation.navigate(navigateTo), 120);
  }, [navigation, buttonScale]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
        style={[StyleSheet.absoluteFill, styles.background]}
      >
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <Animated.ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        >
          <View style={styles.logoSection}>
            <View style={styles.logoGlow}>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../assets/logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
            </View>
            <Text style={styles.appName}>MadaAgri</Text>
            <View style={[styles.tagline, { backgroundColor: colors.glass }]}>
              <MaterialCommunityIcons name="leaf" size={18} color="#15803d" />
              <Text style={styles.taglineText}>Agriculture Intelligente</Text>
            </View>
          </View>

          <View style={styles.featuresContainer}>
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} index={i} />
            ))}
          </View>

          <View style={[styles.statsContainer, { backgroundColor: colors.glass, borderColor: colors.glassBorder, borderWidth: StyleSheet.hairlineWidth }]}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>500+</Text>
              <Text style={styles.statLabel}>Agriculteurs</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>1000+</Text>
              <Text style={styles.statLabel}>Produits</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>50+</Text>
              <Text style={styles.statLabel}>Régions</Text>
            </View>
          </View>

          <View style={[styles.buttonsContainer, { paddingBottom: Math.max(insets.bottom, 40) + 60 }]}>
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                style={styles.buttonPrimary}
                onPress={() => handlePress('Login')}
                activeOpacity={0.95}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonPrimaryText}>Se connecter</Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => handlePress('Signup')}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonSecondaryText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        </Animated.ScrollView>
      </LinearGradient>
    </View>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  desc: string;
  color: string;
  index: number;
}

const FeatureCard = React.memo(({ icon, title, desc, color, index }: FeatureCardProps) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 120, delay: index * 120, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, delay: index * 120, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.featureCard, { opacity: opacityAnim, transform: [{ scale: scaleAnim }], backgroundColor: 'rgba(255,255,255,0.85)' }]}>
      <LinearGradient
        colors={[color, color + 'cc']}
        style={styles.featureIconContainer}
      >
        <MaterialCommunityIcons name={icon as any} size={28} color="#fff" />
      </LinearGradient>
      <Text style={[styles.featureTitle, { color }]}>{title}</Text>
      <Text style={styles.featureDesc}>{desc}</Text>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.08,
  },
  circle1: {
    width: 300,
    height: 300,
    backgroundColor: '#16a34a',
    top: -100,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: '#22c55e',
    bottom: 100,
    left: -50,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: '#15803d',
    top: '40%',
    right: -30,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  logoGlow: {
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
  logoContainer: {
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: -1,
    marginTop: 16,
    marginBottom: 8,
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taglineText: {
    color: '#15803d',
    fontSize: 14,
    fontWeight: '700',
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  featureCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-around',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16a34a',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
  },
  buttonsContainer: {
    gap: 12,
    paddingTop: 24,
  },
  buttonPrimary: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  gradientButton: {
    flexDirection: 'row',
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonPrimaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16a34a',
  },
  buttonSecondaryText: {
    color: '#16a34a',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
