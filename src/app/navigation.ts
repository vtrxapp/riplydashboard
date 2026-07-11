import type { IconName } from '@/components/ui/Icon';
import type { UserRole } from '@/types/user';

export interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: IconName;
  live?: boolean;
  requiresRole?: UserRole[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'overview', path: '/admin/dashboard/overview', label: 'Overview', icon: 'grid' },
  { id: 'events', path: '/admin/dashboard/events', label: 'Events', icon: 'calendar' },
  { id: 'groups', path: '/admin/dashboard/groups', label: 'Groups', icon: 'group' },
  { id: 'funnel', path: '/admin/dashboard/funnel', label: 'Funnel', icon: 'funnel' },
  { id: 'users', path: '/admin/dashboard/users', label: 'Users', icon: 'users' },
  { id: 'activity', path: '/admin/dashboard/activity', label: 'Activity', icon: 'activity', live: true },
];

export const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Overview', subtitle: 'Engagement across your events & communities' },
  events: { title: 'Events Analytics', subtitle: 'Performance of your published events' },
  groups: { title: 'Groups & Communities', subtitle: 'Membership growth and activity' },
  funnel: { title: 'Engagement Funnel', subtitle: 'From discovery to attendance' },
  users: { title: 'Users & Audience', subtitle: 'Who is engaging with your content' },
  activity: { title: 'Real-time Activity', subtitle: 'Live engagement as it happens' },
  messages: { title: 'Messages', subtitle: 'Reach out to UMSU administrators' },
  'create-event': { title: 'Create Event', subtitle: 'Publish a new event to the Riply feed' },
};
