import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { SearchInput } from '@/components/ui/SearchInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useChatsQuery, useMessagesQuery, useRealtimeMessages, useSendMessage } from '@/hooks/queries/useMessaging';
import { formatDateTime, initialOf } from '@/utils/format';
import type { Chat } from '@/types/messaging';

const CHAT_COLORS = [
  'linear-gradient(135deg,#19BFFF,#0E84E0)',
  'linear-gradient(135deg,#10B981,#06B6D4)',
  'linear-gradient(135deg,#7C5CFF,#B06BFF)',
  'linear-gradient(135deg,#FF6B6B,#FFB347)',
];

export default function MessagesPage() {
  const { data: chats, isLoading: chatsLoading } = useChatsQuery();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  // Derived during render (no effect needed): default to the first chat until
  // the admin explicitly picks another one.
  const activeChat: Chat | null = (chats?.find((c) => c.id === selectedChatId) ?? chats?.[0]) || null;
  const setActiveChat = (chat: Chat) => setSelectedChatId(chat.id);

  const { data: messages, isLoading: messagesLoading } = useMessagesQuery(activeChat?.id ?? null);
  useRealtimeMessages(activeChat?.id ?? null);
  const sendMessage = useSendMessage(activeChat?.id ?? null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredChats = (chats ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  const handleSend = () => {
    const text = draft.trim();
    if (!text || !activeChat) return;
    setDraft('');
    sendMessage.mutate(text);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 220px)', minHeight: 480 }}>
      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 18px 12px' }}>
          <div className="card-title">Conversations</div>
          <div style={{ marginTop: 12 }}>
            <SearchInput value={search} onChange={setSearch} placeholder="Search chats…" />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chatsLoading && (
            <div style={{ padding: 18 }}>
              <Skeleton height={56} style={{ marginBottom: 10 }} />
              <Skeleton height={56} />
            </div>
          )}
          {!chatsLoading && filteredChats.length === 0 && <EmptyState title="No conversations" icon="chat" />}
          {filteredChats.map((c, ci) => {
            const isActive = activeChat?.id === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveChat(c)}
                aria-current={isActive}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  padding: '12px 18px',
                  border: 'none',
                  background: isActive ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                  borderLeft: isActive ? '3px solid var(--color-brand-500)' : '3px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 15,
                    fontWeight: 800,
                    color: '#fff',
                    background: c.color || CHAT_COLORS[ci % CHAT_COLORS.length],
                  }}
                >
                  {c.initial || initialOf(c.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.last_message || 'No messages yet'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeChat ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="Select a conversation" icon="chat" />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--color-divider)' }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#fff',
                  background: activeChat.color || CHAT_COLORS[0],
                }}
              >
                {activeChat.initial || initialOf(activeChat.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{activeChat.name}</div>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--color-surface-alt)' }}>
              {messagesLoading && <Skeleton height={60} />}
              {!messagesLoading && messages?.length === 0 && <EmptyState title="No messages yet" description="Say hello!" icon="chat" />}
              {messages?.map((m) => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender_id ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '10px 14px',
                      borderRadius: m.sender_id ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: m.sender_id ? 'linear-gradient(135deg,#19BFFF,#0E84E0)' : 'var(--color-surface)',
                      color: m.sender_id ? '#fff' : 'var(--color-text)',
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      fontWeight: 500,
                      boxShadow: '0 2px 8px rgba(14,23,38,0.08)',
                    }}
                  >
                    {m.content}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--color-text-faint)', marginTop: 3, padding: '0 4px' }}>{formatDateTime(m.created_at)}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-divider)', display: 'flex', alignItems: 'center', gap: 11 }}>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message…"
                aria-label="Message"
                className="text-input"
                style={{ height: 46, borderRadius: 14 }}
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                aria-label="Send message"
                className="btn btn-primary btn-icon"
                style={{ width: 46, height: 46, flexShrink: 0 }}
              >
                <Icon name="send" size={18} color="#fff" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
