import { supabase } from './supabase';

// ── Auth ──────────────────────────────────────────────────────────────────────

export const signOut = () => supabase.auth.signOut();

export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from('users').select('*').eq('id', user.id).single();
  return data;
};

// ── Overview KPIs ─────────────────────────────────────────────────────────────

export const fetchOverviewKpis = async () => {
  const [usersRes, eventsRes, rsvpsRes, ticketsRes] = await Promise.all([
    supabase.from('users').select('id, created_at', { count: 'exact' }),
    supabase.from('events').select('id, created_at, status', { count: 'exact' }),
    supabase.from('event_rsvps').select('event_id, created_at', { count: 'exact' }),
    supabase.from('tickets').select('id', { count: 'exact' }),
  ]);

  const totalUsers  = usersRes.count  ?? 0;
  const totalEvents = eventsRes.count ?? 0;
  const totalRsvps  = rsvpsRes.count  ?? 0;
  const totalTickets = ticketsRes.count ?? 0;

  return { totalUsers, totalEvents, totalRsvps, totalTickets };
};

// ── Events ────────────────────────────────────────────────────────────────────

export const fetchEvents = async (status = null) => {
  let q = supabase
    .from('events')
    .select('id, title, category, date, status, likes, attendee_count, capacity, price, created_at, image_url, org')
    .order('created_at', { ascending: false });
  if (status) q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
};

export const createEvent = async (payload) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, created_by: user?.id, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateEventStatus = async (id, status) => {
  const { error } = await supabase.from('events').update({ status }).eq('id', id);
  if (error) throw error;
};

export const deleteEvent = async (id) => {
  const { error } = await supabase.from('events').delete().eq('id', id);
  if (error) throw error;
};

// ── Groups ────────────────────────────────────────────────────────────────────

export const fetchGroups = async () => {
  const { data, error } = await supabase
    .from('groups')
    .select('id, name, description, privacy, category, logo_color, initial, member_count, post_count, event_count, created_at, archived')
    .eq('archived', false)
    .order('member_count', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const fetchUsers = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, university, campus, program, year, role, avatar_color, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

// ── Messages ──────────────────────────────────────────────────────────────────

export const fetchChats = async () => {
  const { data, error } = await supabase
    .from('chats')
    .select('id, name, initial, color, last_message, last_message_at')
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const fetchMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const sendMessage = async (chatId, content) => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: user?.id, content })
    .select()
    .single();
  if (error) throw error;

  // Update last_message on chat
  await supabase.from('chats').update({
    last_message: content,
    last_message_at: new Date().toISOString(),
  }).eq('id', chatId);

  return data;
};

export const subscribeToMessages = (chatId, callback) =>
  supabase
    .channel(`messages:${chatId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_id=eq.${chatId}`,
    }, payload => callback(payload.new))
    .subscribe();

// ── Notifications ─────────────────────────────────────────────────────────────

export const fetchNotifications = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, read, created_at, type, kind')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((n) => ({
    ...n,
    kind: n.kind ?? n.type ?? 'event',
  }));
};

export const markAllNotificationsRead = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
};

// ── Funnel stats ──────────────────────────────────────────────────────────────

export const fetchFunnelStats = async () => {
  const [views, rsvps, tickets, reviews] = await Promise.all([
    supabase.from('events').select('likes', { count: 'exact' }),
    supabase.from('event_rsvps').select('event_id', { count: 'exact' }),
    supabase.from('tickets').select('id', { count: 'exact' }),
    supabase.from('event_reviews').select('rating'),
  ]);

  const totalViews   = (views.count ?? 0) * 100; // likes as proxy, scaled
  const totalRsvps   = rsvps.count  ?? 0;
  const totalTickets = tickets.count ?? 0;

  const ratings = (reviews.data ?? []).map(r => r.rating);
  const avgRating = ratings.length
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : 0;

  return { totalViews, totalRsvps, totalTickets, avgRating, reviewCount: ratings.length };
};

export const fetchPendingEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, org, created_at, category, image_url')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const fetchRecentReviews = async () => {
  const { data, error } = await supabase
    .from('event_reviews')
    .select('id, event_title, rating, body, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(5);
  if (error) throw error;
  return data ?? [];
};

// ── Real-time activity ────────────────────────────────────────────────────────

export const subscribeToActivity = (callback) => {
  const ch = supabase
    .channel('realtime-activity')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_rsvps' },
      p => callback({ kind: 'rsvp', ...p.new }))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' },
      p => callback({ kind: 'ticket', ...p.new }))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'event_likes' },
      p => callback({ kind: 'like', ...p.new }))
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_members' },
      p => callback({ kind: 'group', ...p.new }))
    .subscribe();
  return ch;
};
