import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { FullscreenLoader } from '@/components/ui/FullscreenLoader';

/** Blocks unauthenticated users, and routes signed-in users with no profile yet to onboarding. */
export function RouteGuard({ children }: { children: ReactNode }) {
  const { status, needsOnboarding } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullscreenLoader label="Checking your session…" />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/auth" replace state={{ from: location }} />;
  }

  if (needsOnboarding) {
    return <Navigate to="/admin/onboarding" replace />;
  }

  return <>{children}</>;
}

/** Redirects an already-authenticated (and fully onboarded) user away from the auth screen. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { status, needsOnboarding } = useAuth();

  if (status === 'loading') {
    return <FullscreenLoader label="Loading…" />;
  }

  if (status === 'authenticated') {
    return <Navigate to={needsOnboarding ? '/admin/onboarding' : '/admin/dashboard'} replace />;
  }

  return <>{children}</>;
}

/**
 * Guards the onboarding screen itself: requires a signed-in Clerk session,
 * but — unlike RouteGuard — does NOT require a `public.users` row yet
 * (that's exactly what this screen creates). Already-onboarded users are
 * sent straight to the dashboard instead of seeing the form again.
 */
export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { status, needsOnboarding } = useAuth();

  if (status === 'loading') {
    return <FullscreenLoader label="Loading…" />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/auth" replace />;
  }

  if (!needsOnboarding) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
