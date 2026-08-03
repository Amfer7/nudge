// The single configured Supabase client. Cloud sync is *optional*: when the env
// vars are absent (the default, and every anonymous user) `supabase` is `null`
// and `isSupabaseConfigured` is false, so every caller degrades to local-only
// behavior and the app is byte-for-byte the offline app it was before Phase 1.
//
// The anon key is public by design — all data protection rests on Row-Level
// Security policies in supabase/migrations. See SUPABASE_SETUP.md.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Needed so the OAuth callback (#access_token=...) is parsed on return.
        detectSessionInUrl: true,
      },
    })
  : null;
