import { Icon, type IconName } from '@/components/ui/Icon';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatRelativeTime } from '@/utils/format';
import type { ActivityFeedItem } from '@/types/analytics';

const KIND_META: Record<string, { bg: string; color: string; icon: IconName; verb: string }> = {
  rsvp: { bg: 'var(--color-brand-50)', color: 'var(--color-brand-500)', icon: 'check', verb: "RSVP'd to" },
  ticket: { bg: 'var(--color-green-bg)', color: 'var(--color-green)', icon: 'ticket', verb: 'bought a ticket for' },
  event: { bg: 'var(--color-violet-bg)', color: 'var(--color-violet)', icon: 'calendar', verb: 'published' },
  group: { bg: '#FFF1F5', color: '#FF5A8A', icon: 'group', verb: 'joined' },
  like: { bg: 'var(--color-amber-bg)', color: 'var(--color-amber)', icon: 'heart', verb: 'liked' },
};

interface ActivityFeedListProps {
  items?: ActivityFeedItem[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  limit?: number;
  emptyDescription?: string;
}

export function ActivityFeedList({ items, isLoading, isError, onRetry, limit, emptyDescription }: ActivityFeedListProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ display: 'flex', gap: 12 }}>
            <Skeleton width={32} height={32} radius={999} />
            <div style={{ flex: 1 }}>
              <Skeleton height={14} width="80%" />
              <Skeleton height={11} width="40%" style={{ marginTop: 6 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) return <ErrorState message="Couldn't load the activity feed." onRetry={onRetry} />;

  if (!items || items.length === 0) {
    return <EmptyState title="No activity yet" description={emptyDescription} icon="activity" />;
  }

  const visible = limit ? items.slice(0, limit) : items;

  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 2, listStyle: 'none' }}>
      {visible.map((a, i) => {
        const meta = KIND_META[a.kind] || KIND_META.rsvp;
        return (
          <li key={i} className={i === 0 ? 'animate-slide-in' : undefined} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '9px 0', borderBottom: i < visible.length - 1 ? '1px solid var(--color-divider)' : 'none' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: meta.bg }}>
              <Icon name={meta.icon} size={15} color={meta.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, color: 'var(--color-text)', lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700 }}>{a.actor_name}</span> {meta.verb}{' '}
                <span style={{ fontWeight: 700 }}>{a.target_title}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 2 }}>{formatRelativeTime(a.occurred_at)}</div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
