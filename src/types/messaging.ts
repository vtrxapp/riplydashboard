import { z } from 'zod';

export const ChatSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  initial: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  last_message: z.string().nullable().optional(),
  last_message_at: z.string().nullable().optional(),
});
export type Chat = z.infer<typeof ChatSchema>;
export const ChatListSchema = z.array(ChatSchema);

export const MessageSchema = z.object({
  id: z.number(),
  chat_id: z.string().uuid(),
  sender_id: z.string().uuid().nullable().optional(),
  content: z.string(),
  created_at: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;
export const MessageListSchema = z.array(MessageSchema);

export const NotificationSchema = z.object({
  id: z.number(),
  user_id: z.string().uuid(),
  kind: z.string().default('event'),
  title: z.string(),
  body: z.string().nullable().optional(),
  read: z.boolean().default(false),
  created_at: z.string(),
});
export type Notification = z.infer<typeof NotificationSchema>;
export const NotificationListSchema = z.array(NotificationSchema);
