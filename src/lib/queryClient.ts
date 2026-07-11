import { QueryClient } from '@tanstack/react-query';

/**
 * Central cache/config for all server state. Sensible defaults for an
 * analytics dashboard: data is reasonably fresh for 30s (avoids refetch
 * storms when switching tabs), retries once on transient network errors,
 * and refetches on window focus so numbers stay current without polling.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
