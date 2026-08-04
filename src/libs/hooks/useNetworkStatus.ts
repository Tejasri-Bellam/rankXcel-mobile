import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import {
  isOnline,
  probeConnectivity,
  reportNetworkStatus,
  subscribeNetwork,
} from "@/src/libs/network";

interface Options {
  // How often to probe the API while the hook is mounted. Screens where losing
  // connectivity matters (the exam runners) want a steady heartbeat so a drop
  // is noticed even when the student is just reading a question.
  pollMs?: number;
  // Probe faster while offline so "back online" shows up promptly.
  offlinePollMs?: number;
  enabled?: boolean;
}

// Live connectivity for a screen: `online` flips on real request outcomes (via
// the axios interceptor) and on a periodic probe of the API. `changedAt` is
// bumped on every transition so a screen can fire a toast per change rather
// than per render.
export function useNetworkStatus({
  pollMs = 15000,
  offlinePollMs = 5000,
  enabled = true,
}: Options = {}) {
  const [online, setOnline] = useState<boolean>(isOnline());
  // Null until the first transition, so a screen can tell "was online all
  // along" apart from "just came back" and not toast on mount.
  const [changedAt, setChangedAt] = useState<number | null>(null);
  const onlineRef = useRef(online);
  onlineRef.current = online;

  useEffect(() => {
    if (!enabled) return;
    return subscribeNetwork((next) => {
      setOnline(next);
      setChangedAt(Date.now());
    });
  }, [enabled]);

  // Heartbeat. Reschedules itself so the interval can follow the current state
  // (slow while healthy, faster while offline).
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      const reachable = await probeConnectivity();
      if (cancelled) return;
      reportNetworkStatus(reachable);
      schedule();
    };

    const schedule = () => {
      if (cancelled) return;
      timer = setTimeout(tick, onlineRef.current ? pollMs : offlinePollMs);
    };

    schedule();

    // Coming back from the background is the other moment connectivity is
    // likely to have changed — check immediately rather than waiting a tick.
    const sub = AppState.addEventListener("change", (s: AppStateStatus) => {
      if (s !== "active" || cancelled) return;
      if (timer) clearTimeout(timer);
      tick();
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      sub.remove();
    };
  }, [enabled, pollMs, offlinePollMs]);

  return { online, changedAt };
}
