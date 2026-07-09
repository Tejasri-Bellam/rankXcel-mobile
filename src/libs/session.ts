// Single-user login enforcement on the client.
//
// The backend allows a user to be signed in on only one device at a time:
// logging in elsewhere invalidates this device's token. The next authenticated
// request then comes back 401 "Invalid token." — at which point the user must
// be signed out here automatically.
//
// The axios response interceptor (see services/api.ts) can detect the 401, but
// it lives outside React and can't touch the router or the in-memory exam
// state. So it just calls notifySessionExpired(); a handler registered from the
// app shell does the actual clear-session + navigate.

type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;

// A logged-in screen typically fires several requests at once, so an
// invalidated token produces a burst of 401s. This guard makes sure we run the
// logout exactly once per invalidation instead of once per failed request.
let handling = false;

// Registered by the app shell (which has router + context access). Passing null
// clears the registration on unmount.
export function setSessionExpiredHandler(
  fn: SessionExpiredHandler | null
): void {
  handler = fn;
}

// Called from the axios interceptor when an authenticated request is rejected
// with 401. No-ops if a logout is already in progress or no handler is mounted.
export function notifySessionExpired(): void {
  if (handling || !handler) return;
  handling = true;
  handler();
}

// Re-arm the guard once a new session begins (call on successful login) so a
// future token invalidation triggers the auto-logout again.
export function armSessionExpiryGuard(): void {
  handling = false;
}
