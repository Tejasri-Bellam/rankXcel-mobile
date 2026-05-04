import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { UserProfile } from "@/types/auth";
import { setAuthStoreState } from "./authStore";

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  setCredentials: (user: UserProfile, token: string) => void;
  clearCredentials: () => void;
  setUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const INITIAL: AuthState = { user: null, token: null, isAuthenticated: false };

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [state, setState] = useState<AuthState>(INITIAL);

  const setCredentials = useCallback((user: UserProfile, token: string) => {
    const next: AuthState = { user, token, isAuthenticated: true };
    setAuthStoreState(next);
    setState(next);
  }, []);

  const clearCredentials = useCallback(() => {
    setAuthStoreState(INITIAL);
    setState(INITIAL);
  }, []);

  const setUser = useCallback((user: UserProfile) => {
    setState((prev) => {
      const next: AuthState = { ...prev, user };
      setAuthStoreState(next);
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, setCredentials, clearCredentials, setUser }),
    [state, setCredentials, clearCredentials, setUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
