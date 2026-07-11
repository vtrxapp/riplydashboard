import { z } from 'zod';
import { UserRole } from '@/types/user';

export { fieldErrors } from '@/utils/validation';

export const UNIVERSITIES = [
  'University of Manitoba',
  'University of Winnipeg',
  'Brandon University',
  'Université de Saint-Boniface',
  'Red River College Polytech',
] as const;

export const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'organizer', label: 'Club Organizer' },
  { value: 'staff', label: 'Department Staff' },
  { value: 'umsu_admin', label: 'UMSU Administrator' },
];

export const SignupSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  university: z.string().min(1, 'Please select your university'),
  campus: z.string().trim().optional().default(''),
  role: UserRole,
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  terms: z.boolean().refine((v) => v === true, { message: 'Please accept the Terms to continue' }),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const LoginSchema = z.object({
  university: z.string().min(1, 'Please select your university'),
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});
export type LoginInput = z.infer<typeof LoginSchema>;
