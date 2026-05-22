import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../theme';
import * as Haptics from 'expo-haptics';

export default function LoginScreen({ navigation }: any) {
  const { signIn, loading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -8, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 40, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!email.trim()) { setEmailError('Email requis'); hasError = true; }
    else if (!validateEmail(email)) { setEmailError('Email invalide'); hasError = true; }
    if (!password) { setPasswordError('Mot de passe requis'); hasError = true; }
    else if (password.length < 6) { setPasswordError('Minimum 6 caracteres'); hasError = true; }

    if (hasError) { shakeError(); return; }

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.94, duration: 80, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
    ]).start();

    try {
      await signIn(email, password);
    } catch (error: any) {
      shakeError();
      const errorMessage = error.message || '';
      const errorStatus = error.status || 0;
      const errorResponse = error.response || {};

      if (errorStatus === 401 || errorMessage.includes('Mot de passe') || errorResponse.error === 'Mot de passe ou identifiant incorrect') {
        setError('Email ou mot de passe incorrect');
      } else if (errorMessage.includes('Network') || errorMessage.includes('timeout') || error.code === 'NETWORK_ERROR') {
        setError('Erreur reseau. Verifiez votre connexion');
      } else if (errorMessage.includes('User not found')) {
        setError('Aucun compte trouve avec cet email');
      } else {
        setError(errorMessage || 'Erreur de connexion');
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
        style={StyleSheet.absoluteFill}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + SPACING.XL }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); navigation.goBack(); }}
            >
              <Ionicons name="arrow-back" size={22} color={colors.primary} />
            </TouchableOpacity>

            <View style={[styles.card, { backgroundColor: colors.glassDarker, borderColor: colors.glassBorder }]}>
              <View style={styles.header}>
                <LinearGradient colors={['#22c55e', '#16a34a']} style={styles.iconContainer}>
                  <MaterialCommunityIcons name="leaf" size={28} color="#fff" />
                </LinearGradient>
                <Text style={[styles.title, { color: colors.text }]}>Bon retour !</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Connectez-vous a votre compte</Text>
              </View>

              {error ? (
                <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </Animated.View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Email</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: colors.primaryBackground, borderColor: emailError ? colors.error : colors.border },
                  emailError && { backgroundColor: '#fef2f2' },
                ]}>
                  <MaterialCommunityIcons name="email-outline" size={20} color={emailError ? colors.error : colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="votre@email.com"
                    placeholderTextColor={colors.placeholder}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setEmailError(''); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emailError ? <Text style={[styles.fieldError, { color: colors.error }]}>{emailError}</Text> : null}
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Mot de passe</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: colors.primaryBackground, borderColor: passwordError ? colors.error : colors.border },
                  passwordError && { backgroundColor: '#fef2f2' },
                ]}>
                  <MaterialCommunityIcons name="lock-outline" size={20} color={passwordError ? colors.error : colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.placeholder}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setPasswordError(''); setError(''); }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={[styles.fieldError, { color: colors.error }]}>{passwordError}</Text> : null}
              </View>

              <TouchableOpacity style={styles.forgotContainer}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Mot de passe oublie ?</Text>
              </TouchableOpacity>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity style={[styles.loginButton, { shadowColor: colors.primary }]} onPress={handleLogin} disabled={loading} activeOpacity={0.95}>
                  <LinearGradient colors={['#22c55e', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                    <Text style={styles.loginButtonText}>{loading ? 'Connexion...' : 'Se connecter'}</Text>
                    <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              <View style={styles.dividerContainer}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.textTertiary }]}>ou</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.socialContainer}>
                {['google', 'facebook', 'apple'].map((s) => (
                  <TouchableOpacity key={s} style={[styles.socialButton, { backgroundColor: colors.primaryBackground, borderColor: colors.border }]}>
                    <MaterialCommunityIcons name={s as any} size={22} color={s === 'google' ? '#DB4437' : s === 'facebook' ? '#1877F2' : colors.text} />
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.signupContainer}>
                <Text style={[styles.signupText, { color: colors.textSecondary }]}>Pas encore de compte ? </Text>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); navigation.navigate('Signup'); }}>
                  <Text style={[styles.signupLink, { color: colors.primary }]}>S'inscrire</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: SPACING.XXL },
  backButton: {
    width: 44, height: 44, borderRadius: BORDER_RADIUS.DEFAULT,
    justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.XXL,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 5,
  },
  card: {
    borderRadius: BORDER_RADIUS.XL, padding: SPACING.XXL,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#16a34a', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
  },
  header: { alignItems: 'center', marginBottom: SPACING.XXXL },
  iconContainer: { width: 60, height: 60, borderRadius: BORDER_RADIUS.LG, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.LG },
  title: { fontSize: 28, fontWeight: '800', marginBottom: SPACING.SM },
  subtitle: { fontSize: 15, fontWeight: '500' },
  inputGroup: { marginBottom: SPACING.XL },
  label: { fontSize: 14, fontWeight: '700', marginBottom: SPACING.SM },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BORDER_RADIUS.MD,
    borderWidth: 2,
    paddingHorizontal: SPACING.LG, paddingVertical: 14, gap: SPACING.MD,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  forgotContainer: { alignItems: 'flex-end', marginBottom: SPACING.XXL },
  forgotText: { fontSize: 14, fontWeight: '600' },
  loginButton: { borderRadius: BORDER_RADIUS.LG, overflow: 'hidden', marginBottom: SPACING.XXL, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  gradientButton: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center', gap: SPACING.SM },
  loginButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.XXL, gap: SPACING.MD },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '600' },
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.MD, marginBottom: SPACING.XXL },
  socialButton: { width: 52, height: 52, borderRadius: BORDER_RADIUS.MD, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  signupText: { fontSize: 15 },
  signupLink: { fontSize: 15, fontWeight: '700' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: BORDER_RADIUS.DEFAULT, padding: SPACING.LG, marginBottom: SPACING.XL, gap: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, fontSize: 14, fontWeight: '600' },
  fieldError: { fontSize: 12, marginTop: 6, marginLeft: 4, fontWeight: '500' },
});
