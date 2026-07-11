/* eslint-disable react-refresh/only-export-components -- Provider + useAuth hook are intentionally co-located */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { fetchCurrentProfile, signOut as signOutService } from '@/services/auth.service';
import { profileQueryKey } from '@/hooks/queries/queryKeys';
import type { User, UserRole } from '@/types/user';

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  session: Session | null;
  profile: User | null;
  role: UserRole | null;
  status: AuthStatus;
  profileError: string | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = not yet resolved

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
      }
    });

    return () => subscription.subscription.unsubscribe();
  }, [queryClient]);

  const userId = session?.user?.id;

  const profileQuery = useQuery({
    queryKey: userId ? profileQueryKey(userId) : ['auth', 'profile', 'none'],
    queryFn: () => fetchCurrentProfile(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
    retry: 1,
  });

  const status: AuthStatus = useMemo(() => {
    if (session === undefined) return 'loading';
    if (!session) return 'unauthenticated';
    return 'authenticated';
  }, [session]);

  const value: AuthContextValue = useMemo(
    () => ({
      session: session ?? null,
      profile: profileQuery.data ?? null,
      role: profileQuery.data?.role ?? null,
      status,
      profileError: profileQuery.error ? (profileQuery.error as Error).message : null,
      signOut: async () => {
        await signOutService();
      },
    }),
    [session, profileQuery.data, profileQuery.error, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
