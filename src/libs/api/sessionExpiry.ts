/**
 * Session-expiry event channel used by the axios interceptor (non-React) to
 * signal React code that the current auth token has been rejected by the
 * backend. A single in-flight event is debounced so bursts of failing
 * requests don't stack multiple modals.
 */

type Listener = () => void;

let listeners: Listener[] = [];
let fired = false;

export function onSessionExpired(listener: Listener): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function emitSessionExpired(): void {
  if (fired) return;
  fired = true;
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // listener errors must not break the interceptor chain
    }
  });
}

export function resetSessionExpiry(): void {
  fired = false;
}
