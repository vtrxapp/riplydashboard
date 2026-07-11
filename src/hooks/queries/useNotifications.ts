import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchNotifications, markAllNotificationsRead, subscribeToNotifications } from '@/services/notifications.service';
import type { Notification } from '@/types/messaging';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/features/auth/AuthProvider';

export function useNotificationsQuery() {
  const { userId } = useAuth();

  return useQuery({
    queryKey: userId ? queryKeys.notifications.list(userId) : ['notifications', 'none'],
    queryFn: () => fetchNotifications(userId as string),
    enabled: !!userId,
    staleTime: 10_000,
  });
}

export function useRealtimeNotifications() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = subscribeToNotifications(userId, (n) => {
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(userId), (old) =>
        old ? [n, ...old].slice(0, 20) : [n],
      );
    });
    return () => {
      channel.unsubscribe();
    };
  }, [userId, queryClient]);
}

export function useMarkAllNotificationsRead() {
  const { userId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(userId as string),
    onMutate: () => {
      if (!userId) return;
      queryClient.setQueryData<Notification[]>(queryKeys.notifications.list(userId), (old) =>
        old?.map((n) => ({ ...n, read: true })),
      );
    },
  });
}
