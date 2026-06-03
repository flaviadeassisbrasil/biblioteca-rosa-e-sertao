import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { syncUserWithFirestore, loginWithGoogle, logout } from '../services/auth';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await syncUserWithFirestore(firebaseUser);
          setState({ user, loading: false, error: null });
        } catch {
          setState({ user: null, loading: false, error: 'Erro ao carregar usuário.' });
        }
      } else {
        setState({ user: null, loading: false, error: null });
      }
    });

    return unsubscribe;
  }, []);

  const handleLogin = async () => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await loginWithGoogle();
    } catch {
      setState(prev => ({ ...prev, error: 'Erro ao fazer login. Tente novamente.' }));
    }
  };

  const handleLogout = async () => {
    await logout();
    setState({ user: null, loading: false, error: null });
  };

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    loginWithGoogle: handleLogin,
    logout: handleLogout,
    isAdmin: state.user?.role === 'admin',
  };
};
