import { z } from 'zod';

export const UserRole = z.enum(['organizer', 'staff', 'umsu_admin']);
export type UserRole = z.infer<typeof UserRole>;

export const UserSchema = z.object({
  id: z.string(), // Clerk user id, e.g. "user_2abC..." — not a uuid
  name: z.string().default(''),
  email: z.string().nullable().optional(),
  university: z.string().default(''),
  campus: z.string().nullable().optional(),
  program: z.string().nullable().optional(),
  year: z.string().nullable().optional(),
  role: UserRole.default('organizer'),
  avatar_color: z.string().nullable().optional(),
  created_at: z.string(),
});
export type User = z.infer<typeof UserSchema>;

export const UserListSchema = z.array(UserSchema);

export function roleLabel(role: UserRole): string {
  switch (role) {
    case 'umsu_admin':
      return 'UMSU Administrator';
    case 'staff':
      return 'Department Staff';
    default:
      return 'Club Organizer';
  }
}
