import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToActivitySignals } from '@/services/realtime.service';

/**
 * Bridges Supabase Realtime -> TanStack Query cache. Debounced slightly so a
 * burst of RSVPs doesn't trigger a refetch storm.
 */
export function useRealtimeActivity() {
  const queryClient = useQueryClient();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const signal = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['analytics', 'activity-feed'] });
        queryClient.invalidateQueries({ queryKey: ['analytics', 'live-snapshot'] });
        queryClient.invalidateQueries({ queryKey: ['analytics', 'activity-volume'] });
        queryClient.invalidateQueries({ queryKey: ['analytics', 'activity-type-breakdown'] });
      }, 800);
    };

    const channel = subscribeToActivitySignals(signal);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      channel.unsubscribe();
    };
  }, [queryClient]);
}
