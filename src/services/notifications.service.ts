import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import { NotificationListSchema, type Notification } from '@/types/messaging';

export async function fetchNotifications(userId: string): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new AppError(error.message, error);
  return NotificationListSchema.parse(data ?? []);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  if (error) throw new AppError(error.message, error);
}

export function subscribeToNotifications(userId: string, onInsert: (n: Notification) => void) {
  return supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      (payload) => onInsert(payload.new as Notification),
    )
    .subscribe();
}
