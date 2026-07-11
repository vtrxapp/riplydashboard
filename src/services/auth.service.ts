import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import { UserSchema, type User, type UserRole } from '@/types/user';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
  university: string;
  campus: string;
  role: UserRole;
}

export async function signUp(input: SignUpInput) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        university: input.university,
        campus: input.campus,
        role: input.role,
      },
    },
  });
  if (error) throw new AppError(error.message, error);
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AppError(error.message, error);
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new AppError(error.message, error);
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin/auth`,
  });
  if (error) throw new AppError(error.message, error);
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new AppError(error.message, error);
  return data.session;
}

export async function fetchCurrentProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase.from('users').select('*').eq('id', userId).maybeSingle();
  if (error) throw new AppError(error.message, error);
  if (!data) return null;
  return UserSchema.parse(data);
}
