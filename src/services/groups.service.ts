import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import { GroupListSchema, type Group, type GroupFilters } from '@/types/group';
import type { PagedResult } from './events.service';

const LIST_COLUMNS =
  'id, name, description, privacy, category, logo_color, initial, member_count, post_count, event_count, created_at, archived';

export async function fetchGroups(filters: GroupFilters = {}): Promise<PagedResult<Group>> {
  const { privacy = 'all', search = '', sortBy = 'member_count', sortDir = 'desc', page = 1, pageSize = 10 } = filters;

  let query = supabase.from('groups').select(LIST_COLUMNS, { count: 'exact' }).eq('archived', false);

  if (privacy !== 'all') query = query.eq('privacy', privacy);
  if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);

  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, error);

  return { rows: GroupListSchema.parse(data ?? []), totalCount: count ?? 0 };
}

export async function fetchAllGroupsForCharts(): Promise<Group[]> {
  const { data, error } = await supabase.from('groups').select(LIST_COLUMNS).eq('archived', false).limit(500);
  if (error) throw new AppError(error.message, error);
  return GroupListSchema.parse(data ?? []);
}
