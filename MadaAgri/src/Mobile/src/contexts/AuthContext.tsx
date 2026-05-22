import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../lib/navigation';
import { login as apiLogin, register as apiRegister, logout as apiLogout, getProfile, loadTokenPersist, setToken as apiSetToken, getApiBaseUrl } from '../lib/api';
import socketService from '../services/socketService';
import type { User, AuthContextType } from './AuthContext.types';

const AuthContext = createContext<AuthContextType | null>(null);
const USER_STORAGE_KEY = '@madaagri_user_data';
const TOKEN_STORAGE_KEY = '@madaagri_token';

// Validation stricte des données utilisateur
const isValidUser = (user: any): user is User => {
  if (!user || typeof user !== 'object') return false;
  // Un utilisateur valide doit avoir au minimum un ID et un email
  return !!(user.id && user.email);
};

// Fusionner les données utilisateur en préservant les anciennes si les nouvelles sont incomplètes
const mergeUserData = (oldUser: User | null, newUser: User | null): User | null => {
  if (!newUser) return oldUser;
  if (!oldUser) return newUser;
  
  // Fusionner en gardant les anciennes valeurs si les nouvelles sont vides
  return {
    ...oldUser,
    ...newUser,
    // Préserver les champs critiques s'ils sont vides dans newUser
    name: newUser.name || oldUser.name,
    email: newUser.email || oldUser.email,
    id: newUser.id || oldUser.id,
    profile_picture: newUser.profile_picture || oldUser.profile_picture,
  };
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);
  const initRef = useRef(false);
  const userRef = useRef<User | null>(null); // Référence stable pour éviter les race conditions
  const savingRef = useRef(false); // Éviter les sauvegardes concurrentes

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Wrapper sécurisé pour setUser - valide et fusionne les données
  const setUser = useCallback((newUser: User | null) => {
    if (!isMountedRef.current) return;

    // Si on essaie de définir null ou undefined, vérifier qu'on a vraiment l'intention de déconnecter
    if (!newUser) {
      userRef.current = null;
      setUserState(null);
      return;
    }

    // Valider les données utilisateur
    if (!isValidUser(newUser)) {
      console.warn('[AuthContext] ⚠️ Invalid user data received, ignoring:', newUser);
      return;
    }

    // Fusionner avec les données existantes
    const mergedUser = mergeUserData(userRef.current, newUser);
    
    if (mergedUser && isValidUser(mergedUser)) {
      userRef.current = mergedUser;
      setUserState(mergedUser);
    } else {
      console.warn('[AuthContext] ⚠️ Merged user data is invalid');
    }
  }, []);

  // Sauvegarder l'utilisateur dans AsyncStorage (avec debounce)
  const saveUserToStorage = useCallback(async (userData: User | null) => {
    // Éviter les sauvegardes concurrentes
    if (savingRef.current) {
      return;
    }

    try {
      savingRef.current = true;
      
      if (userData && isValidUser(userData)) {
        const dataToSave = JSON.stringify(userData);
        await AsyncStorage.setItem(USER_STORAGE_KEY, dataToSave);
      } else if (userData === null) {
        await AsyncStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch (err) {
      console.error('[AuthContext] ❌ Error saving user:', err);
    } finally {
      savingRef.current = false;
    }
  }, []);

  // Sauvegarder automatiquement quand l'utilisateur change
  useEffect(() => {
    if (user) {
      saveUserToStorage(user);
    }
  }, [user, saveUserToStorage]);

  // Charger l'utilisateur depuis AsyncStorage
  const loadUserFromStorage = useCallback(async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (isValidUser(parsedUser)) {
          return parsedUser;
        } else {
          console.warn('[AuthContext] ⚠️ Invalid cached user, clearing');
          await AsyncStorage.removeItem(USER_STORAGE_KEY);
        }
      }
    } catch (err) {
      console.error('[AuthContext] ❌ Error loading user:', err);
    }
    return null;
  }, []);

  // Initialisation au démarrage
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    const initializeAuth = async () => {
      
      try {
        // 1. Charger le token
        const savedToken = await loadTokenPersist();
        
        if (!savedToken) {
          setLoading(false);
          return;
        }


        // 2. Charger l'utilisateur depuis le cache
        const cachedUser = await loadUserFromStorage();
        
        if (cachedUser && !cancelled && isMountedRef.current) {
          setUser(cachedUser);
          
          // Initialiser Socket.io
          try {
            const apiBase = getApiBaseUrl();
            await socketService.connect(apiBase, cachedUser.id);
          } catch (socketErr) {
            console.warn('[AuthContext] ⚠️ Socket.io connection failed:', socketErr);
          }
        }

        // 3. Rafraîchir depuis l'API en arrière-plan (sans bloquer l'UI)
        setTimeout(async () => {
          if (cancelled || !isMountedRef.current) return;
          
          try {
            const freshUser = await getProfile();
            
            if (!cancelled && isMountedRef.current) {
              if (isValidUser(freshUser)) {
                setUser(freshUser);
              } else {
                console.warn('[AuthContext] ⚠️ API returned invalid user, keeping cache');
              }
            }
          } catch (apiErr: unknown) {
            // En cas d'erreur API, on garde l'utilisateur en cache
            const errorMessage = apiErr instanceof Error ? apiErr.message : String(apiErr);
            console.warn('[AuthContext] ⚠️ API refresh failed, keeping cached user:', errorMessage);
            
            // Si c'est une erreur 401, le token est invalide
            const status = (apiErr as any)?.status;
            if (status === 401) {
              if (!cancelled && isMountedRef.current) {
                setUser(null);
                await AsyncStorage.removeItem(USER_STORAGE_KEY);
                await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
              }
            }
          }
        }, 100); // Petit délai pour ne pas bloquer l'UI

      } catch (err) {
        console.error('[AuthContext] ❌ Initialization error:', err);
        if (!cancelled && isMountedRef.current) {
          setUser(null);
        }
      } finally {
        if (!cancelled && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      cancelled = true;
    };
  }, [loadUserFromStorage, setUser]);

  const signUp = useCallback(async (email: string, password: string, name: string, role: string): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiRegister({ email, password, name, role });

      if (isMountedRef.current && response.user && isValidUser(response.user)) {
        setUser(response.user);
        await saveUserToStorage(response.user);
        
        // Initialiser Socket.io
        try {
          const apiBase = getApiBaseUrl();
          await socketService.connect(apiBase, response.user.id);
        } catch (socketErr) {
          console.warn('[AuthContext] ⚠️ Socket.io connection failed:', socketErr);
        }
        
        return response.user;
      } else {
        throw new Error('Invalid user data received from server');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[AuthContext] ❌ Signup error:', errorMessage);
      if (isMountedRef.current) {
        setError(errorMessage || 'Erreur lors de l\'inscription');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [setUser, saveUserToStorage]);

  const signIn = useCallback(async (email: string, password: string): Promise<User> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiLogin(email, password);

      if (isMountedRef.current && response.user && isValidUser(response.user)) {
        setUser(response.user);
        await saveUserToStorage(response.user);
        
        // Initialiser Socket.io
        try {
          const apiBase = getApiBaseUrl();
          await socketService.connect(apiBase, response.user.id);
        } catch (socketErr) {
          console.warn('[AuthContext] ⚠️ Socket.io connection failed:', socketErr);
        }
        
        return response.user;
      } else {
        throw new Error('Invalid user data received from server');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[AuthContext] ❌ Login error:', errorMessage);
      if (isMountedRef.current) {
        setError(errorMessage || 'Erreur lors de la connexion');
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [setUser, saveUserToStorage]);

  const signOut = useCallback(async () => {
    try {
      
      // Déconnecter Socket.io
      socketService.disconnect();
      
      await apiLogout();
    } catch (err) {
      console.error('[AuthContext] ⚠️ Logout API error (continuing anyway):', err);
    } finally {
      if (isMountedRef.current) {
        setUser(null);
        setError(null);
        await saveUserToStorage(null);
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, [setUser, saveUserToStorage]);

  const refreshUser = useCallback(async (): Promise<void> => {
    // Ne pas rafraîchir si pas d'utilisateur connecté
    if (!userRef.current) {
      return;
    }

    try {
      const freshUser = await getProfile();
      
      if (isMountedRef.current && isValidUser(freshUser)) {
        setUser(freshUser);
        await saveUserToStorage(freshUser);
      } else {
        console.warn('[AuthContext] ⚠️ Invalid user data received, keeping current user');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[AuthContext] ❌ Refresh error:', errorMessage);
      // Ne pas déconnecter l'utilisateur en cas d'erreur réseau
      const status = (err as any)?.status;
      if (status === 401) {
        await signOut();
      }
    }
  }, [setUser, saveUserToStorage, signOut]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    refreshUser,
    clearError,
    isAuthenticated: !!user && isValidUser(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
