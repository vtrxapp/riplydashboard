import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiCardSkeleton, CardSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useUiStore } from '@/stores/uiStore';
import { useFunnelStatsQuery, useRatingDistributionQuery } from '@/hooks/queries/useAnalytics';
import { usePendingEventsQuery, useRecentReviewsQuery, useUpdateEventStatus } from '@/hooks/queries/useEvents';
import { StarRating } from './components/StarRating';
import { formatCompactNumber, formatRelativeTime } from '@/utils/format';
import { useHasRole } from '@/features/auth/RoleGuard';

const QUEUE_GRADIENTS = [
  'linear-gradient(135deg,#7C5CFF,#B06BFF)',
  'linear-gradient(135deg,#FF5A8A,#FF8A3D)',
  'linear-gradient(135deg,#2F6BFF,#5B7CFF)',
  'linear-gradient(135deg,#10B981,#06B6D4)',
];

export default function FunnelPage() {
  const range = useUiStore((s) => s.range);
  const canModerate = useHasRole(['umsu_admin', 'staff']);

  const funnel = useFunnelStatsQuery(range);
  const pending = usePendingEventsQuery();
  const reviews = useRecentReviewsQuery(5);
  const ratings = useRatingDistributionQuery();
  const updateStatus = useUpdateEventStatus();

  const totalViews = funnel.data?.total_views ?? 0;
  const conv = totalViews > 0 ? ((funnel.data?.total_tickets ?? 0) / totalViews) * 100 : 0;
  const rsvpPct = totalViews > 0 ? ((funnel.data?.total_rsvps ?? 0) / totalViews) * 100 : 0;

  const kpiDefs = [
    { label: 'Overall Conversion', value: `${conv.toFixed(1)}%`, iconName: 'funnel' as const, iconBg: 'var(--color-green-bg)', color: 'var(--color-green)' },
    { label: 'Avg. Event Rating', value: funnel.data?.avg_rating != null ? String(funnel.data.avg_rating) : '—', iconName: 'star' as const, iconBg: 'var(--color-amber-bg)', color: 'var(--color-amber)' },
    { label: 'Pending Approvals', value: pending.data?.length ?? 0, iconName: 'clock' as const, iconBg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
    { label: 'Biggest Drop-off', value: 'Views → RSVP', iconName: 'trendingDown' as const, iconBg: 'var(--color-red-bg)', color: 'var(--color-red)' },
  ];

  const stages = funnel.data
    ? [
        { label: 'Event Views', value: funnel.data.total_views, pct: 100, color: '#0098F0' },
        { label: 'RSVPs', value: funnel.data.total_rsvps, pct: rsvpPct, color: '#19BFFF' },
        { label: 'Attended', value: funnel.data.total_attended, pct: totalViews > 0 ? (funnel.data.total_attended / totalViews) * 100 : 0, color: '#7C5CFF' },
        { label: 'Tickets Bought', value: funnel.data.total_tickets, pct: conv, color: '#15A34A' },
      ]
    : [];

  const maxRatingCount = Math.max(1, ...(ratings.data ?? []).map((r) => r.review_count));

  return (
    <>
      <div className="kpi-grid">
        {funnel.isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {!funnel.isLoading && kpiDefs.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} iconName={k.iconName} iconBg={k.iconBg} iconColor={k.color} compact />
        ))}
      </div>

      <div className="split-grid">
        <Card>
          <div className="card-title">Conversion Funnel</div>
          <div className="card-subtitle">Discovery → attendance, with drop-off at each stage</div>
          {funnel.isLoading ? (
            <CardSkeleton height={180} />
          ) : totalViews === 0 ? (
            <EmptyState title="No funnel data yet" description="Event views, RSVPs, attendance, and tickets will appear here once your events start getting traffic." icon="funnel" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 18 }}>
              {stages.map((f) => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ height: 42, width: `${Math.max(f.pct, 8)}%`, minWidth: 74, borderRadius: 11, background: f.color, display: 'flex', alignItems: 'center', paddingLeft: 13, boxSizing: 'border-box' }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{formatCompactNumber(f.value)}</span>
                    </div>
                  </div>
                  <div style={{ flex: 'none', width: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{f.pct.toFixed(1)}% of views</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="card-title">Event Ratings</div>
          <div className="card-subtitle">Average across attended events</div>
          {ratings.isLoading ? (
            <CardSkeleton height={160} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
                <span style={{ fontSize: 41, fontWeight: 800, letterSpacing: -1.5 }}>{funnel.data?.avg_rating ?? '—'}</span>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <StarRating rating={funnel.data?.avg_rating ?? 0} size={15} />
                  <span style={{ fontSize: 12.5, color: 'var(--color-text-faint)', marginTop: 3 }}>{funnel.data?.review_count ?? 0} reviews</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
                {(ratings.data ?? []).map((r) => (
                  <div key={r.stars} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-muted)', width: 30 }}>{r.stars}★</span>
                    <div style={{ flex: 1, height: 9, borderRadius: 999, background: 'var(--color-surface-muted)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(r.review_count / maxRatingCount) * 100}%`, borderRadius: 999, background: '#FFB020' }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--color-text-faint)', width: 30, textAlign: 'right' }}>{r.review_count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="even-grid">
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-title">Pending Approval</div>
            <span className="badge" style={{ background: 'var(--color-amber-bg)', color: '#D9890B' }}>
              {pending.data?.length ?? 0} waiting
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {pending.isLoading && <CardSkeleton height={140} />}
            {pending.isError && <ErrorState onRetry={() => pending.refetch()} />}
            {!pending.isLoading && pending.data?.length === 0 && <EmptyState title="All caught up" description="No events pending approval." icon="check" />}
            {pending.data?.map((q, i) => (
              <div key={q.id} style={{ border: '1.5px solid var(--color-border)', borderRadius: 16, padding: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, flex: 'none', background: QUEUE_GRADIENTS[i % QUEUE_GRADIENTS.length] }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
                    <div style={{ fontSize: 12.5, color: 'var(--color-text-faint)', marginTop: 2 }}>
                      {q.org || q.category || 'Event'} · {formatRelativeTime(q.created_at)}
                    </div>
                  </div>
                </div>
                {canModerate && (
                  <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
                    <Button variant="secondary" onClick={() => updateStatus.mutate({ id: q.id, status: 'draft', title: q.title })} style={{ flex: 1, color: 'var(--color-red)' }}>
                      <Icon name="x" size={15} color="var(--color-red)" />
                      Reject
                    </Button>
                    <Button variant="success" onClick={() => updateStatus.mutate({ id: q.id, status: 'published', title: q.title })} style={{ flex: 1 }}>
                      <Icon name="check" size={15} color="#fff" />
                      Approve
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="card-title">Recent Feedback</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-faint)' }}>{funnel.data?.review_count ?? 0} total reviews</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
            {reviews.isLoading && <CardSkeleton height={140} />}
            {!reviews.isLoading && reviews.data?.length === 0 && <EmptyState title="No reviews yet" icon="star" />}
            {reviews.data?.map((r) => (
              <div key={r.id} style={{ padding: '13px 0', borderBottom: '1px solid var(--color-divider)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{r.event_title || 'Event'}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{formatRelativeTime(r.created_at)}</div>
                  </div>
                  <StarRating rating={r.rating} />
                </div>
                {r.body && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: 'var(--color-text-secondary)', marginTop: 8 }}>{r.body}</div>}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
