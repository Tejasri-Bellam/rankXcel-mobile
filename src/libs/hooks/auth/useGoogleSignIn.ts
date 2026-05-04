import { useCallback, useState } from "react";
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useAuth } from "./useAuth";
import type { ApiError } from "@/types/api";

interface UseGoogleSignInReturn {
  googleSignIn: () => Promise<void>;
  isGoogleLoading: boolean;
  googleError: string | null;
}

export function useGoogleSignIn(onSuccess: () => void): UseGoogleSignInReturn {
  const { googleAuth } = useAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const googleSignIn = useCallback(async (): Promise<void> => {
    setGoogleError(null);
    setIsGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type === "cancelled") return;
      const idToken = response.data.idToken;
      if (!idToken) {
        setGoogleError("Unable to retrieve Google credentials. Please try again.");
        return;
      }
      await googleAuth(idToken);
      onSuccess();
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (
          err.code === statusCodes.SIGN_IN_CANCELLED ||
          err.code === statusCodes.IN_PROGRESS
        ) {
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          setGoogleError("Google Play Services is not available on this device.");
          return;
        }
        setGoogleError(`Sign-in error (${err.code}): ${err.message}`);
        return;
      }
      const apiErr = err as ApiError;
      if (apiErr?.errors?.nonFieldErrors?.[0]) {
        setGoogleError(apiErr.errors.nonFieldErrors[0]);
      } else {
        setGoogleError("Google sign-in failed. Please try again.");
      }
    } finally {
      setIsGoogleLoading(false);
    }
  }, [googleAuth, onSuccess]);

  return { googleSignIn, isGoogleLoading, googleError };
}
