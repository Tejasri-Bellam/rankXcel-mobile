/**
 * Module-level auth store for non-React code (axios interceptors, service files).
 * The AuthContext provider syncs React state into this store on every change,
 * so `getAuthState()` always returns the latest values.
 */
import type { UserProfile } from "@/types/auth";

interface AuthStoreState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
}

let state: AuthStoreState = {
  user: null,
  token: null,
  isAuthenticated: false,
};

export function getAuthState(): AuthStoreState {
  return state;
}

export function setAuthStoreState(next: AuthStoreState): void {
  state = next;
}
