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

export default function SignupScreen({ navigation }: any) {
  const { signUp, loading } = useAuth();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'client' | 'farmer'>('client');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [nameError, setNameError] = useState('');
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

  const handleRoleSelect = (r: 'farmer' | 'client') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setRole(r);
  };

  const handleSignup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setError('');
    setNameError('');
    setEmailError('');
    setPasswordError('');

    let hasError = false;
    if (!name.trim()) { setNameError('Nom requis'); hasError = true; }
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
      await signUp(name, email, password, role);
    } catch (error: any) {
      shakeError();
      setError(error.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f0fdf4', '#dcfce7', '#bbf7d0']} style={StyleSheet.absoluteFill}>
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
                  <MaterialCommunityIcons name="account-plus" size={28} color="#fff" />
                </LinearGradient>
                <Text style={[styles.title, { color: colors.text }]}>Creer un compte</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Rejoignez MadaAgri aujourd'hui</Text>
              </View>

              <View style={styles.roleContainer}>
                <Text style={[styles.roleLabel, { color: colors.primary }]}>Type de compte</Text>
                <View style={styles.roleButtons}>
                  {(['farmer', 'client'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[
                        styles.roleButton,
                        { backgroundColor: colors.primaryBackground, borderColor: colors.border },
                        role === r && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                      onPress={() => handleRoleSelect(r)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name={r === 'farmer' ? 'tractor' : 'account'}
                        size={20}
                        color={role === r ? '#fff' : colors.primary}
                      />
                      <Text style={[
                        styles.roleButtonText,
                        { color: colors.textSecondary },
                        role === r && { color: '#fff' },
                      ]}>
                        {r === 'farmer' ? 'Agriculteur' : 'Client'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {error ? (
                <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                  <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </Animated.View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.primary }]}>Nom complet</Text>
                <View style={[
                  styles.inputContainer,
                  { backgroundColor: colors.primaryBackground, borderColor: nameError ? colors.error : colors.border },
                  nameError && { backgroundColor: '#fef2f2' },
                ]}>
                  <MaterialCommunityIcons name="account-outline" size={20} color={nameError ? colors.error : colors.primary} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Votre nom"
                    placeholderTextColor={colors.placeholder}
                    value={name}
                    onChangeText={(t) => { setName(t); setNameError(''); setError(''); }}
                  />
                </View>
                {nameError ? <Text style={[styles.fieldError, { color: colors.error }]}>{nameError}</Text> : null}
              </View>

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
                {passwordError ? (
                  <Text style={[styles.fieldError, { color: colors.error }]}>{passwordError}</Text>
                ) : (
                  <Text style={[styles.passwordHint, { color: colors.textTertiary }]}>Minimum 6 caracteres, majuscule et minuscule</Text>
                )}
              </View>

              <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                <TouchableOpacity style={[styles.signupButton, { shadowColor: colors.primary }]} onPress={handleSignup} disabled={loading} activeOpacity={0.95}>
                  <LinearGradient colors={['#22c55e', '#16a34a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>
                    <Text style={styles.signupButtonText}>{loading ? 'Inscription...' : "S'inscrire"}</Text>
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

              <View style={styles.loginContainer}>
                <Text style={[styles.loginText, { color: colors.textSecondary }]}>Deja un compte ? </Text>
                <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}); navigation.navigate('Login'); }}>
                  <Text style={[styles.loginLink, { color: colors.primary }]}>Se connecter</Text>
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
  header: { alignItems: 'center', marginBottom: SPACING.XXL },
  iconContainer: { width: 60, height: 60, borderRadius: BORDER_RADIUS.LG, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.LG },
  title: { fontSize: 28, fontWeight: '800', marginBottom: SPACING.SM },
  subtitle: { fontSize: 15, fontWeight: '500' },
  roleContainer: { marginBottom: SPACING.XL },
  roleLabel: { fontSize: 14, fontWeight: '700', marginBottom: SPACING.MD },
  roleButtons: { flexDirection: 'row', gap: SPACING.MD },
  roleButton: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 14, borderRadius: BORDER_RADIUS.MD,
    borderWidth: 2, gap: SPACING.SM,
  },
  roleButtonText: { fontSize: 13, fontWeight: '600' },
  inputGroup: { marginBottom: SPACING.LG },
  label: { fontSize: 14, fontWeight: '700', marginBottom: SPACING.SM },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: BORDER_RADIUS.MD, borderWidth: 2, paddingHorizontal: SPACING.LG, gap: SPACING.MD,
  },
  input: { flex: 1, fontSize: 16, fontWeight: '500' },
  signupButton: { borderRadius: BORDER_RADIUS.LG, overflow: 'hidden', marginBottom: SPACING.XL, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  gradientButton: { flexDirection: 'row', padding: 18, alignItems: 'center', justifyContent: 'center', gap: SPACING.SM },
  signupButtonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.XL, gap: SPACING.MD },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: '600' },
  socialContainer: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.MD, marginBottom: SPACING.XL },
  socialButton: { width: 52, height: 52, borderRadius: BORDER_RADIUS.MD, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { fontSize: 15 },
  loginLink: { fontSize: 15, fontWeight: '700' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', borderRadius: BORDER_RADIUS.DEFAULT, padding: SPACING.LG, marginBottom: SPACING.XL, gap: 10, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, fontSize: 14, fontWeight: '600' },
  fieldError: { fontSize: 12, marginTop: 6, marginLeft: 4, fontWeight: '500' },
  passwordHint: { fontSize: 12, marginTop: 6, marginLeft: 4 },
});
