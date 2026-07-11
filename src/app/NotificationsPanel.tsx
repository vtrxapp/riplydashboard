import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { useMarkAllNotificationsRead, useNotificationsQuery, useRealtimeNotifications } from '@/hooks/queries/useNotifications';
import { formatRelativeTime } from '@/utils/format';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';

const KIND_ICON_BG: Record<string, string> = {
  rsvp: 'var(--color-brand-50)',
  event: 'var(--color-violet-bg)',
  ticket: 'var(--color-green-bg)',
  group: '#FFF1F5',
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications, isLoading } = useNotificationsQuery();
  const markAllRead = useMarkAllNotificationsRead();
  useRealtimeNotifications();

  const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        className="btn btn-secondary btn-icon"
        style={{ position: 'relative' }}
      >
        <Icon name="bell" size={20} color="var(--color-text)" />
        {unreadCount > 0 && (
          <span
            aria-hidden="true"
            style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: '50%', background: '#FF3B6B', border: '2px solid var(--color-surface)' }}
          />
        )}
      </button>

      {open && (
        <div
          className="animate-slide-in"
          role="dialog"
          aria-label="Notifications"
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            zIndex: 25,
            background: 'var(--color-surface)',
            borderRadius: 18,
            boxShadow: 'var(--shadow-popover)',
            overflow: 'hidden',
            width: 360,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid var(--color-divider)' }}>
            <span style={{ fontSize: 16, fontWeight: 800 }}>Notifications</span>
            <button
              onClick={() => markAllRead.mutate()}
              disabled={unreadCount === 0}
              style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-brand-500)', border: 'none', background: 'none', cursor: 'pointer', opacity: unreadCount === 0 ? 0.5 : 1 }}
            >
              Mark all read
            </button>
          </div>
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {isLoading && (
              <div style={{ padding: 18 }}>
                <Skeleton height={50} style={{ marginBottom: 10 }} />
                <Skeleton height={50} />
              </div>
            )}
            {!isLoading && (!notifications || notifications.length === 0) && (
              <EmptyState title="No notifications yet" description="You'll see approvals, RSVP milestones, and more here." icon="bell" />
            )}
            {notifications?.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '13px 18px',
                  borderBottom: '1px solid var(--color-divider)',
                  background: !n.read ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    flex: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: KIND_ICON_BG[n.kind] || 'var(--color-surface-muted)',
                  }}
                >
                  <Icon name="bell" size={15} color="var(--color-brand-500)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 2 }}>{n.body}</div>}
                  <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 3 }}>{formatRelativeTime(n.created_at)}</div>
                </div>
                {!n.read && <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-brand-500)', flex: 'none', marginTop: 5 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
