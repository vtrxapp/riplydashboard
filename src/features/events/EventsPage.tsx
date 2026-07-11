import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiCardSkeleton, CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { DonutChart, DonutLegend } from '@/components/charts/DonutChart';
import { useUiStore } from '@/stores/uiStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCategoryBreakdownQuery, useStatusBreakdownQuery } from '@/hooks/queries/useAnalytics';
import { useDeleteEvent, useEventsQuery, useUpdateEventStatus } from '@/hooks/queries/useEvents';
import { useHasRole } from '@/features/auth/RoleGuard';
import { EventStatusBadge } from './components/EventStatusBadge';
import { categoryColor, categoryGradient, PAGE_SIZE } from '@/utils/constants';
import { formatDate } from '@/utils/format';
import type { EventFilters, EventStatus } from '@/types/event';

const STATUS_FILTERS: { id: EventStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'draft', label: 'Draft' },
  { id: 'pending', label: 'Pending' },
];

export default function EventsPage() {
  const range = useUiStore((s) => s.range);
  const canModerate = useHasRole(['umsu_admin', 'staff']);

  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sortBy, setSortBy] = useState<EventFilters['sortBy']>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filters: EventFilters = { status: statusFilter, search: debouncedSearch, sortBy, sortDir, page, pageSize: PAGE_SIZE };
  const events = useEventsQuery(filters);
  const statusBreakdown = useStatusBreakdownQuery();
  const categoryBreakdown = useCategoryBreakdownQuery(range);
  const updateStatus = useUpdateEventStatus();
  const deleteEventMutation = useDeleteEvent();

  const statusCounts = useMemo(() => {
    const map: Record<string, number> = {};
    statusBreakdown.data?.forEach((s) => (map[s.status] = s.event_count));
    return map;
  }, [statusBreakdown.data]);
  const total = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  const kpiDefs = [
    { label: 'Total Events', value: total, iconName: 'calendar' as const, iconBg: 'var(--color-violet-bg)', color: 'var(--color-violet)' },
    { label: 'Published', value: statusCounts.published ?? 0, iconName: 'check' as const, iconBg: 'var(--color-green-bg)', color: 'var(--color-green)' },
    { label: 'Upcoming', value: statusCounts.upcoming ?? 0, iconName: 'clock' as const, iconBg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
    { label: 'Pending Approval', value: statusCounts.pending ?? 0, iconName: 'ticket' as const, iconBg: 'var(--color-amber-bg)', color: 'var(--color-amber)' },
  ];

  const maxCat = Math.max(1, ...(categoryBreakdown.data ?? []).map((c) => c.event_count));

  const handleSort = (key: NonNullable<EventFilters['sortBy']>) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  const donutData = [
    { label: 'Published', value: statusCounts.published ?? 0, color: '#22C55E' },
    { label: 'Upcoming', value: statusCounts.upcoming ?? 0, color: '#0098F0' },
    { label: 'Draft', value: statusCounts.draft ?? 0, color: '#D4D9E2' },
    { label: 'Pending', value: statusCounts.pending ?? 0, color: '#F59E0B' },
  ].filter((d) => d.value > 0);

  return (
    <>
      <div className="kpi-grid">
        {statusBreakdown.isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {!statusBreakdown.isLoading && kpiDefs.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} iconName={k.iconName} iconBg={k.iconBg} iconColor={k.color} compact />
        ))}
      </div>

      <div className="split-grid">
        <Card>
          <div className="card-title">Events by Category</div>
          <div className="card-subtitle">RSVPs generated per category</div>
          {categoryBreakdown.isLoading ? (
            <CardSkeleton height={160} />
          ) : !categoryBreakdown.data || categoryBreakdown.data.length === 0 ? (
            <EmptyState title="No events yet" icon="calendar" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 18 }}>
              {categoryBreakdown.data.map((c) => (
                <div key={c.category}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{c.category}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      {c.rsvp_count} RSVPs <span style={{ color: 'var(--color-text-faint)' }}>· {c.event_count} events</span>
                    </span>
                  </div>
                  <div style={{ height: 12, borderRadius: 999, background: 'var(--color-surface-muted)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(c.event_count / maxCat) * 100}%`, borderRadius: 999, background: categoryColor(c.category) }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-title">Status Breakdown</div>
          <div className="card-subtitle">Across all your events</div>
          {statusBreakdown.isLoading ? (
            <CardSkeleton height={160} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                <DonutChart data={donutData} centerValue={String(total)} centerLabel="events" />
              </div>
              <DonutLegend data={donutData} />
            </>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <div className="table-toolbar">
          <div className="card-title">All Events</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search events…" />
            <div className="pill-group" role="tablist" aria-label="Filter by status">
              {STATUS_FILTERS.map((f) => (
                <button key={f.id} role="tab" aria-pressed={f.id === statusFilter} className="pill" onClick={() => { setStatusFilter(f.id); setPage(1); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="Event" sortKey="title" activeSortKey={sortBy ?? 'created_at'} sortDir={sortDir} onSort={handleSort} />
                <SortableHeader label="Date" sortKey="date" activeSortKey={sortBy ?? 'created_at'} sortDir={sortDir} onSort={handleSort} />
                <th>Status</th>
                <SortableHeader label="Likes" sortKey="likes" activeSortKey={sortBy ?? 'created_at'} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortableHeader label="Attend" sortKey="attendee_count" activeSortKey={sortBy ?? 'created_at'} sortDir={sortDir} onSort={handleSort} align="right" />
                <th style={{ textAlign: 'right' }}>Rate</th>
                {canModerate && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {events.isLoading && Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={canModerate ? 7 : 6} />)}
              {events.data?.rows.map((e) => {
                const attend = e.capacity && e.capacity > 0 ? Math.round((e.attendee_count / e.capacity) * 100) : null;
                return (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, flex: 'none', background: categoryGradient(e.category) }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{e.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{e.category}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{formatDate(e.date)}</td>
                    <td>
                      <EventStatusBadge status={e.status} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{e.likes ?? 0}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{e.attendee_count ?? 0}</td>
                    <td style={{ textAlign: 'right', fontWeight: 800, color: attend != null && attend >= 80 ? 'var(--color-green)' : attend != null && attend >= 60 ? 'var(--color-amber)' : 'var(--color-text-muted)' }}>
                      {attend != null ? `${attend}%` : '—'}
                    </td>
                    {canModerate && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                          {e.status === 'pending' && (
                            <>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => updateStatus.mutate({ id: e.id, status: 'published', title: e.title })}
                                aria-label={`Approve ${e.title}`}
                              >
                                <Icon name="check" size={13} color="#fff" />
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => updateStatus.mutate({ id: e.id, status: 'draft', title: e.title })}
                                aria-label={`Reject ${e.title}`}
                              >
                                <Icon name="x" size={13} color="var(--color-red)" />
                              </Button>
                            </>
                          )}
                          <Button variant="secondary" size="sm" onClick={() => deleteEventMutation.mutate(e.id)} aria-label={`Delete ${e.title}`}>
                            <Icon name="trash" size={13} color="var(--color-text-muted)" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {events.isError && <ErrorState message="Couldn't load events." onRetry={() => events.refetch()} />}
        {!events.isLoading && events.data?.rows.length === 0 && (
          <EmptyState title="No events found" description="Try adjusting your search or filters." icon="search" />
        )}

        {events.data && (
          <Pagination
            page={page}
            totalPages={Math.max(1, Math.ceil(events.data.totalCount / PAGE_SIZE))}
            totalCount={events.data.totalCount}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </Card>
    </>
  );
}
