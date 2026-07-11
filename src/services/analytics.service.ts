import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import {
  ActiveHourListSchema,
  ActivityFeedListSchema,
  ActivityTypeBreakdownListSchema,
  ActivityVolumeListSchema,
  CategoryBreakdownListSchema,
  FacultyBreakdownListSchema,
  FunnelStatsSchema,
  GroupTypeBreakdownListSchema,
  KpiSummarySchema,
  LiveSnapshotSchema,
  MemberGrowthListSchema,
  RatingBucketListSchema,
  RetentionPointListSchema,
  StatusBreakdownListSchema,
  TrendPointListSchema,
  YearBreakdownListSchema,
  type ActiveHour,
  type ActivityFeedItem,
  type ActivityTypeBreakdown,
  type ActivityVolumePoint,
  type CategoryBreakdown,
  type FacultyBreakdown,
  type FunnelStats,
  type GroupTypeBreakdown,
  type KpiSummaryRow,
  type LiveSnapshot,
  type MemberGrowthPoint,
  type RatingBucket,
  type RetentionPoint,
  type StatusBreakdown,
  type TrendPoint,
  type YearBreakdown,
} from '@/types/analytics';

async function rpc<T>(fn: string, args: Record<string, unknown>, parse: (data: unknown) => T): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new AppError(`${error.message} (${fn})`, error);
  return parse(data ?? []);
}

async function rpcSingle<T>(fn: string, args: Record<string, unknown>, parse: (data: unknown) => T): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new AppError(`${error.message} (${fn})`, error);
  const row = Array.isArray(data) ? data[0] : data;
  return parse(row ?? {});
}

export async function fetchKpiSummary(from: Date, to: Date, scope: string): Promise<KpiSummaryRow> {
  return rpcSingle('analytics_kpi_summary', { p_from: from.toISOString(), p_to: to.toISOString(), p_scope: scope }, (d) =>
    KpiSummarySchema.parse(d),
  );
}

export async function fetchEngagementTrend(from: Date, to: Date, granularity: string): Promise<TrendPoint[]> {
  return rpc(
    'analytics_engagement_trend',
    { p_from: from.toISOString().slice(0, 10), p_to: to.toISOString().slice(0, 10), p_granularity: granularity },
    (d) => TrendPointListSchema.parse(d),
  );
}

export async function fetchMemberGrowth(from: Date, to: Date, granularity: string): Promise<MemberGrowthPoint[]> {
  return rpc(
    'analytics_member_growth',
    { p_from: from.toISOString().slice(0, 10), p_to: to.toISOString().slice(0, 10), p_granularity: granularity },
    (d) => MemberGrowthListSchema.parse(d),
  );
}

export async function fetchCategoryBreakdown(from?: Date, to?: Date): Promise<CategoryBreakdown[]> {
  return rpc(
    'analytics_category_breakdown',
    { p_from: from?.toISOString() ?? '-infinity', p_to: to?.toISOString() ?? 'infinity' },
    (d) => CategoryBreakdownListSchema.parse(d),
  );
}

export async function fetchStatusBreakdown(): Promise<StatusBreakdown[]> {
  return rpc('analytics_status_breakdown', {}, (d) => StatusBreakdownListSchema.parse(d));
}

export async function fetchGroupTypeBreakdown(): Promise<GroupTypeBreakdown[]> {
  return rpc('analytics_group_type_breakdown', {}, (d) => GroupTypeBreakdownListSchema.parse(d));
}

export async function fetchActiveHours(): Promise<ActiveHour[]> {
  return rpc('analytics_active_hours', {}, (d) => ActiveHourListSchema.parse(d));
}

export async function fetchRatingDistribution(): Promise<RatingBucket[]> {
  return rpc('analytics_rating_distribution', {}, (d) => RatingBucketListSchema.parse(d));
}

export async function fetchFacultyBreakdown(): Promise<FacultyBreakdown[]> {
  return rpc('analytics_faculty_breakdown', {}, (d) => FacultyBreakdownListSchema.parse(d));
}

export async function fetchYearBreakdown(): Promise<YearBreakdown[]> {
  return rpc('analytics_year_breakdown', {}, (d) => YearBreakdownListSchema.parse(d));
}

export async function fetchRetentionCurve(weeks = 8): Promise<RetentionPoint[]> {
  return rpc('analytics_retention_curve', { p_weeks: weeks }, (d) => RetentionPointListSchema.parse(d));
}

export async function fetchFunnelStats(from: Date, to: Date): Promise<FunnelStats> {
  return rpcSingle('analytics_funnel', { p_from: from.toISOString(), p_to: to.toISOString() }, (d) => FunnelStatsSchema.parse(d));
}

export async function fetchLiveSnapshot(): Promise<LiveSnapshot> {
  return rpcSingle('analytics_live_snapshot', {}, (d) => LiveSnapshotSchema.parse(d));
}

export async function fetchActivityVolume(hours = 12): Promise<ActivityVolumePoint[]> {
  return rpc('analytics_activity_volume', { p_hours: hours }, (d) => ActivityVolumeListSchema.parse(d));
}

export async function fetchActivityTypeBreakdown(hours = 24): Promise<ActivityTypeBreakdown[]> {
  return rpc('analytics_activity_type_breakdown', { p_hours: hours }, (d) => ActivityTypeBreakdownListSchema.parse(d));
}

export async function fetchRecentActivityFeed(limit = 20): Promise<ActivityFeedItem[]> {
  return rpc('recent_activity_feed', { p_limit: limit }, (d) => ActivityFeedListSchema.parse(d));
}
