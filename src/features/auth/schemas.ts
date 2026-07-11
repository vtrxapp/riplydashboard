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

// Email/password/verification are all handled by Clerk's own <SignIn>/<SignUp>
// components now — this schema only covers the Riply-specific profile fields
// (university/campus/role) collected on the onboarding screen right after a
// Clerk sign-up.
export const OnboardingSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name'),
  university: z.string().min(1, 'Please select your university'),
  campus: z.string().trim().optional().default(''),
  role: UserRole,
});
export type OnboardingInput = z.infer<typeof OnboardingSchema>;
