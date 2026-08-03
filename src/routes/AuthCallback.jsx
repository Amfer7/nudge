import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// OAuth landing page. `detectSessionInUrl` on the client parses the returned
// token automatically; we just wait for the session to settle, then return the
// user to the app. (The invite deep-link `/add/:code` arrives in Phase 2.)
function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!supabase) {
      navigate("/", { replace: true });
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      navigate("/", { replace: true });
    });
    // Fallback in case the session was already established before we subscribed.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate("/", { replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--text-muted)",
        fontSize: "15px",
      }}
    >
      Signing you in…
    </div>
  );
}

export default AuthCallback;
