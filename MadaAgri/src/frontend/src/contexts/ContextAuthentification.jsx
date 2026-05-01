import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { authApi } from '../lib/api';

const ContextAuthentification = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Ref pour tracker si le composant est monté
  const isMountedRef = useRef(true);
  // Ref pour empêcher double-exécution en StrictMode
  const initRef = useRef(false);

  useEffect(() => {
    // Cleanup pour marquer le composant comme démonté
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // StrictMode guard: ne lancer l'init qu'une fois même en StrictMode
    if (initRef.current) {
      return;
    }
    initRef.current = true;

    let cancelled = false;

    // Initialiser l'auth
    const initializeAuth = async () => {
      try {
        
        const me = await authApi.me();
        
        // Vérifier que le composant n'a pas été démonté et que la requête n'a pas été annulée
        if (!cancelled && isMountedRef.current) {
          setUser(me);
          setError(null);
        }
      } catch (err) {
        if (!cancelled && isMountedRef.current) {
          setUser(null);
          // Afficher une erreur seulement si ce n'est pas une erreur d'authentification
          if (err.message !== 'Unauthorized' && !err.message.includes('401') && !err.message.includes('Unauthorized')) {
            setError(err.message);
          } else {
          }
        }
      } finally {
        // IMPORTANT: Toujours terminer le loading
        if (!cancelled && isMountedRef.current) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Cleanup pour annuler la requête si le composant est démonté
    return () => {
      cancelled = true;
    };
  }, []);
  async function signUp(email, password, displayName, role) {
    try {
      setLoading(true);
      setError(null);
      const createdUser = await authApi.signUp(email, password, displayName, role);
      
      if (isMountedRef.current) {
        setUser(createdUser);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  async function signIn(email, password, _roleIgnored) {
    try {
      setLoading(true);
      setError(null);
      const loggedUser = await authApi.signIn(email, password);
      if (isMountedRef.current) {
        setUser(loggedUser);
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err.message);
      }
      throw err;
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }

  function signOut() {
    authApi.signOut();
    
    if (isMountedRef.current) {
      setUser(null);
      setError(null);
    }
  }

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut
  };

  return <ContextAuthentification.Provider value={value}>{children}</ContextAuthentification.Provider>;
}

export function useAuth() {
  const ctx = useContext(ContextAuthentification);
  if (!ctx) {
    // Retourner une valeur par défaut au lieu de lever une erreur
    console.warn('[useAuth] Context pas encore disponible, retour valeur par défaut');
    return {
      user: null,
      loading: true,
      error: null,
      signUp: async () => { throw new Error('AuthProvider pas prêt'); },
      signIn: async () => { throw new Error('AuthProvider pas prêt'); },
      signOut: () => {}
    };
  }
  return ctx;
}
