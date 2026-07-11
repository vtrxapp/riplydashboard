import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { FullscreenLoader } from '@/components/ui/FullscreenLoader';

/** Blocks unauthenticated users from reaching any nested route. */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullscreenLoader label="Checking your session…" />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/auth" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}

/** Redirects an already-authenticated user away from the auth screen. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <FullscreenLoader label="Loading…" />;
  }

  if (status === 'authenticated') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
