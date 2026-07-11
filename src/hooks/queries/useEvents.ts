import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEvent,
  deleteEvent,
  fetchAllEventsForCharts,
  fetchEvents,
  fetchPendingEvents,
  fetchRecentReviews,
  updateEventStatus,
} from '@/services/events.service';
import type { CreateEventInput, Event, EventFilters, EventStatus } from '@/types/event';
import { queryKeys } from './queryKeys';
import { useAuth } from '@/features/auth/AuthProvider';
import { useUiStore } from '@/stores/uiStore';
import { toErrorMessage } from '@/lib/errors';

export function useEventsQuery(filters: EventFilters) {
  return useQuery({
    queryKey: queryKeys.events.list(filters),
    queryFn: () => fetchEvents(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAllEventsForChartsQuery() {
  return useQuery({
    queryKey: queryKeys.events.all(),
    queryFn: fetchAllEventsForCharts,
    staleTime: 60_000,
  });
}

export function usePendingEventsQuery() {
  return useQuery({
    queryKey: queryKeys.events.pending(),
    queryFn: fetchPendingEvents,
    staleTime: 15_000,
  });
}

export function useRecentReviewsQuery(limit = 5) {
  return useQuery({
    queryKey: queryKeys.events.reviews(),
    queryFn: () => fetchRecentReviews(limit),
    staleTime: 60_000,
  });
}

function invalidateEventCaches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['events'] });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
}

export function useUpdateEventStatus() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: EventStatus; title?: string }) => updateEventStatus(id, status),
    onMutate: async ({ id, status }) => {
      const previous = queryClient.getQueriesData<{ rows: Event[]; totalCount: number }>({ queryKey: ['events', 'list'] });
      queryClient.setQueriesData<{ rows: Event[]; totalCount: number }>({ queryKey: ['events', 'list'] }, (old) =>
        old ? { ...old, rows: old.rows.map((e) => (e.id === id ? { ...e, status } : e)) } : old,
      );
      queryClient.setQueryData<Event[]>(queryKeys.events.pending(), (old) => old?.filter((e) => e.id !== id) ?? old);
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      showToast(toErrorMessage(err), 'error');
    },
    onSuccess: (_data, { status, title }) => {
      showToast(`"${title ?? 'Event'}" ${status === 'published' ? 'approved & published' : 'sent back to draft'}`);
    },
    onSettled: () => invalidateEventCaches(queryClient),
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onMutate: async (id: string) => {
      const previous = queryClient.getQueriesData<{ rows: Event[]; totalCount: number }>({ queryKey: ['events', 'list'] });
      queryClient.setQueriesData<{ rows: Event[]; totalCount: number }>({ queryKey: ['events', 'list'] }, (old) =>
        old ? { rows: old.rows.filter((e) => e.id !== id), totalCount: Math.max(0, old.totalCount - 1) } : old,
      );
      return { previous };
    },
    onError: (err, _id, ctx) => {
      ctx?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
      showToast(toErrorMessage(err), 'error');
    },
    onSuccess: () => showToast('Event deleted'),
    onSettled: () => invalidateEventCaches(queryClient),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { profile, userId } = useAuth();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input, profile?.university ?? '', userId ?? ''),
    onSuccess: () => {
      showToast('Event submitted for approval!');
      invalidateEventCaches(queryClient);
    },
    onError: (err) => showToast(toErrorMessage(err), 'error'),
  });
}
