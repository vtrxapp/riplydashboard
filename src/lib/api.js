import { supabase } from './supabase';

// ── Auth ──────────────────────────────────────────────────────────────────────
// Identity now comes from Clerk, not Supabase Auth. Callers pass the Clerk
// userId in (e.g. from useAuth()/useUser()) rather than us reading it here.

export const signOut = () => window.Clerk?.signOut();

export const getCurrentUser = async (userId) => {
  if (!userId) return null;
  const { data } = await supabase.from('users').select('*').eq('id', userId).single();
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

export const createEvent = async (payload, userId, status = 'pending') => {
  const { data, error } = await supabase
    .from('events')
    .insert({ ...payload, created_by: userId, status })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const uploadEventCover = async (file) => {
  const ext = file.name.split('.').pop();
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('event-covers').upload(path, file);
  if (error) throw error;
  const { data } = supabase.storage.from('event-covers').getPublicUrl(path);
  return data.publicUrl;
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
    .select('id, name, initial, color, last_message, last_message_at, group_id')
    .order('last_message_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

// Reuses the existing chat for a group (chats.group_id is unique per group)
// instead of creating a duplicate every time the admin clicks "Message".
export const startGroupChat = async (group, adminUserId) => {
  const { data: existing, error: findError } = await supabase
    .from('chats')
    .select('id, name, initial, color, last_message, last_message_at, group_id')
    .eq('group_id', group.id)
    .maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const { data: chat, error } = await supabase
    .from('chats')
    .insert({
      group_id: group.id,
      name: group.name,
      initial: group.initial || group.name?.charAt(0) || '?',
      color: group.logo_color || null,
    })
    .select('id, name, initial, color, last_message, last_message_at, group_id')
    .single();
  if (error) throw error;

  if (adminUserId) {
    // Best-effort: chat_participants tracks who's in the thread, but a
    // missing row here shouldn't block the admin from messaging the group.
    await supabase.from('chat_participants').insert({ chat_id: chat.id, user_id: adminUserId });
  }
  return chat;
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

export const sendMessage = async (chatId, content, userId) => {
  const { data, error } = await supabase
    .from('messages')
    .insert({ chat_id: chatId, sender_id: userId, content })
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

export const fetchNotifications = async (userId) => {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('id, user_id, title, body, read, created_at, type, kind')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data ?? []).map((n) => ({
    ...n,
    kind: n.kind ?? n.type ?? 'event',
  }));
};

export const markAllNotificationsRead = async (userId) => {
  if (!userId) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId);
  if (error) throw error;
};

// ── Funnel stats ──────────────────────────────────────────────────────────────

export const fetchFunnelStats = async () => {
  // No real view-tracking exists (no page-view/impression table), so there's
  // no "views" stage here at all — RSVPs are the first measurable stage.
  //
  // Ratings are aggregated with per-star exact counts (head: true, no rows
  // returned) rather than `select('rating')`, so this stays correct past
  // Supabase's ~1000-row default return cap as event_reviews grows.
  const [rsvps, tickets, totalReviews, ...starCounts] = await Promise.all([
    supabase.from('event_rsvps').select('event_id', { count: 'exact', head: true }),
    supabase.from('tickets').select('id', { count: 'exact', head: true }),
    supabase.from('event_reviews').select('id', { count: 'exact', head: true }),
    ...[5, 4, 3, 2, 1].map(stars =>
      supabase.from('event_reviews').select('id', { count: 'exact', head: true }).eq('rating', stars)
    ),
  ]);

  for (const res of [rsvps, tickets, totalReviews, ...starCounts]) {
    if (res.error) throw res.error;
  }

  const totalRsvps   = rsvps.count  ?? 0;
  const totalTickets = tickets.count ?? 0;
  const reviewCount  = totalReviews.count ?? 0;

  const ratingBreakdown = [5, 4, 3, 2, 1].map((stars, i) => {
    const count = starCounts[i].count ?? 0;
    return { stars, count, pct: reviewCount ? Math.round((count / reviewCount) * 100) : 0 };
  });
  const weightedSum = ratingBreakdown.reduce((sum, r) => sum + r.stars * r.count, 0);
  const avgRating = reviewCount ? (weightedSum / reviewCount).toFixed(1) : 0;

  return { totalRsvps, totalTickets, avgRating, reviewCount, ratingBreakdown };
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
