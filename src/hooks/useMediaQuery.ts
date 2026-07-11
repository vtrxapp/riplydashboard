import { useCallback, useSyncExternalStore } from 'react';

function subscribe(query: string, onChange: () => void) {
  const mql = window.matchMedia(query);
  mql.addEventListener('change', onChange);
  return () => mql.removeEventListener('change', onChange);
}

/** Subscribes to a media query via the canonical external-store API (no effect-driven setState). */
export function useMediaQuery(query: string): boolean {
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const subscribeFn = useCallback((onChange: () => void) => subscribe(query, onChange), [query]);
  return useSyncExternalStore(subscribeFn, getSnapshot, () => false);
}

export const useIsMobile = () => useMediaQuery('(max-width: 900px)');
