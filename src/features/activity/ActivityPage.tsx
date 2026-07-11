import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { CardSkeleton, KpiCardSkeleton } from '@/components/ui/Skeleton';
import { Icon, type IconName } from '@/components/ui/Icon';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import {
  useActivityTypeBreakdownQuery,
  useActivityVolumeQuery,
  useLiveSnapshotQuery,
  useRecentActivityFeedQuery,
} from '@/hooks/queries/useAnalytics';
import { ActivityFeedList } from './components/ActivityFeedList';
import { formatCompactNumber } from '@/utils/format';

const KIND_TABS = ['all', 'rsvp', 'ticket', 'event', 'group', 'like'] as const;

const TYPE_META: Record<string, { label: string; icon: IconName; color: string; bg: string }> = {
  rsvp: { label: 'RSVPs', icon: 'check', color: 'var(--color-brand-500)', bg: 'var(--color-brand-50)' },
  ticket: { label: 'Tickets', icon: 'ticket', color: 'var(--color-green)', bg: 'var(--color-green-bg)' },
  event: { label: 'Events', icon: 'calendar', color: 'var(--color-violet)', bg: 'var(--color-violet-bg)' },
  group: { label: 'Groups', icon: 'group', color: '#FF5A8A', bg: '#FFF1F5' },
  like: { label: 'Likes', icon: 'heart', color: 'var(--color-amber)', bg: 'var(--color-amber-bg)' },
};

export default function ActivityPage() {
  const [kindFilter, setKindFilter] = useState<(typeof KIND_TABS)[number]>('all');

  const live = useLiveSnapshotQuery();
  const feed = useRecentActivityFeedQuery(30);
  const volume = useActivityVolumeQuery(12);
  const typeBreakdown = useActivityTypeBreakdownQuery(24);

  const liveStats = live.data
    ? [
        { label: 'Active Users', value: live.data.active_users_now, icon: 'users' as const, iconBg: 'var(--color-violet-bg)', color: 'var(--color-violet)' },
        { label: 'Events Right Now', value: live.data.events_right_now, icon: 'calendar' as const, iconBg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
        { label: 'RSVPs / Hour', value: live.data.rsvps_last_hour, icon: 'check' as const, iconBg: 'var(--color-green-bg)', color: 'var(--color-green)' },
        { label: 'Tickets / Hour', value: live.data.tickets_last_hour, icon: 'ticket' as const, iconBg: 'var(--color-amber-bg)', color: 'var(--color-amber)' },
      ]
    : [];

  const filteredFeed = useMemo(() => {
    if (!feed.data) return feed.data;
    return kindFilter === 'all' ? feed.data : feed.data.filter((a) => a.kind === kindFilter);
  }, [feed.data, kindFilter]);

  const volumeChartData = (volume.data ?? []).map((v) => ({
    label: new Date(v.bucket_start).toLocaleTimeString('en-US', { hour: 'numeric' }),
    value: v.activity_count,
  }));

  const totalTypeCount = (typeBreakdown.data ?? []).reduce((s, t) => s + t.activity_count, 0) || 1;

  return (
    <>
      <div className="kpi-grid">
        {live.isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {liveStats.map((k) => (
          <div key={k.label} className="card" style={{ padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: k.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={k.icon} size={19} color={k.color} />
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span className="live-dot" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-green)' }}>LIVE</span>
              </span>
            </div>
            <div style={{ fontSize: 29, fontWeight: 800, letterSpacing: -1, marginTop: 14 }}>{k.value}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--color-text-muted)', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="split-grid">
        <Card>
          <div className="card-header-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="card-title">Live Feed</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px', borderRadius: 999, background: 'var(--color-green-bg)' }}>
                <span className="live-dot" />
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-green)' }}>Streaming</span>
              </span>
            </div>
            <div className="pill-group" role="tablist" aria-label="Filter activity by type">
              {KIND_TABS.map((f) => (
                <button key={f} role="tab" aria-pressed={f === kindFilter} className="pill" onClick={() => setKindFilter(f)} style={{ textTransform: 'capitalize' }}>
                  {f === 'all' ? 'All' : TYPE_META[f]?.label ?? f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14 }}>
            <ActivityFeedList items={filteredFeed} isLoading={feed.isLoading} isError={feed.isError} onRetry={() => feed.refetch()} />
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div className="card-title">Events / Hour</div>
            <div className="card-subtitle">Activity volume, last 12h</div>
            <div style={{ marginTop: 16 }}>
              {volume.isLoading ? <CardSkeleton height={150} /> : <SimpleBarChart data={volumeChartData} ariaLabel="Activity volume per hour" height={150} />}
            </div>
          </Card>
          <Card>
            <div className="card-title">By Type</div>
            <div className="card-subtitle">Share of the last 24 hours</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 16 }}>
              {typeBreakdown.isLoading && <CardSkeleton height={140} />}
              {typeBreakdown.data?.map((t) => {
                const meta = TYPE_META[t.kind] ?? TYPE_META.rsvp;
                return (
                  <div key={t.kind} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.bg }}>
                      <Icon name={meta.icon} size={15} color={meta.color} />
                    </div>
                    <span style={{ flexShrink: 0, width: 62, fontSize: 13.5, fontWeight: 700 }}>{meta.label}</span>
                    <div style={{ flex: 1, height: 9, borderRadius: 999, background: 'var(--color-surface-muted)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(t.activity_count / totalTypeCount) * 100}%`, borderRadius: 999, background: meta.color }} />
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', width: 40, textAlign: 'right' }}>
                      {formatCompactNumber(t.activity_count)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
