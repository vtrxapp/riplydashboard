/* eslint-disable react-refresh/only-export-components -- Provider + useAuth hook are intentionally co-located */
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useAuth as useClerkAuth } from '@clerk/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCurrentProfile } from '@/services/auth.service';
import { profileQueryKey } from '@/hooks/queries/queryKeys';
import type { User, UserRole } from '@/types/user';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  userId: string | null;
  profile: User | null;
  role: UserRole | null;
  status: AuthStatus;
  /** True once we know the user is signed in via Clerk but has no `public.users` row yet. */
  needsOnboarding: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Identity comes entirely from Clerk (`useClerkAuth`/`useClerk`); this
 * provider layers the app-specific `public.users` profile (university,
 * campus, role) on top, keyed by Clerk's `userId`. Supabase itself never
 * issues or tracks a session here — see `src/lib/supabaseClient.ts`, which
 * authenticates every request with the Clerk session token directly.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn, userId, signOut: clerkSignOut } = useClerkAuth();

  const profileQuery = useQuery({
    queryKey: userId ? profileQueryKey(userId) : ['auth', 'profile', 'none'],
    queryFn: () => fetchCurrentProfile(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 1,
  });

  const status: AuthStatus = useMemo(() => {
    if (!isLoaded) return 'loading';
    return isSignedIn ? 'authenticated' : 'unauthenticated';
  }, [isLoaded, isSignedIn]);

  const value: AuthContextValue = useMemo(
    () => ({
      userId: userId ?? null,
      profile: profileQuery.data ?? null,
      role: profileQuery.data?.role ?? null,
      status,
      needsOnboarding: status === 'authenticated' && profileQuery.isFetched && profileQuery.data == null,
      profileError: profileQuery.error ? (profileQuery.error as Error).message : null,
      signOut: async () => {
        queryClient.clear();
        await clerkSignOut();
      },
    }),
    [userId, profileQuery.data, profileQuery.isFetched, profileQuery.error, status, clerkSignOut, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
