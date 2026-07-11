import type { EventFilters } from '@/types/event';
import type { GroupFilters } from '@/types/group';
import type { UserFilters } from '@/services/users.service';

/** Central query-key factory so cache invalidation stays consistent across hooks. */
export const profileQueryKey = (userId: string) => ['auth', 'profile', userId] as const;

export const queryKeys = {
  events: {
    list: (filters: EventFilters) => ['events', 'list', filters] as const,
    all: () => ['events', 'all'] as const,
    pending: () => ['events', 'pending'] as const,
    reviews: () => ['events', 'reviews'] as const,
  },
  groups: {
    list: (filters: GroupFilters) => ['groups', 'list', filters] as const,
    all: () => ['groups', 'all'] as const,
  },
  users: {
    list: (filters: UserFilters) => ['users', 'list', filters] as const,
    all: () => ['users', 'all'] as const,
  },
  analytics: {
    kpiSummary: (from: string, to: string, scope: string) => ['analytics', 'kpi', from, to, scope] as const,
    engagementTrend: (from: string, to: string, g: string) => ['analytics', 'engagement-trend', from, to, g] as const,
    memberGrowth: (from: string, to: string, g: string) => ['analytics', 'member-growth', from, to, g] as const,
    categoryBreakdown: (from?: string, to?: string) => ['analytics', 'category-breakdown', from, to] as const,
    statusBreakdown: () => ['analytics', 'status-breakdown'] as const,
    groupTypeBreakdown: () => ['analytics', 'group-type-breakdown'] as const,
    activeHours: () => ['analytics', 'active-hours'] as const,
    ratingDistribution: () => ['analytics', 'rating-distribution'] as const,
    facultyBreakdown: () => ['analytics', 'faculty-breakdown'] as const,
    yearBreakdown: () => ['analytics', 'year-breakdown'] as const,
    retentionCurve: () => ['analytics', 'retention-curve'] as const,
    funnelStats: (from: string, to: string) => ['analytics', 'funnel', from, to] as const,
    liveSnapshot: () => ['analytics', 'live-snapshot'] as const,
    activityVolume: (hours: number) => ['analytics', 'activity-volume', hours] as const,
    activityTypeBreakdown: (hours: number) => ['analytics', 'activity-type-breakdown', hours] as const,
    activityFeed: (limit: number) => ['analytics', 'activity-feed', limit] as const,
  },
  chats: {
    list: () => ['chats', 'list'] as const,
    messages: (chatId: string) => ['chats', chatId, 'messages'] as const,
  },
  notifications: {
    list: (userId: string) => ['notifications', userId] as const,
  },
};
