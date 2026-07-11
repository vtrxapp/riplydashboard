/* eslint-disable react-refresh/only-export-components -- this module intentionally exports a router config, not components */
import { lazy, Suspense } from 'react';
import { Navigate, createBrowserRouter } from 'react-router-dom';
import { RouteGuard, RedirectIfAuthed } from '@/features/auth/RouteGuard';
import { DashboardLayout } from './DashboardLayout';
import { FullscreenLoader } from '@/components/ui/FullscreenLoader';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const AuthPage = lazy(() => import('@/features/auth/AuthPage'));
const OverviewPage = lazy(() => import('@/features/overview/OverviewPage'));
const EventsPage = lazy(() => import('@/features/events/EventsPage'));
const GroupsPage = lazy(() => import('@/features/groups/GroupsPage'));
const FunnelPage = lazy(() => import('@/features/funnel/FunnelPage'));
const UsersPage = lazy(() => import('@/features/users/UsersPage'));
const ActivityPage = lazy(() => import('@/features/activity/ActivityPage'));
const MessagesPage = lazy(() => import('@/features/messages/MessagesPage'));
const CreateEventPage = lazy(() => import('@/features/create-event/CreateEventPage'));

function withSuspense(node: React.ReactNode, label?: string) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<FullscreenLoader label={label} />}>{node}</Suspense>
    </ErrorBoundary>
  );
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/admin/dashboard/overview" replace /> },
  {
    path: '/admin/auth',
    element: withSuspense(
      <RedirectIfAuthed>
        <AuthPage />
      </RedirectIfAuthed>,
    ),
  },
  {
    path: '/admin/dashboard',
    element: (
      <RouteGuard>
        <DashboardLayout />
      </RouteGuard>
    ),
    children: [
      { index: true, element: <Navigate to="overview" replace /> },
      { path: 'overview', element: withSuspense(<OverviewPage />, 'Loading overview…') },
      { path: 'events', element: withSuspense(<EventsPage />, 'Loading events…') },
      { path: 'groups', element: withSuspense(<GroupsPage />, 'Loading groups…') },
      { path: 'funnel', element: withSuspense(<FunnelPage />, 'Loading funnel…') },
      { path: 'users', element: withSuspense(<UsersPage />, 'Loading users…') },
      { path: 'activity', element: withSuspense(<ActivityPage />, 'Loading activity…') },
      { path: 'messages', element: withSuspense(<MessagesPage />, 'Loading messages…') },
      { path: 'create-event', element: withSuspense(<CreateEventPage />, 'Loading…') },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
