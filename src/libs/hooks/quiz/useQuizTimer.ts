import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface UseQuizTimerResult {
  remainingSeconds: number | null;
  displayTime: string | null;
  isExpired: boolean;
  isWarning: boolean; // true when <= 60 seconds remain
}

export function useQuizTimer(
  timeLimitAt: string | null,
  onExpire: () => void,
): UseQuizTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const computeRemaining = useCallback((): number => {
    if (!timeLimitAt) return 0;
    return Math.max(0, Math.floor((new Date(timeLimitAt).getTime() - Date.now()) / 1000));
  }, [timeLimitAt]);

  useEffect(() => {
    if (!timeLimitAt) return;

    let id: ReturnType<typeof setInterval>;
    const tick = () => {
      const rem = computeRemaining();
      setRemainingSeconds(rem);
      if (rem === 0) {
        clearInterval(id);
        onExpireRef.current();
      }
    };

    tick();
    id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [timeLimitAt, computeRemaining]);

  const displayTime = useMemo(() => {
    if (remainingSeconds === null) return null;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, [remainingSeconds]);

  return {
    remainingSeconds,
    displayTime,
    isExpired: remainingSeconds === 0,
    isWarning: remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 60,
  };
}
