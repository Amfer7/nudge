// A one-shot invite code carried across a signed-out -> signed-in transition
// (e.g. clicking /add/:code while logged out, incl. the OAuth redirect round
// trip). Online-only + transient, so it lives outside the repository layer.
export const PENDING_INVITE_KEY = "nudge_pending_invite";

interface PendingStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStore(): PendingStore | null {
  return typeof localStorage !== "undefined" ? localStorage : null;
}

export function setPendingInvite(code: string, store = defaultStore()): void {
  store?.setItem(PENDING_INVITE_KEY, code);
}

export function getPendingInvite(store = defaultStore()): string | null {
  return store?.getItem(PENDING_INVITE_KEY) ?? null;
}

export function clearPendingInvite(store = defaultStore()): void {
  store?.removeItem(PENDING_INVITE_KEY);
}
