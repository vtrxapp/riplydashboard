import { supabase } from '@/lib/supabaseClient';

/**
 * Subscribes to every raw engagement signal the Activity/Overview pages
 * care about. Payloads intentionally aren't hand-assembled into feed items
 * here — the enriched feed (actor name, target title) comes from
 * `recent_activity_feed()`, so callers should treat this purely as an
 * "something changed" signal and refetch the relevant analytics queries.
 */
export function subscribeToActivitySignals(onSignal: () => void) {
  const channel = supabase
    .channel('realtime-activity-signals')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_rsvps' }, onSignal)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, onSignal)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_likes' }, onSignal)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' }, onSignal)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, onSignal)
    .subscribe();
  return channel;
}
