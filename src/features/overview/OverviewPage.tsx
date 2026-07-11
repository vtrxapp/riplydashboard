import { useNavigate } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DualAreaChart } from '@/components/charts/DualAreaChart';
import { Sparkline } from '@/components/charts/Sparkline';
import { useUiStore } from '@/stores/uiStore';
import { useKpiMetrics } from '@/hooks/queries/useKpiMetrics';
import { useEngagementTrendQuery, useFunnelStatsQuery } from '@/hooks/queries/useAnalytics';
import { useEventsQuery } from '@/hooks/queries/useEvents';
import { useRecentActivityFeedQuery } from '@/hooks/queries/useAnalytics';
import { formatCompactNumber, formatDate } from '@/utils/format';
import { categoryGradient } from '@/utils/constants';
import { ActivityFeedList } from '@/features/activity/components/ActivityFeedList';

export default function OverviewPage() {
  const navigate = useNavigate();
  const range = useUiStore((s) => s.range);
  const scope = useUiStore((s) => s.scope);

  const kpi = useKpiMetrics(range, scope);
  const trend = useEngagementTrendQuery(range);
  const funnel = useFunnelStatsQuery(range);
  const topEvents = useEventsQuery({ sortBy: 'attendee_count', sortDir: 'desc', page: 1, pageSize: 5 });
  const feed = useRecentActivityFeedQuery(6);

  const kpiDefs = kpi.metrics
    ? [
        { m: kpi.metrics.totalUsers, iconName: 'users' as const, iconBg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
        { m: kpi.metrics.totalEvents, iconName: 'calendar' as const, iconBg: 'var(--color-violet-bg)', color: 'var(--color-violet)' },
        { m: kpi.metrics.totalRsvps, iconName: 'check' as const, iconBg: 'var(--color-green-bg)', color: 'var(--color-green)' },
        { m: kpi.metrics.totalTickets, iconName: 'ticket' as const, iconBg: 'var(--color-amber-bg)', color: 'var(--color-amber)' },
      ]
    : [];

  const trendChartData = (trend.data ?? []).map((p) => ({
    label: formatDate(p.bucket, { month: 'short', day: 'numeric' }),
    a: p.active_users,
    b: p.rsvps,
  }));

  const sparkFor = (key: 'a' | 'b') => trendChartData.slice(-8).map((p) => p[key] || 0.01);

  const totalViews = funnel.data?.total_views ?? 0;
  const funnelStages = funnel.data
    ? [
        { label: 'Event Views', value: funnel.data.total_views, pct: 100, color: 'var(--color-brand-500)' },
        {
          label: 'RSVPs',
          value: funnel.data.total_rsvps,
          pct: totalViews > 0 ? (funnel.data.total_rsvps / totalViews) * 100 : 0,
          color: '#19BFFF',
        },
        {
          label: 'Attended',
          value: funnel.data.total_attended,
          pct: totalViews > 0 ? (funnel.data.total_attended / totalViews) * 100 : 0,
          color: 'var(--color-violet)',
        },
        {
          label: 'Tickets Bought',
          value: funnel.data.total_tickets,
          pct: totalViews > 0 ? (funnel.data.total_tickets / totalViews) * 100 : 0,
          color: 'var(--color-green)',
        },
      ]
    : [];
  const overallConversion = totalViews > 0 && funnel.data ? (funnel.data.total_tickets / totalViews) * 100 : 0;

  return (
    <>
      <div className="kpi-grid">
        {kpi.isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {kpi.isError && (
          <div style={{ gridColumn: '1 / -1' }}>
            <ErrorState message="Couldn't load KPI summary." onRetry={() => kpi.refetch()} />
          </div>
        )}
        {kpiDefs.map((k, i) => (
          <KpiCard
            key={i}
            label={k.m.label}
            value={k.m.value}
            deltaPct={k.m.deltaPct}
            iconName={k.iconName}
            iconBg={k.iconBg}
            iconColor={k.color}
            spark={<Sparkline points={sparkFor(i % 2 === 0 ? 'a' : 'b')} color={k.color} />}
          />
        ))}
      </div>

      <div className="split-grid">
        <Card>
          <div className="card-header-row">
            <div>
              <div className="card-title">Engagement Trend</div>
              <div className="card-subtitle">Active users vs. RSVPs over time</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <Legend color="var(--color-brand-500)" label="Active users" />
              <Legend color="#FFB020" label="RSVPs" />
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            {trend.isLoading ? <CardSkeleton height={210} /> : trend.isError ? <ErrorState onRetry={() => trend.refetch()} /> : (
              <DualAreaChart data={trendChartData} aLabel="Active users" bLabel="RSVPs" aColor="#0098F0" bColor="#FFB020" />
            )}
          </div>
        </Card>

        <Card>
          <div className="card-title">Engagement Funnel</div>
          <div className="card-subtitle">Views → RSVP → Attend → Ticket</div>
          {funnel.isLoading ? (
            <div style={{ marginTop: 16 }}>
              <CardSkeleton height={140} />
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18 }}>
                {funnelStages.map((f) => (
                  <div key={f.label}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{f.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>
                        {formatCompactNumber(f.value)} <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-faint)' }}>({f.pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 12, borderRadius: 999, background: 'var(--color-surface-muted)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, f.pct)}%`, borderRadius: 999, background: f.color }} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--color-divider)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)' }}>Overall conversion</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-green)' }}>{overallConversion.toFixed(1)}%</span>
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="split-grid">
        <Card>
          <CardHeader
            title="Top Events"
            action={
              <button onClick={() => navigate('/admin/dashboard/events')} className="btn-ghost">
                View all →
              </button>
            }
          />
          {topEvents.isLoading ? (
            <CardSkeleton height={200} />
          ) : !topEvents.data || topEvents.data.rows.length === 0 ? (
            <EmptyState title="No events yet" description="Published events will appear here ranked by attendance." icon="calendar" />
          ) : (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr 1fr', gap: 8, padding: '10px 4px 10px', borderBottom: '1px solid var(--color-divider)' }}>
                {['Event', 'RSVPs', 'Attend', 'Conv.'].map((h, i) => (
                  <span key={h} style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-faint)', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>
                    {h}
                  </span>
                ))}
              </div>
              {topEvents.data.rows.map((e) => {
                const attend = e.capacity && e.capacity > 0 ? Math.round((e.attendee_count / e.capacity) * 100) : null;
                return (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr 1fr', gap: 8, alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid var(--color-divider)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, flex: 'none', background: categoryGradient(e.category) }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{e.category}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{e.attendee_count ?? '—'}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{attend != null ? `${attend}%` : '—'}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 800, textAlign: 'right', color: attend != null && attend >= 80 ? 'var(--color-green)' : attend != null && attend >= 60 ? 'var(--color-amber)' : 'var(--color-text-muted)' }}>
                      {attend != null ? `${attend}%` : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-title">Live Activity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="live-dot" />
              <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--color-green)' }}>Live</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <ActivityFeedList
              items={feed.data}
              isLoading={feed.isLoading}
              isError={feed.isError}
              onRetry={() => feed.refetch()}
              limit={6}
              emptyDescription="Real-time RSVPs, tickets, and likes will show up here as they happen."
            />
          </div>
        </Card>
      </div>
    </>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: color }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)' }}>{label}</span>
    </div>
  );
}
