import { useCallback, useEffect, useState } from 'react';
import { usersApi } from '../services/users.api';
import { User, UserStatus } from '../types';

/** Data + mutations for the admin user table. */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await usersApi.listAll());
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const decide = useCallback(
    async (id: string, decision: UserStatus.APPROVED | UserStatus.REJECTED) => {
      setBusyId(id);
      try {
        const updated = await usersApi.decide(id, decision);
        setUsers((prev) => prev.map((u) => (u._id === id ? updated : u)));
      } finally {
        setBusyId(null);
      }
    },
    [],
  );

  const pendingCount = users.filter((u) => u.status === UserStatus.PENDING).length;

  return { users, loading, error, busyId, pendingCount, reload: load, decide };
}
