import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../lib/api';

const ContextAuthentification = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((me) => setUser(me))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function signUp(email, password, displayName, role) {
    const createdUser = await authApi.signUp(email, password, displayName, role);
    setUser(createdUser);
  }

  async function signIn(email, password, _roleIgnored) {
    // Le rôle est stocké côté serveur; le select côté UI est informatif et ne doit pas casser la signature.
    const loggedUser = await authApi.signIn(email, password);
    setUser(loggedUser);
  }

  function signOut() {
    authApi.signOut();
    setUser(null);
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut
  };

  return <ContextAuthentification.Provider value={value}>{children}</ContextAuthentification.Provider>;
}

export function useAuth() {
  const ctx = useContext(ContextAuthentification);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé à l’intérieur de AuthProvider');
  }
  return ctx;
}

