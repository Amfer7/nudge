import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";
import { normalizeUsername } from "../lib/profiles";

// The "Sign in to sync" settings section. Anonymous users see a compact
// invitation; it's the ONLY auth surface in the app, so the rest of the UI is
// unchanged whether or not someone signs in. Self-contained (owns its own form
// state) like PRSection — it just consumes the Auth/Sync contexts.
function SignIn() {
  const { user, configured, signInGoogle, signInEmail, signUpEmail, signOut } =
    useAuth();
  const { status, error, inviteCode, profile, completeOnboarding } = useSync();

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Cloud sync isn't wired into this build — say so quietly, stay out of the way.
  if (!configured) {
    return (
      <section style={styles.section}>
        <div style={styles.title}>Cloud sync</div>
        <div style={styles.muted}>
          Not enabled in this build. Nudge is running fully offline — all your
          data lives on this device.
        </div>
      </section>
    );
  }

  async function handleEmail(e) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    setNotice(null);
    try {
      if (mode === "signup") {
        await signUpEmail(email.trim(), password);
        setNotice("Check your email to confirm your account, then sign in.");
      } else {
        await signInEmail(email.trim(), password);
      }
    } catch (err) {
      setFormError(err.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setFormError(null);
    try {
      await signInGoogle();
    } catch (err) {
      setFormError(err.message ?? "Google sign-in failed.");
    }
  }

  async function handleOnboarding(e) {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      await completeOnboarding(username);
    } catch (err) {
      setFormError(err.message ?? "Could not create your profile.");
    } finally {
      setBusy(false);
    }
  }

  // ---- Signed out: sign-in / sign-up ----
  if (!user) {
    return (
      <section style={styles.section}>
        <div style={styles.title}>Sign in to sync</div>
        <div style={styles.muted}>
          Optional. Sync your streak across devices and add friends. Your data
          keeps working offline either way.
        </div>

        <button style={styles.googleBtn} onClick={handleGoogle} disabled={busy}>
          Continue with Google
        </button>

        <div style={styles.divider}>or</div>

        <form onSubmit={handleEmail} style={styles.form}>
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            minLength={6}
            required
          />
          <button style={styles.primaryBtn} type="submit" disabled={busy}>
            {busy
              ? "Please wait…"
              : mode === "signup"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          style={styles.linkBtn}
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setFormError(null);
            setNotice(null);
          }}
        >
          {mode === "signup"
            ? "Already have an account? Sign in"
            : "New here? Create an account"}
        </button>

        {notice && <div style={styles.notice}>{notice}</div>}
        {formError && <div style={styles.error}>{formError}</div>}
      </section>
    );
  }

  // ---- Signed in, needs a username ----
  if (status === "onboarding") {
    const preview = normalizeUsername(username);
    return (
      <section style={styles.section}>
        <div style={styles.title}>Pick a username</div>
        <div style={styles.muted}>
          This is how friends find you. Letters, numbers, and underscores.
        </div>
        <form onSubmit={handleOnboarding} style={styles.form}>
          <input
            style={styles.input}
            type="text"
            placeholder="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoCapitalize="none"
            required
          />
          {preview && <div style={styles.muted}>You'll be @{preview}</div>}
          <button
            style={styles.primaryBtn}
            type="submit"
            disabled={busy || preview.length < 3}
          >
            {busy ? "Creating…" : "Continue"}
          </button>
        </form>
        {formError && <div style={styles.error}>{formError}</div>}
      </section>
    );
  }

  // ---- Signed in ----
  return (
    <section style={styles.section}>
      <div style={styles.title}>Account</div>
      <div style={styles.row}>
        <div>
          {profile?.username && <div style={styles.handle}>@{profile.username}</div>}
          <div style={styles.muted}>{user.email}</div>
        </div>
        <button style={styles.signOutBtn} onClick={() => signOut()}>
          Sign out
        </button>
      </div>

      <div style={styles.syncLine}>
        {status === "syncing" && "Syncing…"}
        {status === "synced" && "✓ Synced to the cloud"}
        {status === "error" && "Sync error — will retry on next change"}
      </div>

      {inviteCode && (
        <div style={styles.muted}>
          Your invite code: <span style={styles.code}>{inviteCode}</span>{" "}
          <span style={styles.dim}>(friends & QR arrive in the next update)</span>
        </div>
      )}

      {error && <div style={styles.error}>{String(error.message ?? error)}</div>}
    </section>
  );
}

const styles = {
  section: {
    padding: "16px 0",
    borderBottom: "1px solid var(--border)",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  title: { fontWeight: 600, fontSize: "16px" },
  muted: { fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.45 },
  dim: { opacity: 0.7 },
  form: { display: "flex", flexDirection: "column", gap: "8px" },
  input: {
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "14px",
  },
  primaryBtn: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(45, 255, 196, 0.55)",
    background: "rgba(7, 22, 14, 0.72)",
    color: "var(--text)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  googleBtn: {
    padding: "11px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: "14px",
  },
  signOutBtn: {
    padding: "8px 14px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "13px",
    whiteSpace: "nowrap",
  },
  linkBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted)",
    cursor: "pointer",
    fontSize: "13px",
    textDecoration: "underline",
    alignSelf: "flex-start",
    padding: 0,
  },
  divider: {
    textAlign: "center",
    fontSize: "12px",
    color: "var(--text-muted)",
    opacity: 0.8,
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
  },
  handle: { fontWeight: 600, fontSize: "15px" },
  syncLine: { fontSize: "13px", color: "var(--text-muted)" },
  code: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "var(--text)",
    letterSpacing: "1px",
  },
  notice: { fontSize: "13px", color: "var(--text)" },
  error: { fontSize: "13px", color: "#ff8a8a" },
};

export default SignIn;
