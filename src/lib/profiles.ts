// Profile + personal invite-code helpers. A `profiles` row is created once, on a
// user's first sign-in, alongside a single stable personal invite code (their QR
// in Phase 2). Friend-facing reads only ever expose username / display_name /
// avatar / current_streak (enforced by RLS); the raw day log stays private.

import { supabase } from "./supabase";

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  prefs: { restDays?: number[]; freezeVisibility?: string } | null;
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
  streak_updated_at: string | null;
}

function requireClient() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

// Human-friendly, unambiguous code (no 0/O/1/I). One stable code per user.
function generateInviteCode(length = 8): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < length; i++) code += alphabet[bytes[i] % alphabet.length];
  return code;
}

export async function getMyProfile(): Promise<Profile | null> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return null;

  const { data, error } = await client
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

// Is a username free? Case-insensitive check (usernames are stored lowercase).
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const client = requireClient();
  const { data, error } = await client
    .from("profiles")
    .select("id")
    .eq("username", username.trim().toLowerCase())
    .maybeSingle();
  if (error) throw error;
  return !data;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

// First-login onboarding: create the profile row + the user's personal invite
// code. Idempotent-ish: if a profile already exists it is returned untouched.
export async function createProfile(rawUsername: string): Promise<Profile> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const user = auth.user;
  if (!user) throw new Error("Not signed in.");

  const existing = await getMyProfile();
  if (existing) return existing;

  const username = normalizeUsername(rawUsername);
  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters (a–z, 0–9, _).");
  }

  const { data, error } = await client
    .from("profiles")
    .insert({
      id: user.id,
      username,
      display_name:
        (user.user_metadata?.full_name as string | undefined) ?? username,
      avatar_url: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      current_streak: 0,
      longest_streak: 0,
    })
    .select("*")
    .single();
  if (error) {
    // 23505 = unique_violation (username already taken).
    if ((error as { code?: string }).code === "23505") {
      throw new Error("That username is taken. Try another.");
    }
    throw error;
  }

  await ensureInviteCode();
  return data as Profile;
}

// Return the user's personal invite code, creating it on first call.
export async function ensureInviteCode(): Promise<string> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Not signed in.");

  const { data: existing, error: readErr } = await client
    .from("invite_codes")
    .select("code")
    .eq("owner_id", userId)
    .maybeSingle();
  if (readErr) throw readErr;
  if (existing?.code) return existing.code as string;

  // Retry a couple of times on the (astronomically unlikely) code collision.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateInviteCode();
    const { error } = await client
      .from("invite_codes")
      .insert({ code, owner_id: userId });
    if (!error) return code;
    if ((error as { code?: string }).code !== "23505") throw error;
  }
  throw new Error("Could not generate an invite code. Try again.");
}

// Push freshly recomputed derived streak into the denormalized profile columns
// that power the (Phase 2) leaderboard without exposing the raw log.
export async function updateDenormalizedStreak(fields: {
  current_streak: number;
  longest_streak: number;
  last_logged_date: string | null;
}): Promise<void> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await client
    .from("profiles")
    .update({ ...fields, streak_updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function updateProfilePrefs(prefs: {
  restDays: number[];
  freezeVisibility: string;
}): Promise<void> {
  const client = requireClient();
  const { data: auth } = await client.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return;

  const { error } = await client
    .from("profiles")
    .update({ prefs })
    .eq("id", userId);
  if (error) throw error;
}
