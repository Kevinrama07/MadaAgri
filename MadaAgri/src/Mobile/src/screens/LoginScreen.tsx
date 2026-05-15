import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }: any) {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const shakeAnimation = new Animated.Value(0);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const shakeError = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleLogin = async () => {
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validation
    let hasError = false;
    if (!email.trim()) {
      setEmailError('Email requis');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Email invalide');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Mot de passe requis');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Minimum 6 caractères');
      hasError = true;
    }

    if (hasError) {
      shakeError();
      return;
    }

    try {
      await signIn(email, password);
    } catch (error: any) {
      shakeError();
      console.log('[LoginScreen] Error caught:', error);
      
      const errorMessage = error.message || '';
      const errorStatus = error.status || 0;
      const errorResponse = error.response || {};
      
      // Messages d'erreur personnalisés
      if (errorStatus === 401 || errorMessage.includes('Mot de passe ou identifiant incorrect') || errorResponse.error === 'Mot de passe ou identifiant incorrect') {
        setError('Email ou mot de passe incorrect');
      } else if (errorMessage.includes('Network') || errorMessage.includes('timeout') || error.code === 'NETWORK_ERROR') {
        setError('Erreur réseau. Vérifiez votre connexion');
      } else if (errorMessage.includes('User not found')) {
        setError('Aucun compte trouvé avec cet email');
      } else {
        setError(errorMessage || 'Erreur de connexion');
      }
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#f0fdf4', '#dcfce7', '#bbf7d0']}
        style={styles.background}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Back Button */}
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#15803d" />
            </TouchableOpacity>

            {/* Card */}
            <View style={styles.card}>
              {/* Header */}
              <View style={styles.header}>
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.iconContainer}
                >
                  <MaterialCommunityIcons name="leaf" size={32} color="#fff" />
                </LinearGradient>
                <Text style={styles.title}>Bon retour !</Text>
                <Text style={styles.subtitle}>Connectez-vous à votre compte</Text>
              </View>

              {/* Error Message */}
              {error ? (
                <Animated.View style={[styles.errorContainer, { transform: [{ translateX: shakeAnimation }] }]}>
                  <MaterialCommunityIcons name="alert-circle" size={20} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </Animated.View>
              ) : null}

              {/* Email Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <View style={[styles.inputContainer, emailError && styles.inputContainerError]}>
                  <MaterialCommunityIcons 
                    name="email-outline" 
                    size={20} 
                    color={emailError ? '#dc2626' : '#16a34a'} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="votre@email.com"
                    placeholderTextColor="#94a3b8"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      setEmailError('');
                      setError('');
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                {emailError ? (
                  <Text style={styles.fieldError}>{emailError}</Text>
                ) : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mot de passe</Text>
                <View style={[styles.inputContainer, passwordError && styles.inputContainerError]}>
                  <MaterialCommunityIcons 
                    name="lock-outline" 
                    size={20} 
                    color={passwordError ? '#dc2626' : '#16a34a'} 
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                      setError('');
                    }}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons 
                      name={showPassword ? "eye-off-outline" : "eye-outline"} 
                      size={20} 
                      color="#64748b" 
                    />
                  </TouchableOpacity>
                </View>
                {passwordError ? (
                  <Text style={styles.fieldError}>{passwordError}</Text>
                ) : null}
              </View>

              <TouchableOpacity style={styles.forgotContainer}>
                <Text style={styles.forgotText}>
                  Mot de passe oublié ?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Text>
                  <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>ou</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton}>
                  <MaterialCommunityIcons name="google" size={22} color="#DB4437" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <MaterialCommunityIcons name="facebook" size={22} color="#1877F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton}>
                  <MaterialCommunityIcons name="apple" size={22} color="#000" />
                </TouchableOpacity>
              </View>

              {/* Sign Up Link */}
              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Pas encore de compte ? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                  <Text style={styles.signupLink}>S'inscrire</Text>
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
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.1,
  },
  circle1: {
    width: 250,
    height: 250,
    backgroundColor: '#16a34a',
    top: -80,
    right: -80,
  },
  circle2: {
    width: 180,
    height: 180,
    backgroundColor: '#22c55e',
    bottom: -50,
    left: -60,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 28,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#15803d',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '500',
  },
  forgotContainer: {
    alignItems: 'flex-end',
    marginBottom: 24,
  },
  forgotText: {
    color: '#16a34a',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 24,
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
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    color: '#64748b',
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#dc2626',
    fontWeight: '600',
  },
  inputContainerError: {
    borderColor: '#dc2626',
    backgroundColor: '#fef2f2',
  },
  fieldError: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 6,
    marginLeft: 4,
    fontWeight: '500',
  },
});
