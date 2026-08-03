import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listFriends, redeemInvite, type Friend } from "../lib/friends";
import { useAuth } from "../providers/AuthProvider";
import { useSync } from "../providers/SyncProvider";

export const FRIENDS_QUERY_KEY = ["friends"] as const;

// The app's first server-state query. Enabled only for a signed-in user who has
// finished onboarding (has a profile), so anonymous users fire nothing.
export function useFriends() {
  const { user, configured } = useAuth();
  const { profile } = useSync();
  return useQuery<Friend[]>({
    queryKey: FRIENDS_QUERY_KEY,
    queryFn: listFriends,
    enabled: Boolean(configured && user && profile),
  });
}

export function useRedeemInvite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => redeemInvite(code),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: FRIENDS_QUERY_KEY });
    },
  });
}
