// Friend graph over the Phase-1 redeem_invite RPC + RLS-scoped profile reads.
// The pure, testable helpers live in inviteCode.ts (no Supabase/Vite import) and
// are re-exported here so app code has a single `friends` import surface.
import { supabase } from "./supabase";
import { mapRedeemError } from "./inviteCode";

export { inviteUrl, mapRedeemError } from "./inviteCode";

export interface Friend {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  current_streak: number;
}

function requireClient() {
  if (!supabase) throw new Error("Cloud sync is not configured.");
  return supabase;
}

// Friends reachable via the caller's friendship edges. RLS restricts both the
// rows (only your friends) and the columns exposed on a friend's profile.
export async function listFriends(): Promise<Friend[]> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];

  const { data: edges, error: edgeErr } = await client
    .from("friendships")
    .select("friend_id")
    .eq("user_id", userId);
  if (edgeErr) throw edgeErr;

  const ids = (edges ?? []).map((e) => e.friend_id as string);
  if (ids.length === 0) return [];

  const { data, error } = await client
    .from("profiles")
    .select("id, username, display_name, avatar_url, current_streak")
    .in("id", ids);
  if (error) throw error;
  return (data ?? []) as Friend[];
}

// Redeem someone else's invite code via the reciprocal-friendship RPC. Maps the
// RPC's Postgres error codes to friendly copy.
export async function redeemInvite(
  code: string,
): Promise<{ owner_id: string; username: string }> {
  const client = requireClient();
  const { data, error } = await client.rpc("redeem_invite", {
    invite_code: code.trim().toUpperCase(),
  });
  if (error) {
    throw new Error(mapRedeemError((error as { code?: string }).code));
  }
  return data as { owner_id: string; username: string };
}
