import { useCallback, useEffect, useState } from 'react';
import { tokenStore } from '../services/api';
import { usersApi } from '../services/users.api';
import { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

/** Owns the session: loads the current user from the stored JWT. */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: !!tokenStore.get(),
  });

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setState({ user: null, loading: false, isAuthenticated: false });
      return;
    }
    try {
      const { user } = await usersApi.me();
      setState({ user, loading: false, isAuthenticated: true });
    } catch {
      tokenStore.clear();
      setState({ user: null, loading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ user: null, loading: false, isAuthenticated: false });
  }, []);

  return { ...state, refresh, logout };
}
