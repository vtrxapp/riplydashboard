import { supabase } from '@/lib/supabaseClient';
import { AppError } from '@/lib/errors';
import { ChatListSchema, MessageListSchema, MessageSchema, type Chat, type Message } from '@/types/messaging';

export async function fetchChats(): Promise<Chat[]> {
  const { data, error } = await supabase
    .from('chats')
    .select('id, name, initial, color, last_message, last_message_at')
    .order('last_message_at', { ascending: false });
  if (error) throw new AppError(error.message, error);
  return ChatListSchema.parse(data ?? []);
}

export async function fetchMessages(chatId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('id, chat_id, sender_id, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw new AppError(error.message, error);
  return MessageListSchema.parse(data ?? []);
}

export async function sendMessage(chatId: string, content: string): Promise<Message> {
  const { data: authData } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: authData.user?.id, content })
    .select('id, chat_id, sender_id, content, created_at')
    .single();
  if (error) throw new AppError(error.message, error);
  return MessageSchema.parse(data);
}

export function subscribeToMessages(chatId: string, onInsert: (message: Message) => void) {
  return supabase
    .channel(`messages:${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
      (payload) => onInsert(MessageSchema.parse(payload.new)),
    )
    .subscribe();
}
