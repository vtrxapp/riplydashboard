import { useMemo } from 'react';
import { useKpiSummaryQuery } from './useAnalytics';
import { percentDelta } from '@/utils/format';
import type { DateRangeId } from '@/types/analytics';
import type { KpiSummary } from '@/types/analytics';

/** Derives display-ready KPI metrics (value + period-over-period delta) from the raw RPC row. */
export function useKpiMetrics(range: DateRangeId, scope: string) {
  const query = useKpiSummaryQuery(range, scope);

  const metrics: KpiSummary | null = useMemo(() => {
    if (!query.data) return null;
    const r = query.data;
    return {
      totalUsers: {
        label: 'Total Users',
        value: r.total_users,
        deltaPct: percentDelta(r.total_users, r.prev_total_users),
        positive: r.total_users >= r.prev_total_users,
      },
      totalEvents: {
        label: 'Events Published',
        value: r.total_events,
        deltaPct: percentDelta(r.total_events, r.prev_total_events),
        positive: r.total_events >= r.prev_total_events,
      },
      totalRsvps: {
        label: 'Total RSVPs',
        value: r.total_rsvps,
        deltaPct: percentDelta(r.total_rsvps, r.prev_total_rsvps),
        positive: r.total_rsvps >= r.prev_total_rsvps,
      },
      totalTickets: {
        label: 'Tickets Sold',
        value: r.total_tickets,
        deltaPct: percentDelta(r.total_tickets, r.prev_total_tickets),
        positive: r.total_tickets >= r.prev_total_tickets,
      },
    };
  }, [query.data]);

  return { ...query, metrics };
}
