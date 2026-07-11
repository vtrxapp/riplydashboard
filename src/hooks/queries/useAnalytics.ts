import { useQuery } from '@tanstack/react-query';
import * as analytics from '@/services/analytics.service';
import { granularityForRange, resolveDateRange, type DateRangeId } from '@/types/analytics';
import { queryKeys } from './queryKeys';

export function useKpiSummaryQuery(range: DateRangeId, scope: string) {
  const { from, to } = resolveDateRange(range);
  return useQuery({
    queryKey: queryKeys.analytics.kpiSummary(from.toISOString(), to.toISOString(), scope),
    queryFn: () => analytics.fetchKpiSummary(from, to, scope),
    staleTime: 30_000,
  });
}

export function useEngagementTrendQuery(range: DateRangeId) {
  const { from, to } = resolveDateRange(range);
  const granularity = granularityForRange(range);
  return useQuery({
    queryKey: queryKeys.analytics.engagementTrend(from.toISOString(), to.toISOString(), granularity),
    queryFn: () => analytics.fetchEngagementTrend(from, to, granularity),
    staleTime: 30_000,
  });
}

export function useMemberGrowthQuery(range: DateRangeId) {
  const { from, to } = resolveDateRange(range);
  const granularity = granularityForRange(range);
  return useQuery({
    queryKey: queryKeys.analytics.memberGrowth(from.toISOString(), to.toISOString(), granularity),
    queryFn: () => analytics.fetchMemberGrowth(from, to, granularity),
    staleTime: 30_000,
  });
}

export function useCategoryBreakdownQuery(range?: DateRangeId) {
  const bounds = range ? resolveDateRange(range) : undefined;
  return useQuery({
    queryKey: queryKeys.analytics.categoryBreakdown(bounds?.from.toISOString(), bounds?.to.toISOString()),
    queryFn: () => analytics.fetchCategoryBreakdown(bounds?.from, bounds?.to),
    staleTime: 30_000,
  });
}

export function useStatusBreakdownQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.statusBreakdown(),
    queryFn: analytics.fetchStatusBreakdown,
    staleTime: 30_000,
  });
}

export function useGroupTypeBreakdownQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.groupTypeBreakdown(),
    queryFn: analytics.fetchGroupTypeBreakdown,
    staleTime: 30_000,
  });
}

export function useActiveHoursQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.activeHours(),
    queryFn: analytics.fetchActiveHours,
    staleTime: 60_000,
  });
}

export function useRatingDistributionQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.ratingDistribution(),
    queryFn: analytics.fetchRatingDistribution,
    staleTime: 60_000,
  });
}

export function useFacultyBreakdownQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.facultyBreakdown(),
    queryFn: analytics.fetchFacultyBreakdown,
    staleTime: 60_000,
  });
}

export function useYearBreakdownQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.yearBreakdown(),
    queryFn: analytics.fetchYearBreakdown,
    staleTime: 60_000,
  });
}

export function useRetentionCurveQuery(weeks = 8) {
  return useQuery({
    queryKey: queryKeys.analytics.retentionCurve(),
    queryFn: () => analytics.fetchRetentionCurve(weeks),
    staleTime: 60_000,
  });
}

export function useFunnelStatsQuery(range: DateRangeId) {
  const { from, to } = resolveDateRange(range);
  return useQuery({
    queryKey: queryKeys.analytics.funnelStats(from.toISOString(), to.toISOString()),
    queryFn: () => analytics.fetchFunnelStats(from, to),
    staleTime: 30_000,
  });
}

export function useLiveSnapshotQuery() {
  return useQuery({
    queryKey: queryKeys.analytics.liveSnapshot(),
    queryFn: analytics.fetchLiveSnapshot,
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useActivityVolumeQuery(hours = 12) {
  return useQuery({
    queryKey: queryKeys.analytics.activityVolume(hours),
    queryFn: () => analytics.fetchActivityVolume(hours),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useActivityTypeBreakdownQuery(hours = 24) {
  return useQuery({
    queryKey: queryKeys.analytics.activityTypeBreakdown(hours),
    queryFn: () => analytics.fetchActivityTypeBreakdown(hours),
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useRecentActivityFeedQuery(limit = 20) {
  return useQuery({
    queryKey: queryKeys.analytics.activityFeed(limit),
    queryFn: () => analytics.fetchRecentActivityFeed(limit),
    refetchInterval: 20_000,
    staleTime: 10_000,
  });
}
