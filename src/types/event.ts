import { z } from 'zod';

export const EventStatus = z.enum(['draft', 'pending', 'published', 'upcoming', 'archived']);
export type EventStatus = z.infer<typeof EventStatus>;

export const EventSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string().default('social'),
  description: z.string().nullable().optional(),
  venue: z.string().nullable().optional(),
  date: z.string().nullable().optional(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  status: EventStatus.default('pending'),
  price: z.string().nullable().optional(),
  capacity: z.number().nullable().optional(),
  attendee_count: z.number().default(0),
  likes: z.number().default(0),
  image_url: z.string().nullable().optional(),
  org: z.string().nullable().optional(),
  university: z.string().optional(),
  created_by: z.string().nullable().optional(), // Clerk user id
  created_at: z.string(),
});
export type Event = z.infer<typeof EventSchema>;
export const EventListSchema = z.array(EventSchema);

export const CreateEventInputSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  category: z.string().min(1, 'Choose a category'),
  description: z.string().max(2000).optional().default(''),
  date: z.string().optional().default(''),
  start_time: z.string().optional().default(''),
  end_time: z.string().optional().default(''),
  venue: z.string().optional().default(''),
  price: z.string().optional().default('Free'),
  capacity: z.number().int().positive().max(100000).optional().default(500),
});
export type CreateEventInput = z.infer<typeof CreateEventInputSchema>;

export const EventReviewSchema = z.object({
  id: z.number(),
  event_id: z.string().uuid(),
  event_title: z.string().nullable().optional(),
  user_id: z.string().nullable().optional(), // Clerk user id
  rating: z.number().min(1).max(5),
  body: z.string().nullable().optional(),
  created_at: z.string(),
});
export type EventReview = z.infer<typeof EventReviewSchema>;
export const EventReviewListSchema = z.array(EventReviewSchema);

export interface EventFilters {
  status?: EventStatus | 'all';
  search?: string;
  sortBy?: 'created_at' | 'date' | 'attendee_count' | 'likes' | 'title';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
