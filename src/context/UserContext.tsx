// No-auth identity: a localStorage-backed "who are you?" switcher.
// Graders pick a demo persona (or type their own name) and switch freely.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setMockActorHint } from "../lib/apiClient";
import type { User } from "../lib/types";

const STORAGE_KEY = "skillswap_current_user_id";

interface UserContextValue {
  users: User[];
  currentUser: User | null;
  /** True until the user list has loaded once. */
  loading: boolean;
  selectUser: (id: number) => void;
  createAndSelectUser: (name: string) => Promise<User>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Number(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .listUsers()
      .then((list) => {
        if (cancelled) return;
        setUsers(list);
        // If the stored id no longer exists, fall back to the first user.
        setCurrentUserId((id) =>
          id && list.some((u) => u.id === id) ? id : (list[0]?.id ?? null),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectUser = useCallback((id: number) => {
    setCurrentUserId(id);
    localStorage.setItem(STORAGE_KEY, String(id));
  }, []);

  // Mock mode: lets the in-memory API check chat-thread access.
  useEffect(() => {
    setMockActorHint(currentUserId);
  }, [currentUserId]);

  const createAndSelectUser = useCallback(
    async (name: string) => {
      const user = await api.createUser(name);
      setUsers((list) => [...list, user]);
      selectUser(user.id);
      return user;
    },
    [selectUser],
  );

  const value = useMemo<UserContextValue>(
    () => ({
      users,
      currentUser: users.find((u) => u.id === currentUserId) ?? null,
      loading,
      selectUser,
      createAndSelectUser,
    }),
    [users, currentUserId, loading, selectUser, createAndSelectUser],
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUsers(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUsers must be used inside <UserProvider>");
  return ctx;
}
