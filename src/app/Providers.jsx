import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";

// App-wide providers. Currently just the TanStack Query client; the future
// AuthProvider / SyncProvider (which pick the active async repo by auth state)
// nest here without touching AppShell.
function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export default Providers;
