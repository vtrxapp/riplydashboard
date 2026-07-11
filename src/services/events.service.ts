import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import {
  EventListSchema,
  EventReviewListSchema,
  EventSchema,
  type CreateEventInput,
  type Event,
  type EventFilters,
  type EventReview,
} from '@/types/event';

const LIST_COLUMNS =
  'id, title, category, date, status, likes, attendee_count, capacity, price, created_at, image_url, org, description, venue, start_time, end_time, created_by';

export interface PagedResult<T> {
  rows: T[];
  totalCount: number;
}

export async function fetchEvents(filters: EventFilters = {}): Promise<PagedResult<Event>> {
  const { status = 'all', search = '', sortBy = 'created_at', sortDir = 'desc', page = 1, pageSize = 10 } = filters;

  let query = supabase.from('events').select(LIST_COLUMNS, { count: 'exact' });

  if (status !== 'all') query = query.eq('status', status);
  if (search.trim()) query = query.ilike('title', `%${search.trim()}%`);

  query = query.order(sortBy, { ascending: sortDir === 'asc' });

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new AppError(error.message, error);

  return { rows: EventListSchema.parse(data ?? []), totalCount: count ?? 0 };
}

export async function fetchAllEventsForCharts(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw new AppError(error.message, error);
  return EventListSchema.parse(data ?? []);
}

export async function fetchPendingEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(LIST_COLUMNS)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw new AppError(error.message, error);
  return EventListSchema.parse(data ?? []);
}

export async function createEvent(input: CreateEventInput, university: string): Promise<Event> {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('events')
    .insert({
      title: input.title,
      category: input.category,
      description: input.description,
      date: input.date || null,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      venue: input.venue,
      price: input.price,
      capacity: input.capacity,
      status: 'pending',
      created_by: authData.user?.id,
      university,
    })
    .select(LIST_COLUMNS)
    .single();
  if (error) throw new AppError(error.message, error);
  return EventSchema.parse(data);
}

export async function updateEventStatus(id: string, status: Event['status']): Promise<void> {
  const { error } = await supabase.from('events').update({ status }).eq('id', id);
  if (error) throw new AppError(error.message, error);
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw new AppError(error.message, error);
}

export async function fetchRecentReviews(limit = 5): Promise<EventReview[]> {
  const { data, error } = await supabase
    .from('event_reviews')
    .select('id, event_id, event_title, rating, body, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new AppError(error.message, error);
  return EventReviewListSchema.parse(data ?? []);
}
