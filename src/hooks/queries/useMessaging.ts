import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchChats, fetchMessages, sendMessage, subscribeToMessages } from '@/services/messaging.service';
import type { Message } from '@/types/messaging';
import { queryKeys } from './queryKeys';
import { useUiStore } from '@/stores/uiStore';
import { toErrorMessage } from '@/lib/errors';

export function useChatsQuery() {
  return useQuery({ queryKey: queryKeys.chats.list(), queryFn: fetchChats, staleTime: 10_000 });
}

export function useMessagesQuery(chatId: string | null) {
  return useQuery({
    queryKey: chatId ? queryKeys.chats.messages(chatId) : ['chats', 'none', 'messages'],
    queryFn: () => fetchMessages(chatId as string),
    enabled: !!chatId,
  });
}

/** Subscribes to realtime message inserts and pushes them straight into the Query cache. */
export function useRealtimeMessages(chatId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!chatId) return;
    const channel = subscribeToMessages(chatId, (message: Message) => {
      queryClient.setQueryData<Message[]>(queryKeys.chats.messages(chatId), (old) => {
        if (!old) return [message];
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      });
    });
    return () => {
      channel.unsubscribe();
    };
  }, [chatId, queryClient]);
}

export function useSendMessage(chatId: string | null) {
  const queryClient = useQueryClient();
  const showToast = useUiStore((s) => s.showToast);

  return useMutation({
    mutationFn: (content: string) => sendMessage(chatId as string, content),
    onSuccess: (message) => {
      queryClient.setQueryData<Message[]>(queryKeys.chats.messages(chatId as string), (old) =>
        old ? [...old.filter((m) => m.id !== message.id), message] : [message],
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.chats.list() });
    },
    onError: (err) => showToast(`Failed to send: ${toErrorMessage(err)}`, 'error'),
  });
}
