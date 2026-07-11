import { useQuery } from '@tanstack/react-query';
import { fetchAllUsersForCharts, fetchUsers, type UserFilters } from '@/services/users.service';
import { queryKeys } from './queryKeys';

export function useUsersQuery(filters: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: () => fetchUsers(filters),
    placeholderData: (prev) => prev,
  });
}

export function useAllUsersForChartsQuery() {
  return useQuery({
    queryKey: queryKeys.users.all(),
    queryFn: fetchAllUsersForCharts,
    staleTime: 60_000,
  });
}
