import { QueryClient } from "@tanstack/react-query";

// Shared TanStack Query client. Defaults are tuned for an offline-first app whose
// server state (once Supabase lands) changes slowly and per-day: generous stale
// time, no refetch-on-focus churn, and one retry. Real query/mutation hooks are
// authored alongside the backend (plan.md Phase 1) — this just centralizes config.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min — day logs don't change second-to-second
      gcTime: 24 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 1,
    },
  },
});
