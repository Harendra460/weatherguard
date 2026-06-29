import { useCallback, useEffect, useState } from 'react';
import { tokenStore } from '../services/api';
import { usersApi } from '../services/users.api';

interface AuthState {
  loading: boolean;
  isAuthenticated: boolean;
}

/** Owns the session: validates the stored JWT so routing knows if we're signed in. */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    loading: true,
    isAuthenticated: !!tokenStore.get(),
  });

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setState({ loading: false, isAuthenticated: false });
      return;
    }
    try {
      await usersApi.me();
      setState({ loading: false, isAuthenticated: true });
    } catch {
      tokenStore.clear();
      setState({ loading: false, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const logout = useCallback(() => {
    tokenStore.clear();
    setState({ loading: false, isAuthenticated: false });
  }, []);

  return { ...state, refresh, logout };
}
