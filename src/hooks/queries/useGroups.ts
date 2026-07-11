import { useQuery } from '@tanstack/react-query';
import { fetchAllGroupsForCharts, fetchGroups } from '@/services/groups.service';
import type { GroupFilters } from '@/types/group';
import { queryKeys } from './queryKeys';

export function useGroupsQuery(filters: GroupFilters) {
  return useQuery({
    queryKey: queryKeys.groups.list(filters),
    queryFn: () => fetchGroups(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAllGroupsForChartsQuery() {
  return useQuery({
    queryKey: queryKeys.groups.all(),
    queryFn: fetchAllGroupsForCharts,
    staleTime: 60_000,
  });
}
