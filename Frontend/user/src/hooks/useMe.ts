import { useCallback, useEffect, useState } from 'react';
import { usersApi } from '../services/users.api';
import { MeResponse } from '../types';

/**
 * Loads the signed-in user's record + Telegram deep link. Refetches on window
 * focus so returning from the Telegram app reflects the freshly-linked chat.
 */
export function useMe() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setMe(await usersApi.me());
    } catch {
      setError('Failed to load your account.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
    const onFocus = () => void reload();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [reload]);

  return { me, loading, error, reload };
}
