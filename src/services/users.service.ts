import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import { UserListSchema, type User } from '@/types/user';
import type { PagedResult } from './events.service';

const LIST_COLUMNS = 'id, name, email, university, campus, program, year, role, avatar_color, created_at';

export interface UserFilters {
  search?: string;
  sortBy?: 'created_at' | 'name';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export async function fetchUsers(filters: UserFilters = {}): Promise<PagedResult<User>> {
  const { search = '', sortBy = 'created_at', sortDir = 'desc', page = 1, pageSize = 10 } = filters;

  let query = supabase.from('users').select(LIST_COLUMNS, { count: 'exact' });
  if (search.trim()) query = query.or(`name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, error);

  return { rows: UserListSchema.parse(data ?? []), totalCount: count ?? 0 };
}

export async function fetchAllUsersForCharts(): Promise<User[]> {
  const { data, error } = await supabase.from('users').select(LIST_COLUMNS).limit(2000);
  if (error) throw new AppError(error.message, error);
  return UserListSchema.parse(data ?? []);
}
