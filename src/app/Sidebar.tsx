import { NavLink, useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { LogoMark } from '@/components/ui/LogoMark';
import { NAV_ITEMS } from './navigation';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePendingEventsQuery } from '@/hooks/queries/useEvents';
import { initialOf } from '@/utils/format';
import { roleLabel } from '@/types/user';
import { useUiStore } from '@/stores/uiStore';

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const { data: pendingEvents } = usePendingEventsQuery();
  const pendingCount = pendingEvents?.length ?? 0;
  const showToast = useUiStore((s) => s.showToast);

  const handleSignOut = async () => {
    await signOut();
    showToast('Signed out');
    navigate('/admin/auth', { replace: true });
  };

  return (
    <aside
      style={{
        flex: 'none',
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--color-surface)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 22px 20px' }}>
        <LogoMark />
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: 0.5, color: 'var(--color-brand-500)', lineHeight: 1 }}>RIPLY</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: 'var(--color-text-faint)', marginTop: 3 }}>ANALYTICS</div>
        </div>
      </div>

      <div style={{ padding: '4px 14px 10px' }}>
        <NavLink
          to="/admin/dashboard/create-event"
          onClick={onNavigate}
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          <Icon name="plus" size={19} color="#fff" />
          Create Event
        </NavLink>
      </div>

      <nav aria-label="Dashboard sections" style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 12px' }}>
        {NAV_ITEMS.map((n) => (
          <NavLink
            key={n.id}
            to={n.path}
            onClick={onNavigate}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              height: 44,
              padding: '0 14px',
              borderRadius: 13,
              textDecoration: 'none',
              fontSize: 15,
              fontWeight: 700,
              background: isActive ? 'var(--color-brand-gradient)' : 'none',
              color: isActive ? '#fff' : 'var(--color-text-secondary)',
              boxShadow: isActive ? 'var(--shadow-brand)' : 'none',
            })}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon name={n.icon} size={19} color={isActive ? '#fff' : 'var(--color-text-muted)'} />
                <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
                {n.id === 'funnel' && pendingCount > 0 && (
                  <span
                    style={{
                      minWidth: 18,
                      height: 18,
                      padding: '0 5px',
                      boxSizing: 'border-box',
                      borderRadius: 999,
                      background: isActive ? 'rgba(255,255,255,0.3)' : '#FF3B6B',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {pendingCount}
                  </span>
                )}
                {n.live && <span className="live-dot" aria-label="Live" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div style={{ marginTop: 'auto', padding: '16px 14px' }}>
        <div style={{ background: 'var(--color-brand-gradient)', borderRadius: 18, padding: 16, color: '#fff' }}>
          <div style={{ fontSize: 14, fontWeight: 800 }}>Riply Admin</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{profile?.university || 'University workspace'}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.22)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initialOf(profile?.name)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {profile?.name || 'Admin'}
              </div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>{profile ? roleLabel(profile.role) : 'Administrator'}</div>
            </div>
            <button onClick={handleSignOut} title="Sign out" aria-label="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.85, padding: 4 }}>
              <Icon name="logout" size={18} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
