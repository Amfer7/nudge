import { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Auth context. Anonymous-first: when Supabase isn't configured (or nobody is
// signed in) `user` is null and the app runs exactly as the local-only app.
// Sign-in is optional and unlocks cloud sync.
const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  configured: false,
  signInGoogle: async () => {},
  signInEmail: async () => {},
  signUpEmail: async () => {},
  signOut: async () => {},
});

function redirectTo() {
  return `${window.location.origin}/auth/callback`;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // If unconfigured there is nothing to load — start ready.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  async function signInGoogle() {
    if (!supabase) throw new Error("Cloud sync is not configured.");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) throw error;
  }

  async function signInEmail(email, password) {
    if (!supabase) throw new Error("Cloud sync is not configured.");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  }

  async function signUpEmail(email, password) {
    if (!supabase) throw new Error("Cloud sync is not configured.");
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) throw error;
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }

  const value = {
    user: session?.user ?? null,
    session,
    loading,
    configured: isSupabaseConfigured,
    signInGoogle,
    signInEmail,
    signUpEmail,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
