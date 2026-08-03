import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";
import { isSupabaseConfigured } from "../lib/supabase";
import { redeemInvite } from "../lib/friends";
import { setPendingInvite } from "../lib/pendingInvite";

// Landing for a shared invite link.
//   - signed in + onboarded   -> redeem now, show result.
//   - signed out / onboarding -> stash the code, bounce home to sign in
//                                (SyncProvider auto-redeems once synced).
//   - unconfigured build       -> explain that friends need cloud sync.
function AddFriend() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, configured } = useAuth();
  const { profile } = useSync();
  const [state, setState] = useState({ kind: "working", msg: "Adding…" });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!isSupabaseConfigured) {
        setState({
          kind: "error",
          msg: "Friends need cloud sync, which isn't enabled in this build.",
        });
        return;
      }
      if (!(configured && user && profile)) {
        // Not ready to redeem yet — stash and let sign-in + SyncProvider finish it.
        setPendingInvite(code);
        navigate("/", { replace: true });
        return;
      }
      try {
        const res = await redeemInvite(code);
        if (!cancelled) setState({ kind: "ok", msg: `Added @${res.username}!` });
      } catch (e) {
        if (!cancelled) setState({ kind: "error", msg: String(e.message ?? e) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [code, user, configured, profile, navigate]);

  return (
    <div style={styles.wrap}>
      <div style={styles.msg}>{state.msg}</div>
      <Link to="/" style={styles.link}>
        Back to Nudge
      </Link>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100dvh",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    background: "var(--bg)",
    color: "var(--text)",
    textAlign: "center",
  },
  msg: { fontSize: "18px", fontWeight: 600 },
  link: { color: "var(--text-muted)", textDecoration: "underline" },
};

export default AddFriend;
