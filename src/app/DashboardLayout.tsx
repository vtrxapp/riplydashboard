import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { PAGE_META } from './navigation';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useRealtimeActivity } from '@/hooks/queries/useRealtimeActivity';

export function DashboardLayout() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useRealtimeActivity();

  const pageId = location.pathname.split('/').pop() || 'overview';
  const meta = PAGE_META[pageId] ?? PAGE_META.overview;
  const showRangeAndScope = !['messages', 'create-event'].includes(pageId);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', fontFamily: 'var(--font-sans)', display: 'flex', color: 'var(--color-text)' }}>
      {(!isMobile || mobileNavOpen) && (
        <>
          {isMobile && (
            <div
              onClick={() => setMobileNavOpen(false)}
              aria-hidden="true"
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 30 }}
            />
          )}
          <div style={isMobile ? { position: 'fixed', inset: '0 auto 0 0', zIndex: 31 } : undefined}>
            <Sidebar onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </>
      )}

      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <Header title={meta.title} subtitle={meta.subtitle} showRangeAndScope={showRangeAndScope} onOpenSidebar={() => setMobileNavOpen(true)} />
        <div className="page-content">
          <ErrorBoundary key={location.pathname} fallbackTitle="This section couldn't be displayed">
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
