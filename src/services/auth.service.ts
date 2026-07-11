import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import { UserSchema, type User, type UserRole } from '@/types/user';

// Sign-in/sign-up/sign-out/password-reset all live in Clerk now (see
// features/auth/AuthPage.tsx and AuthProvider.tsx) — this module only
// covers the app-specific `public.users` profile row that sits on top of
// a Clerk identity.

export interface CreateProfileInput {
  id: string; // Clerk user id
  name: string;
  email: string | null;
  university: string;
  campus: string;
  role: UserRole;
}

export async function fetchCurrentProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw new AppError(error.message, error);
  if (!data) return null;
  return UserSchema.parse(data);
}

/** Creates the `public.users` row right after a Clerk sign-up (the onboarding step). */
export async function createProfile(input: CreateProfileInput): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: input.id,
      name: input.name,
      email: input.email,
      university: input.university,
      campus: input.campus,
      role: input.role,
    })
    .select('*')
    .single();
  if (error) throw new AppError(error.message, error);
  return UserSchema.parse(data);
}
