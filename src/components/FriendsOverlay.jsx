import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";
import { useFriends, useRedeemInvite } from "../hooks/useFriends";
import { rankStreaks } from "../lib/streakRanking";
import InviteQR from "./InviteQR";

// Friends: your invite QR/code, an add-a-friend box, and the friends list with
// each friend's current streak. Signed-out / unconfigured users get a prompt to
// sign in instead of the add/list UI. Bottom-sheet overlay like BlockDatesOverlay.
function FriendsOverlay({ visible, onClose, onOpenSettings }) {
  const { user, configured } = useAuth();
  const { profile, inviteCode } = useSync();
  const friends = useFriends();
  const redeem = useRedeemInvite();
  const [codeInput, setCodeInput] = useState("");
  const [added, setAdded] = useState(null);

  if (!visible) return null;

  const signedIn = configured && user && profile;

  // Standings: my own row folded in with friends, sorted by streak.
  const myRow = profile
    ? {
        id: profile.id,
        username: profile.username,
        current_streak: profile.current_streak,
      }
    : null;
  const rankedRows = friends.data ? rankStreaks(myRow, friends.data) : [];

  async function handleAdd(e) {
    e.preventDefault();
    setAdded(null);
    try {
      const res = await redeem.mutateAsync(codeInput);
      setAdded(`Added @${res.username}`);
      setCodeInput("");
    } catch {
      /* redeem.error carries the mapped message */
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <span>Friends</span>
          <button style={styles.close} onClick={onClose}>
            Close
          </button>
        </div>

        {!signedIn ? (
          <div style={styles.body}>
            <div style={styles.muted}>
              {configured
                ? "Sign in to share your code and add friends."
                : "Friends need cloud sync, which isn't enabled in this build."}
            </div>
            {configured && (
              <button
                style={styles.primaryBtn}
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
              >
                Sign in
              </button>
            )}
          </div>
        ) : (
          <div style={styles.body}>
            {inviteCode && <InviteQR code={inviteCode} />}

            <form onSubmit={handleAdd} style={styles.addForm}>
              <div style={styles.title}>Add a friend</div>
              <div style={styles.addRow}>
                <input
                  style={styles.input}
                  placeholder="Invite code"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  autoCapitalize="characters"
                  required
                />
                <button
                  style={styles.primaryBtn}
                  type="submit"
                  disabled={redeem.isPending || codeInput.trim().length === 0}
                >
                  {redeem.isPending ? "Adding…" : "Add"}
                </button>
              </div>
              {added && <div style={styles.notice}>{added}</div>}
              {redeem.isError && (
                <div style={styles.error}>{String(redeem.error.message)}</div>
              )}
            </form>

            <div style={styles.listWrap}>
              <div style={styles.title}>Standings</div>
              {friends.isLoading && <div style={styles.muted}>Loading…</div>}
              {friends.isError && (
                <div style={styles.error}>Couldn't load friends — retry.</div>
              )}
              {rankedRows.map((r) => (
                <div
                  key={r.id}
                  style={{
                    ...styles.friendRow,
                    ...(r.isMe ? styles.selfRow : {}),
                  }}
                >
                  <span style={styles.handle}>
                    @{r.username}
                    {r.isMe && <span style={styles.youTag}> (you)</span>}
                  </span>
                  <span style={styles.streak}>🔥 {r.current_streak}</span>
                </div>
              ))}
              {friends.data && friends.data.length === 0 && (
                <div style={styles.muted}>
                  No friends yet — share your code above.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "flex-end",
    justifyContent: "center",
    zIndex: 300,
  },
  sheet: {
    width: "100%",
    maxWidth: "480px",
    maxHeight: "88vh",
    overflowY: "auto",
    background: "var(--bg)",
    color: "var(--text)",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
    padding: "16px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontWeight: 700,
    fontSize: "18px",
    marginBottom: "14px",
  },
  close: {
    padding: "6px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: 400,
  },
  body: { display: "flex", flexDirection: "column", gap: "18px" },
  addForm: { display: "flex", flexDirection: "column", gap: "8px" },
  addRow: { display: "flex", gap: "8px" },
  title: { fontWeight: 600, fontSize: "15px", color: "var(--text)" },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
    background: "var(--bg)",
    color: "var(--text)",
    fontSize: "14px",
  },
  primaryBtn: {
    padding: "10px 16px",
    borderRadius: "10px",
    border: "1px solid rgba(45, 255, 196, 0.55)",
    background: "rgba(7, 22, 14, 0.72)",
    color: "var(--text)",
    fontWeight: 700,
    cursor: "pointer",
    fontSize: "14px",
  },
  listWrap: { display: "flex", flexDirection: "column", gap: "8px" },
  friendRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 12px",
    borderRadius: "10px",
    border: "1px solid var(--border)",
  },
  selfRow: {
    border: "1px solid rgba(45, 255, 196, 0.55)",
    background: "rgba(7, 22, 14, 0.45)",
  },
  handle: { fontWeight: 600, color: "var(--text)" },
  youTag: { color: "var(--text-muted)", fontWeight: 400, fontSize: "13px" },
  streak: { color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" },
  muted: { fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.45 },
  notice: { fontSize: "13px", color: "var(--text)" },
  error: { fontSize: "13px", color: "#ff8a8a" },
};

export default FriendsOverlay;
