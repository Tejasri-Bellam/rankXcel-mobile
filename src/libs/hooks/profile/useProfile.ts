import { useCallback, useState } from "react";
import { storageSetUser } from "@/libs/utils/storage";
import { useAuthContext } from "@/libs/context/AuthContext";
import type { ApiError } from "@/types/api";
import { patchProfile } from "@/libs/services/auth/authService";
import type { PatchProfileRequest } from "@/types/auth";

interface UseProfileResult {
  isSaving: boolean;
  error: ApiError | null;
  updateProfile: (data: PatchProfileRequest) => Promise<boolean>;
}

export function useProfile(): UseProfileResult {
  const { setUser } = useAuthContext();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateProfile = useCallback(
    async (data: PatchProfileRequest): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      try {
        const response = await patchProfile(data);
        await storageSetUser(response.data);
        setUser(response.data);
        return true;
      } catch (err) {
        setError(err as ApiError);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [setUser],
  );

  return { isSaving, error, updateProfile };
}
