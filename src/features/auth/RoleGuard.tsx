/* eslint-disable react-refresh/only-export-components -- RoleGuard + useHasRole are intentionally co-located */
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider';
import type { UserRole } from '@/types/user';
import { EmptyState } from '@/components/ui/EmptyState';

interface RoleGuardProps {
  allow: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/** Hides/blocks UI for roles that shouldn't see it (e.g. moderation actions). */
export function RoleGuard({ allow, children, fallback }: RoleGuardProps) {
  const { role } = useAuth();

  if (!role || !allow.includes(role)) {
    return (
      fallback ?? (
        <EmptyState
          title="Restricted"
          description="You don't have permission to view this section."
          icon="lock"
        />
      )
    );
  }

  return <>{children}</>;
}

/** Non-rendering helper for conditionally showing action buttons, etc. */
export function useHasRole(allow: UserRole[]): boolean {
  const { role } = useAuth();
  return !!role && allow.includes(role);
}
