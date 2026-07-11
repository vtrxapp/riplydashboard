import { useNavigate } from 'react-router-dom';
import { Icon } from '@/components/ui/Icon';
import { DateRangeSelector } from '@/components/ui/DateRangeSelector';
import { ScopeSelector } from '@/components/ui/ScopeSelector';
import { NotificationsPanel } from './NotificationsPanel';
import { useUiStore } from '@/stores/uiStore';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface HeaderProps {
  title: string;
  subtitle: string;
  showRangeAndScope?: boolean;
  onOpenSidebar?: () => void;
}

export function Header({ title, subtitle, showRangeAndScope = true, onOpenSidebar }: HeaderProps) {
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const scope = useUiStore((s) => s.scope);
  const setScope = useUiStore((s) => s.setScope);
  const range = useUiStore((s) => s.range);
  const setRange = useUiStore((s) => s.setRange);
  const isMobile = useIsMobile();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: 'color-mix(in srgb, var(--color-bg) 85%, transparent)',
        backdropFilter: 'blur(12px)',
        padding: isMobile ? '16px 16px 12px' : '22px 30px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
        borderBottom: '1px solid var(--color-divider)',
      }}
    >
      {isMobile && onOpenSidebar && (
        <button className="btn btn-secondary btn-icon" onClick={onOpenSidebar} aria-label="Open menu">
          <Icon name="grid" size={19} color="var(--color-text)" />
        </button>
      )}
      <div style={{ flex: 1, minWidth: 160 }}>
        <h1 style={{ fontSize: isMobile ? 19 : 23, fontWeight: 800, letterSpacing: -0.5 }}>{title}</h1>
        {!isMobile && <div style={{ fontSize: 14, color: 'var(--color-text-muted)', marginTop: 3 }}>{subtitle}</div>}
      </div>

      {showRangeAndScope && !isMobile && <ScopeSelector value={scope} onChange={setScope} />}
      {showRangeAndScope && <DateRangeSelector value={range} onChange={setRange} />}

      <button onClick={toggleTheme} className="btn btn-secondary" aria-label="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color={theme === 'dark' ? '#FFC24D' : 'var(--color-text)'} />
        {!isMobile && <span style={{ fontSize: 13 }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>}
      </button>

      <button onClick={() => navigate('/admin/dashboard/messages')} className="btn btn-secondary btn-icon" aria-label="Messages">
        <Icon name="chat" size={20} color="var(--color-text)" />
      </button>

      <NotificationsPanel />
    </header>
  );
}
