// Pure, node-testable ranking for the friends list: combine the signed-in user
// with their friends and sort by current streak (highest first), so the list
// reads as a lightweight standings. No Supabase/Vite import — same convention as
// streakEngine.ts / inviteCode.ts.
import type { Friend } from "./friends";

export interface StreakRow {
  id: string;
  username: string;
  current_streak: number;
  isMe: boolean;
}

interface Me {
  id: string;
  username: string;
  current_streak: number;
}

// Merge `me` (or nobody, when unavailable) with `friends`, sorted by streak
// descending and tie-broken by username ascending for a stable order.
export function rankStreaks(me: Me | null, friends: Friend[]): StreakRow[] {
  const rows: StreakRow[] = friends.map((f) => ({
    id: f.id,
    username: f.username,
    current_streak: f.current_streak,
    isMe: false,
  }));
  if (me) {
    rows.push({
      id: me.id,
      username: me.username,
      current_streak: me.current_streak,
      isMe: true,
    });
  }
  return rows.sort(
    (a, b) =>
      b.current_streak - a.current_streak ||
      a.username.localeCompare(b.username),
  );
}
