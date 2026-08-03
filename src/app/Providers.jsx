import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "../lib/queryClient";
import { AuthProvider } from "../providers/AuthProvider";
import { SyncProvider } from "../providers/SyncProvider";

// App-wide providers. Query client (server-state), then AuthProvider (who is
// signed in) and SyncProvider (which repo is active + first-login migration).
// SyncProvider must sit inside AuthProvider because it reacts to auth state.
function Providers({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SyncProvider>{children}</SyncProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default Providers;
