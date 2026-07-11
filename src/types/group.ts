import { z } from 'zod';

export const GroupPrivacy = z.enum(['public', 'private', 'invite']);
export type GroupPrivacy = z.infer<typeof GroupPrivacy>;

export const GroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable().optional(),
  privacy: GroupPrivacy.default('public'),
  category: z.string().nullable().optional(),
  logo_color: z.string().nullable().optional(),
  initial: z.string().nullable().optional(),
  member_count: z.number().default(0),
  post_count: z.number().default(0),
  event_count: z.number().default(0),
  created_at: z.string(),
  archived: z.boolean().default(false),
});
export type Group = z.infer<typeof GroupSchema>;
export const GroupListSchema = z.array(GroupSchema);

export interface GroupFilters {
  privacy?: GroupPrivacy | 'all';
  search?: string;
  sortBy?: 'member_count' | 'event_count' | 'created_at' | 'name';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}
