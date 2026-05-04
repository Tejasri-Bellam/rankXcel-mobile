import { useCallback, useState } from "react";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import {
  storageGetAccessToken,
  storageGetUser,
  storageSetAccessToken,
  storageSetUser,
} from "@/libs/utils/storage";
import { useAuthContext } from "@/libs/context/AuthContext";
import { resetSessionExpiry } from "@/libs/api/sessionExpiry";
import { registerPushToken } from "@/libs/services/notifications/pushNotificationService";
import {
  login as loginRequest,
  register as registerRequest,
  logout as logoutRequest,
  googleAuth as googleAuthRequest,
  meriPehchaanAuth as meriPehchaanAuthRequest,
  resendVerificationEmail,
  getProfile,
} from "@/libs/services/auth/authService";
import type {
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from "@/types/auth";
import type { ApiError } from "@/types/api";

interface UseAuthReturn {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  googleAuth: (idToken: string) => Promise<void>;
  meriPehchaanAuth: (authorizationCode: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const { user, token, isAuthenticated, setCredentials, clearCredentials } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleAuthSuccess = useCallback(
    async (authUser: UserProfile, authToken: string) => {
      await storageSetAccessToken(authToken);
      await storageSetUser(authUser);
      setCredentials(authUser, authToken);
      resetSessionExpiry();
      registerPushToken().catch(() => {});
    },
    [setCredentials]
  );

  const login = useCallback(
    async (data: LoginRequest): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await loginRequest(data);
        await handleAuthSuccess(response.data.user, response.data.token);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const register = useCallback(
    async (data: RegisterRequest): Promise<void> => {
      setIsLoading(true);
      try {
        await registerRequest(data);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const logout = useCallback(async (): Promise<void> => {
    // Clear local state immediately — don't wait for server
    await storageSetAccessToken("");
    await storageSetUser(null);
    // Flipping isAuthenticated to false triggers the (tabs) layout's auth gate
    // which redirects to /(auth)/login. No manual navigation needed.
    clearCredentials();
    try { await GoogleSignin.signOut(); } catch { /* no Google session — safe to ignore */ }
    // Server logout in background — non-blocking
    logoutRequest().catch(() => {});
  }, [clearCredentials]);

  const googleAuth = useCallback(
    async (idToken: string): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await googleAuthRequest({ id_token: idToken });
        await handleAuthSuccess(response.data.user, response.data.token);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const meriPehchaanAuth = useCallback(
    async (authorizationCode: string): Promise<void> => {
      setIsLoading(true);
      try {
        const response = await meriPehchaanAuthRequest({
          authorization_code: authorizationCode,
        });
        await handleAuthSuccess(response.data.user, response.data.token);
      } finally {
        setIsLoading(false);
      }
    },
    [handleAuthSuccess]
  );

  const resendVerification = useCallback(async (): Promise<void> => {
    await resendVerificationEmail();
  }, []);

  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      const response = await getProfile();
      const updatedUser = response.data;
      await storageSetUser(updatedUser);
      setCredentials(updatedUser, token ?? "");
    } catch {
      // silent — profile refresh is non-critical
    }
  }, [setCredentials, token]);

  const restoreSession = useCallback(async (): Promise<void> => {
    try {
      const storedToken = await storageGetAccessToken();
      const storedUser = await storageGetUser<UserProfile>();
      if (!storedToken || !storedUser) return;

      // Optimistically restore so UI renders immediately
      setCredentials(storedUser, storedToken);

      // Verify the token is still valid server-side. If invalid (401/403),
      // the backend has invalidated the session — clear local credentials.
      try {
        const response = await getProfile();
        await storageSetUser(response.data);
        setCredentials(response.data, storedToken);
      } catch (err) {
        const apiErr = err as ApiError;
        if (apiErr?.status === 401 || apiErr?.status === 403) {
          await storageSetAccessToken("");
          await storageSetUser(null);
          clearCredentials();
        }
        // For other errors (network etc.), keep optimistic session
      }
    } catch {
      // Storage read failed — stay unauthenticated
    }
  }, [setCredentials, clearCredentials]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    googleAuth,
    meriPehchaanAuth,
    resendVerification,
    refreshProfile,
    restoreSession,
  };
}
