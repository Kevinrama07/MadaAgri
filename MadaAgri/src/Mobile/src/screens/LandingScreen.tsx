import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function LandingScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      {/* Background avec gradient vert */}
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
        style={styles.background}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <View style={styles.content}>
          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image 
                source={require('../assets/logo.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appName}>Mada Agri</Text>
            <View style={styles.tagline}>
              <MaterialCommunityIcons name="leaf" size={18} color="#15803d" />
              <Text style={styles.taglineText}>Agriculture Intelligente</Text>
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.featureIconContainer}
              >
                <MaterialCommunityIcons name="store" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Marketplace</Text>
              <Text style={styles.featureDesc}>Vendez vos produits </Text>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.featureIconContainer}
              >
                <MaterialCommunityIcons name="account-group" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Communauté</Text>
              <Text style={styles.featureDesc}>Partagez vos expériences</Text>
            </View>

            <View style={styles.featureCard}>
              <LinearGradient
                colors={['#22c55e', '#16a34a']}
                style={styles.featureIconContainer}
              >
                <MaterialCommunityIcons name="chart-line" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.featureTitle}>Optimisation</Text>
              <Text style={styles.featureDesc}>Améliorez vos rendements</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
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
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.buttonPrimary}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.9}
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

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonSecondaryText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    position: 'relative',
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
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
  content: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 20,
  },
  logo: {
    width: 150,
    height: 150,
  },
  appName: {
    fontSize: 42,
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: -1,
    marginBottom: 8,
  },
  tagline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    backgroundColor: '#fff',
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
    color: '#15803d',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
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
    backgroundColor: '#fff',
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
  footer: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
  },
});
