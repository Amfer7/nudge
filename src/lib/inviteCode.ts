// Pure, framework-agnostic invite helpers. Kept free of any Supabase/Vite import
// (no `import.meta.env`) so they can be unit-tested under `node --test` — same
// pattern as streakEngine.ts. friends.ts re-exports these for app consumers.

// Build the shareable deep link for an invite code.
export function inviteUrl(origin: string, code: string): string {
  return `${origin.replace(/\/$/, "")}/add/${code}`;
}

// Map redeem_invite's Postgres error codes (see 0002_rls_and_rpc.sql) to copy.
export function mapRedeemError(code: string | undefined): string {
  switch (code) {
    case "P0002":
      return "That invite code doesn't exist.";
    case "P0001":
      return "You can't add yourself.";
    case "28000":
      return "Please sign in first.";
    default:
      return "Couldn't add that friend. Try again.";
  }
}
