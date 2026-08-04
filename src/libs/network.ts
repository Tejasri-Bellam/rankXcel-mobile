// Connectivity signal for the app, derived from the API layer.
//
// There's no native connectivity module in this project (NetInfo isn't
// installed), so "online" here means "the API is reachable" — which is the
// thing that actually matters mid-exam: whether answers are getting through.
//
// Two sources feed it:
//   1. Real traffic — the axios interceptor (services/api.ts) reports every
//      response: a request that came back at all means online; one that never
//      got a response (ApiError.status === 0) means offline.
//   2. A probe — useNetworkStatus() pings the API while a screen sits idle, so
//      losing (or regaining) connectivity is noticed even between requests.

type NetworkListener = (online: boolean) => void;

const listeners = new Set<NetworkListener>();

// Optimistic until something says otherwise — a fresh launch shouldn't flash
// an offline warning before the first request has had a chance to run.
let online = true;

export function isOnline(): boolean {
  return online;
}

// Report the outcome of a request/probe. Only a CHANGE notifies listeners, so a
// long offline stretch fires one event rather than one per failed request.
export function reportNetworkStatus(next: boolean): void {
  if (next === online) return;
  online = next;
  listeners.forEach((fn) => fn(next));
}

// Subscribe to online/offline transitions. Returns an unsubscribe function.
export function subscribeNetwork(fn: NetworkListener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// A rejected request that never reached the server. The interceptor normalizes
// these to status 0 (see customizeAxiosError) — HTTP errors always carry a real
// status, so they mean the connection is fine and the server said no.
export function isNetworkError(err: any): boolean {
  return err?.status === 0;
}

// Ask the API whether it's reachable. Any HTTP response counts as online —
// even a 401/404 — because it proves the round trip completed. Deliberately
// uses fetch (not the axios instance) so the probe can't trip interceptors or
// carry auth headers.
export async function probeConnectivity(timeoutMs = 8000): Promise<boolean> {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!baseUrl) return online;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    await fetch(baseUrl, { method: "HEAD", signal: controller.signal });
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}
