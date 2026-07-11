import { z } from 'zod';

export const DateRangeId = z.enum(['7d', '30d', '90d', '1y']);
export type DateRangeId = z.infer<typeof DateRangeId>;

export const ScopeId = z.enum(['mine', 'campus']);
export type ScopeId = z.infer<typeof ScopeId>;

export const KpiSummarySchema = z.object({
  total_users: z.number(),
  total_events: z.number(),
  total_rsvps: z.number(),
  total_tickets: z.number(),
  prev_total_users: z.number(),
  prev_total_events: z.number(),
  prev_total_rsvps: z.number(),
  prev_total_tickets: z.number(),
});
export type KpiSummaryRow = z.infer<typeof KpiSummarySchema>;

export interface KpiMetric {
  label: string;
  value: number;
  deltaPct: number | null;
  positive: boolean;
}

export interface KpiSummary {
  totalUsers: KpiMetric;
  totalEvents: KpiMetric;
  totalRsvps: KpiMetric;
  totalTickets: KpiMetric;
}

export const TrendPointSchema = z.object({
  bucket: z.string(),
  active_users: z.number(),
  rsvps: z.number(),
});
export type TrendPoint = z.infer<typeof TrendPointSchema>;
export const TrendPointListSchema = z.array(TrendPointSchema);

export const MemberGrowthPointSchema = z.object({
  bucket: z.string(),
  active_members: z.number(),
  new_joins: z.number(),
});
export type MemberGrowthPoint = z.infer<typeof MemberGrowthPointSchema>;
export const MemberGrowthListSchema = z.array(MemberGrowthPointSchema);

export const CategoryBreakdownSchema = z.object({
  category: z.string(),
  event_count: z.number(),
  rsvp_count: z.number(),
});
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>;
export const CategoryBreakdownListSchema = z.array(CategoryBreakdownSchema);

export const StatusBreakdownSchema = z.object({ status: z.string(), event_count: z.number() });
export type StatusBreakdown = z.infer<typeof StatusBreakdownSchema>;
export const StatusBreakdownListSchema = z.array(StatusBreakdownSchema);

export const GroupTypeBreakdownSchema = z.object({ privacy: z.string(), group_count: z.number() });
export type GroupTypeBreakdown = z.infer<typeof GroupTypeBreakdownSchema>;
export const GroupTypeBreakdownListSchema = z.array(GroupTypeBreakdownSchema);

export const ActiveHourSchema = z.object({ hour_of_day: z.number(), activity_count: z.number() });
export type ActiveHour = z.infer<typeof ActiveHourSchema>;
export const ActiveHourListSchema = z.array(ActiveHourSchema);

export const RatingBucketSchema = z.object({ stars: z.number(), review_count: z.number() });
export type RatingBucket = z.infer<typeof RatingBucketSchema>;
export const RatingBucketListSchema = z.array(RatingBucketSchema);

export const FacultyBreakdownSchema = z.object({ program: z.string(), user_count: z.number() });
export type FacultyBreakdown = z.infer<typeof FacultyBreakdownSchema>;
export const FacultyBreakdownListSchema = z.array(FacultyBreakdownSchema);

export const YearBreakdownSchema = z.object({ study_year: z.string(), user_count: z.number() });
export type YearBreakdown = z.infer<typeof YearBreakdownSchema>;
export const YearBreakdownListSchema = z.array(YearBreakdownSchema);

export const RetentionPointSchema = z.object({ week_number: z.number(), retained_pct: z.number() });
export type RetentionPoint = z.infer<typeof RetentionPointSchema>;
export const RetentionPointListSchema = z.array(RetentionPointSchema);

export const FunnelStatsSchema = z.object({
  total_views: z.number(),
  total_rsvps: z.number(),
  total_attended: z.number(),
  total_tickets: z.number(),
  avg_rating: z.number().nullable(),
  review_count: z.number(),
});
export type FunnelStats = z.infer<typeof FunnelStatsSchema>;

export const LiveSnapshotSchema = z.object({
  active_users_now: z.number(),
  events_right_now: z.number(),
  rsvps_last_hour: z.number(),
  tickets_last_hour: z.number(),
});
export type LiveSnapshot = z.infer<typeof LiveSnapshotSchema>;

export const ActivityVolumePointSchema = z.object({ bucket_start: z.string(), activity_count: z.number() });
export type ActivityVolumePoint = z.infer<typeof ActivityVolumePointSchema>;
export const ActivityVolumeListSchema = z.array(ActivityVolumePointSchema);

export const ActivityTypeBreakdownSchema = z.object({ kind: z.string(), activity_count: z.number() });
export type ActivityTypeBreakdown = z.infer<typeof ActivityTypeBreakdownSchema>;
export const ActivityTypeBreakdownListSchema = z.array(ActivityTypeBreakdownSchema);

export const ActivityFeedItemSchema = z.object({
  kind: z.string(),
  actor_name: z.string(),
  target_title: z.string().nullable(),
  occurred_at: z.string(),
});
export type ActivityFeedItem = z.infer<typeof ActivityFeedItemSchema>;
export const ActivityFeedListSchema = z.array(ActivityFeedItemSchema);

/** Maps a date-range id to concrete from/to Date bounds, anchored to "now". */
export function resolveDateRange(range: DateRangeId, now: Date = new Date()): { from: Date; to: Date } {
  const to = now;
  const from = new Date(now);
  switch (range) {
    case '7d':
      from.setDate(from.getDate() - 7);
      break;
    case '90d':
      from.setDate(from.getDate() - 90);
      break;
    case '1y':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case '30d':
    default:
      from.setDate(from.getDate() - 30);
      break;
  }
  return { from, to };
}

export function granularityForRange(range: DateRangeId): 'day' | 'week' | 'month' {
  if (range === '7d') return 'day';
  if (range === '1y') return 'month';
  return 'week';
}
