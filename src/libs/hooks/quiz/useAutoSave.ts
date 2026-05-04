import { useEffect, useRef, useState } from "react";

const AUTO_SAVE_INTERVAL_MS = 30_000; // 30 seconds

interface UseAutoSaveResult {
  isSaving: boolean;
}

export function useAutoSave(
  saveFn: () => Promise<void>,
  isActive: boolean,
): UseAutoSaveResult {
  const [isSaving, setIsSaving] = useState(false);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(async () => {
      setIsSaving(true);
      await saveFnRef.current().catch(console.error);
      setIsSaving(false);
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isActive]);

  return { isSaving };
}
