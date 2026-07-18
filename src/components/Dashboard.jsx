import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchOverviewKpis,
  fetchEvents, createEvent, uploadEventCover, updateEventStatus, deleteEvent,
  fetchGroups,
  fetchUsers,
  fetchChats, fetchMessages, sendMessage, subscribeToMessages, startGroupChat,
  fetchNotifications, markAllNotificationsRead,
  fetchFunnelStats, fetchPendingEvents, fetchRecentReviews,
  subscribeToActivity,
  signOut,
} from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useAuth as useClerkAuth } from '@clerk/clerk-react';

function svgUri(svg, color) {
  const s = svg.split('"C"').join('"' + color + '"')
    .replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  return 'url("data:image/svg+xml,' + encodeURIComponent(s) + '")';
}
function iconSt(svg, color, size = 19) {
  return { width: size, height: size, backgroundImage: svgUri(svg, color), backgroundSize: 'contain', backgroundRepeat: 'no-repeat' };
}

const SUN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4.2" stroke="C" stroke-width="1.9"/><path d="M12 2.5v2.2M12 19.3v2.2M4.6 4.6l1.6 1.6M17.8 17.8l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.6 19.4l1.6-1.6M17.8 6.2l1.6-1.6" stroke="C" stroke-width="1.9" stroke-linecap="round"/></svg>';
const MOON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.3 6.3 0 0 0 10.5 10.5Z" stroke="C" stroke-width="1.9" stroke-linejoin="round"/></svg>';
const UP_ARROW = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 19V5m0 0-6 6m6-6 6 6" stroke="C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const DOWN_ARROW = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m0 0 6-6m-6 6-6-6" stroke="C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7.5" height="7.5" rx="2" stroke="C" stroke-width="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" stroke="C" stroke-width="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" stroke="C" stroke-width="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" stroke="C" stroke-width="2"/></svg>' },
  { id: 'events', label: 'Events', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="C" stroke-width="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="C" stroke-width="2" stroke-linecap="round"/></svg>' },
  { id: 'groups', label: 'Groups', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="8" cy="9" r="2.6" stroke="C" stroke-width="2"/><circle cx="16" cy="9" r="2.6" stroke="C" stroke-width="2"/><path d="M3.5 18c0-2.4 2-3.8 4.5-3.8M20.5 18c0-2.4-2-3.8-4.5-3.8M9 18c0-2 1.4-3.2 3-3.2s3 1.2 3 3.2" stroke="C" stroke-width="2" stroke-linecap="round"/></svg>' },
  { id: 'funnel', label: 'Funnel', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" stroke="C" stroke-width="2" stroke-linejoin="round"/></svg>' },
  { id: 'users', label: 'Users', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="C" stroke-width="2"/><path d="M5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6" stroke="C" stroke-width="2" stroke-linecap="round"/></svg>' },
  { id: 'activity', label: 'Activity', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 12h4l2.5-6 5 14 2.5-8H21" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>', live: true },
];

const RANGES = [{ id: '7d', label: '7D' }, { id: '30d', label: '30D' }, { id: '90d', label: '90D' }, { id: '1y', label: '1Y' }];
const SCOPES = ['My events', 'My groups', 'Campus-wide'];

const PAGE = {
  overview: { title: 'Overview', sub: 'Engagement across your events & communities' },
  events:   { title: 'Events Analytics', sub: 'Performance of your published events' },
  groups:   { title: 'Groups & Communities', sub: 'Membership growth and activity' },
  funnel:   { title: 'Engagement Funnel', sub: 'From discovery to attendance' },
  users:    { title: 'Users & Audience', sub: 'Who is engaging with your content' },
  activity: { title: 'Real-time Activity', sub: 'Live engagement as it happens' },
  messages: { title: 'Messages', sub: 'Reach out to UMSU administrators' },
  create:   { title: 'Create Event', sub: 'Publish a new event to the Riply feed' },
};

const CE_CATS = [
  { id: 'social',   label: 'Social',   grad: 'linear-gradient(135deg,#FF5A8A,#FF8A3D)' },
  { id: 'career',   label: 'Career',   grad: 'linear-gradient(135deg,#2F6BFF,#6C4DF2)' },
  { id: 'sports',   label: 'Sports',   grad: 'linear-gradient(135deg,#10B981,#06B6D4)' },
  { id: 'academic', label: 'Academic', grad: 'linear-gradient(135deg,#7C5CFF,#B06BFF)' },
  { id: 'festival', label: 'Festival', grad: 'linear-gradient(135deg,#FF6B6B,#FFB347)' },
];

const CONVOS = [
  { id: 'umsu',       name: 'UMSU Admin Office',    role: 'Student Union', initial: 'U', avBg: 'linear-gradient(135deg,#19BFFF,#0E84E0)', online: true,  status: 'Online now',     preview: "Perfect. I'll approve the venue…", time: '9:50 AM' },
  { id: 'facilities', name: 'Facilities & Bookings', role: 'Operations',   initial: 'F', avBg: 'linear-gradient(135deg,#10B981,#06B6D4)', online: true,  status: 'Active 12m ago', preview: 'Courts are reserved for your…',      time: 'Yest.' },
  { id: 'finance',    name: 'Finance Office',        role: 'Payments',     initial: '$', avBg: 'linear-gradient(135deg,#7C5CFF,#B06BFF)', online: false, status: 'Active 1h ago',  preview: 'Ticket payout processed — $6.4K',  time: 'Mon' },
  { id: 'safety',     name: 'Campus Safety',         role: 'Compliance',   initial: 'S', avBg: 'linear-gradient(135deg,#FF6B6B,#FFB347)', online: false, status: 'Active 3h ago',  preview: 'Please submit the risk form…',     time: 'Mon' },
];

const INIT_THREADS = {
  umsu: [
    { from: 'them', text: "Hi Jane — thanks for submitting the Winter Festival proposal. Looks great overall!", time: '9:42 AM' },
    { from: 'them', text: 'Could you confirm the expected headcount for the Central Quad booking?', time: '9:43 AM' },
    { from: 'me',   text: "Of course! We're expecting around 8,000 across the day.", time: '9:48 AM' },
    { from: 'them', text: "Perfect. I'll approve the venue and loop in facilities. 🎉", time: '9:50 AM' },
  ],
  facilities: [{ from: 'them', text: 'The Active Living Centre courts are reserved for your 3v3 tournament.', time: 'Yesterday' }],
  finance:    [{ from: 'them', text: 'Ticket payout for the Career Fair has been processed — $6.4K.', time: 'Mon' }],
  safety:     [{ from: 'them', text: 'Please submit the risk assessment form before the Karaoke Night event.', time: 'Mon' }],
};

const ACT_ICONS = {
  rsvp:   { bg: '#E9F6FF', color: '#0098F0', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  ticket: { bg: '#E4F7EC', color: '#15A34A', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.7 1.7 0 0 0 0 3.3 1.7 1.7 0 0 0 0 3.4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.7 1.7 0 0 0 0-3.4 1.7 1.7 0 0 0 0-3.3Z" stroke="C" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
  event:  { bg: '#F1ECFF', color: '#7C5CFF', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="C" stroke-width="1.9"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="C" stroke-width="1.9" stroke-linecap="round"/></svg>' },
  group:  { bg: '#FFF1F5', color: '#FF5A8A', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="2.4" stroke="C" stroke-width="1.9"/><circle cx="16" cy="9" r="2.4" stroke="C" stroke-width="1.9"/><path d="M4 18c0-2 1.6-3.2 4-3.2M20 18c0-2-1.6-3.2-4-3.2" stroke="C" stroke-width="1.9" stroke-linecap="round"/></svg>' },
  like:   { bg: '#FFF6EC', color: '#F59E0B', svg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 20S4 15 4 9.5A3.8 3.8 0 0 1 12 7a3.8 3.8 0 0 1 8 2.5C20 15 12 20 12 20Z" stroke="C" stroke-width="1.9" stroke-linejoin="round"/></svg>' },
};

const NOTIFS = [
  { id: 'n1', kind: 'rsvp',   text: 'Your event "Karaoke Night" passed 500 RSVPs 🎉',      time: '8 min ago' },
  { id: 'n2', kind: 'event',  text: 'UMSU Admin approved "Winter Campus Festival"',          time: '1 hour ago' },
  { id: 'n3', kind: 'ticket', text: '42 new tickets sold for Spring Career Fair',            time: '3 hours ago' },
  { id: 'n4', kind: 'group',  text: 'Photography Club gained 58 new members this week',     time: 'Yesterday' },
];

// ── Charts ────────────────────────────────────────────────────────────────────

function Donut({ values, colors, centerVal, centerLabel, theme }) {
  const total = values.reduce((a, b) => a + b, 0) || 1;
  const size = 150, r = 56, cx = size / 2, cy = size / 2, sw = 22, C = 2 * Math.PI * r;
  let acc = 0;
  const dark = theme === 'dark';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={dark ? '#2A3446' : '#F1F3F6'} strokeWidth={sw}/>
      {values.map((v, i) => {
        const frac = v / total, dash = frac * C;
        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={colors[i]} strokeWidth={sw} strokeDasharray={`${dash} ${C - dash}`} strokeDashoffset={-acc * C} transform={`rotate(-90 ${cx} ${cy})`} strokeLinecap="butt"/>;
        acc += frac;
        return el;
      })}
      <text x={cx} y={cy-2} textAnchor="middle" fontSize={30} fontWeight={800} fontFamily="Montserrat" fill={dark ? '#F4F6FA' : '#0E1726'}>{centerVal}</text>
      <text x={cx} y={cy+18} textAnchor="middle" fontSize={11} fontWeight={600} fontFamily="Montserrat" fill="#9AA3B2">{centerLabel}</text>
    </svg>
  );
}

function Stars({ rating, size = 13 }) {
  return [0,1,2,3,4].map(i => (
    <span key={i} style={{ display: 'inline-block' }} dangerouslySetInnerHTML={{ __html:
      i < Math.round(rating)
        ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#FFB020"><path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9 6.2 20.95l1.1-6.45-4.7-4.6 6.5-.95L12 2.5Z"/></svg>`
        : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="#E4E8EF"><path d="M12 2.5l2.9 5.9 6.5.95-4.7 4.6 1.1 6.45L12 17.9 6.2 20.95l1.1-6.45-4.7-4.6 6.5-.95L12 2.5Z"/></svg>`
    }}/>
  ));
}

function DeltaBadge({ pos, delta }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 24, padding: '0 9px', borderRadius: 999, background: pos ? '#E4F7EC' : '#FDE7E4' }}>
      <div style={iconSt(pos ? UP_ARROW : DOWN_ARROW, pos ? '#15A34A' : '#E5484D', 11)}/>
      <span style={{ fontSize: 13, fontWeight: 800, color: pos ? '#15A34A' : '#E5484D' }}>{delta}</span>
    </div>
  );
}

function KpiCard({ label, value, delta, pos, iconBg, iconSvg, iconColor }) {
  return (
    <div style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={iconSt(iconSvg, iconColor, 20)}/>
        </div>
        {delta && <DeltaBadge pos={pos} delta={delta}/>}
      </div>
      <div style={{ fontSize: 29, fontWeight: 800, letterSpacing: -1, marginTop: 14 }}>{value}</div>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#7B8499', marginTop: 2 }}>{label}</div>
    </div>
  );
}

// ── Overview view ─────────────────────────────────────────────────────────────
function OverviewView({ theme, onViewAllEvents, kpis, events, liveEvents, funnelStats }) {
  const fmt = n => n == null ? '—' : n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n);
  // No historical snapshots exist yet to compute real period-over-period
  // deltas or sparklines from, so those are omitted rather than faked.
  const kpiDefs = [
    { label: 'Total Users',      value: fmt(kpis?.totalUsers),   iconBg: '#E9F6FF', color: '#0098F0', icon: NAV_ITEMS[4].icon },
    { label: 'Events Published', value: fmt(kpis?.totalEvents),  iconBg: '#F1ECFF', color: '#7C5CFF', icon: NAV_ITEMS[1].icon },
    { label: 'Total RSVPs',      value: fmt(kpis?.totalRsvps),   iconBg: '#E4F7EC', color: '#15A34A', icon: ACT_ICONS.ticket.svg },
    { label: 'Tickets Sold',     value: fmt(kpis?.totalTickets), iconBg: '#FFF6EC', color: '#F59E0B', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4 4L19 7" stroke="C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  ];
  const catColors = { social:'linear-gradient(135deg,#FF5A8A,#FF8A3D)', career:'linear-gradient(135deg,#2F6BFF,#6C4DF2)', academic:'linear-gradient(135deg,#7C5CFF,#B06BFF)', sports:'linear-gradient(135deg,#10B981,#06B6D4)', festival:'linear-gradient(135deg,#FF6B6B,#FFB347)' };
  const topEvents = (events.length ? events : []).slice(0, 5);
  // funnelStats is null while loading or if the fetch failed — distinct
  // from a real zero, so it gets its own "unavailable" state below rather
  // than silently rendering as an all-zero funnel.
  const funnelUnavailable = funnelStats == null;
  // No real view-tracking data source exists — RSVPs are the first
  // measurable stage of the funnel.
  const rsvps = funnelStats?.totalRsvps || 0;
  const tickets = funnelStats?.totalTickets || 0;
  const pctOf = (n, of) => of > 0 ? ((n / of) * 100).toFixed(1) + '%' : '—';
  const widthOf = (n, of) => of > 0 ? Math.max(0, Math.min(100, (n / of) * 100)) : 0;
  const funnelDefs = [
    { label: 'RSVPs',          value: fmt(rsvps),   pct: rsvps > 0 ? '100%' : '—', w: rsvps > 0 ? 100 : 0, c: '#19BFFF' },
    { label: 'Tickets Bought', value: fmt(tickets), pct: pctOf(tickets, rsvps), w: widthOf(tickets, rsvps), c: '#15A34A' },
  ];
  const overallConversion = pctOf(tickets, rsvps);
  // liveEvents only contains realtime INSERTs received since this page
  // mounted — it isn't hydrated with pre-existing activity, so "no items
  // yet" means "nothing new happened while this tab was open," not
  // "there's no activity at all."
  const feedItems = liveEvents.length > 0 ? liveEvents : [];

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpiDefs.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} iconBg={k.iconBg} iconSvg={k.icon} iconColor={k.color}/>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Engagement Trend</div>
              <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Active users vs. RSVPs over time</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: '#0098F0' }}/><span style={{ fontSize: 13, fontWeight: 600, color: '#5B6473' }}>Active users</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: '#FFB020' }}/><span style={{ fontSize: 13, fontWeight: 600, color: '#5B6473' }}>RSVPs</span></div>
            </div>
          </div>
          {/* No historical snapshots exist yet to plot a real trend from —
              show an honest empty state instead of a fabricated chart. */}
          <div style={{ marginTop: 18, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
            No engagement history yet — check back once your community starts using the app
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Engagement Funnel</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>RSVP → Ticket</div>
          {funnelUnavailable ? (
            <div style={{ marginTop: 18, padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
              Funnel data unavailable
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 18 }}>
                {funnelDefs.map((f, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2233' }}>{f.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: '#0E1726' }}>{f.value} <span style={{ fontSize: 12, fontWeight: 600, color: '#9AA3B2' }}>({f.pct})</span></span>
                    </div>
                    <div style={{ height: 12, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: f.w + '%', borderRadius: 999, background: f.c }}/>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #EEF1F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#7B8499' }}>Overall conversion</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#22C55E' }}>{overallConversion}</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Top Events</div>
            <button onClick={onViewAllEvents} style={{ fontSize: 13.5, fontWeight: 700, color: '#0098F0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View all →</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr 1fr', gap: 8, padding: '14px 4px 10px', borderBottom: '1px solid #EEF1F6' }}>
            {['Event','RSVPs','Attend','Conv.'].map((h,i) => <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: '#9AA3B2', textTransform: 'uppercase', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>)}
          </div>
          {topEvents.map((e, i) => {
            const grad = catColors[(e.category || '').toLowerCase()] || 'linear-gradient(135deg,#7C5CFF,#B06BFF)';
            const attend = e.capacity > 0 ? Math.round((e.attendee_count / e.capacity) * 100) : null;
            return (
              <div key={e.id || i} style={{ display: 'grid', gridTemplateColumns: '1.8fr 0.8fr 0.8fr 1fr', gap: 8, alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flex: 'none', background: grad, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.16) 0,rgba(255,255,255,0.16) 2px,transparent 2px,transparent 8px)' }}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: '#9AA3B2' }}>{e.category}</div>
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{e.attendee_count ?? '—'}</span>
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{attend != null ? attend + '%' : '—'}</span>
                <span style={{ fontSize: 13.5, fontWeight: 800, textAlign: 'right', color: attend >= 80 ? '#15A34A' : attend >= 60 ? '#F59E0B' : '#7B8499' }}>{attend != null ? attend + '%' : '—'}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Live Activity</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'rdPulse 1.6s ease-in-out infinite' }}/>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#22C55E' }}>Live</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 14 }}>
            {feedItems.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
                No new activity yet
              </div>
            )}
            {feedItems.slice(0, 6).map((a, i) => {
              const ic = ACT_ICONS[a.kind] || ACT_ICONS.rsvp;
              const who = a.who || a.user_id?.slice(0, 8) || 'User';
              const action = a.action || (a.kind === 'rsvp' ? "RSVP'd to" : a.kind === 'ticket' ? 'bought a ticket for' : a.kind === 'like' ? 'liked' : 'joined');
              const target = a.target || a.event_id || '';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 11, padding: '9px 0' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ic.bg }}>
                    <div style={iconSt(ic.svg, ic.color, 15)}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, color: '#1A2233', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 700 }}>{who}</span> {action} <span style={{ fontWeight: 700 }}>{target}</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#9AA3B2', marginTop: 2 }}>{i === 0 ? 'just now' : (a.t != null ? a.t + ' min ago' : 'recently')}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Events Analytics view ─────────────────────────────────────────────────────
function EventsView({ theme, evFilter, setEvFilter, events, onApprove, onReject, onDelete }) {
  const catColors = { social:'#FF5A8A', career:'#2F6BFF', academic:'#7C5CFF', sports:'#10B981', festival:'#FF6B6B' };
  const catGrads = { social:'linear-gradient(135deg,#FF5A8A,#FF8A3D)', career:'linear-gradient(135deg,#2F6BFF,#6C4DF2)', academic:'linear-gradient(135deg,#7C5CFF,#B06BFF)', sports:'linear-gradient(135deg,#10B981,#06B6D4)', festival:'linear-gradient(135deg,#FF6B6B,#FFB347)' };

  const published = events.filter(e => e.status === 'published').length;
  const upcoming  = events.filter(e => e.status === 'upcoming').length;
  const draft     = events.filter(e => e.status === 'draft').length;
  const pending   = events.filter(e => e.status === 'pending').length;
  const total     = events.length;

  const catCounts = {};
  events.forEach(e => { const k = (e.category||'other').toLowerCase(); catCounts[k] = (catCounts[k]||0)+1; });
  const catEntries = Object.entries(catCounts).sort((a,b) => b[1]-a[1]).slice(0,5);
  const maxCat = catEntries[0]?.[1] || 1;
  const catDefs = catEntries.map(([label, count]) => ({ label: label.charAt(0).toUpperCase()+label.slice(1), count, w: Math.round((count/maxCat)*100), c: catColors[label] || '#9AA3B2' }));

  const statusLegend = [
    { label: 'Published', value: String(published), color: '#22C55E' },
    { label: 'Upcoming',  value: String(upcoming),  color: '#0098F0' },
    { label: 'Draft',     value: String(draft),     color: '#D4D9E2' },
    ...(pending > 0 ? [{ label: 'Pending', value: String(pending), color: '#F59E0B' }] : []),
  ];

  const EVF = [{ id: 'all', label: 'All' }, { id: 'published', label: 'Published' }, { id: 'upcoming', label: 'Upcoming' }, { id: 'draft', label: 'Draft' }, { id: 'pending', label: 'Pending' }];

  const statusStyles = {
    published: { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#E4F7EC', color: '#15A34A', fontSize: 12.5, fontWeight: 800 },
    upcoming:  { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#E9F6FF', color: '#0098F0', fontSize: 12.5, fontWeight: 800 },
    draft:     { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#F1F3F7', color: '#9AA3B2', fontSize: 12.5, fontWeight: 800 },
    pending:   { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#FFF6EC', color: '#D9890B', fontSize: 12.5, fontWeight: 800 },
  };

  const kpiDefs = [
    { label: 'Total Events',    value: String(total),     iconBg: '#F1ECFF', color: '#7C5CFF', icon: NAV_ITEMS[1].icon },
    { label: 'Published',       value: String(published), delta: String(published > 0 ? `${published}/${total}` : '0'), pos: published > 0, iconBg: '#E4F7EC', color: '#15A34A', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4 4L19 7" stroke="C" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { label: 'Upcoming',        value: String(upcoming),  delta: String(upcoming),  pos: upcoming > 0, iconBg: '#E9F6FF', color: '#0098F0', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="C" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { label: 'Pending Approval',value: String(pending),   delta: String(pending > 0 ? 'review' : 'none'), pos: pending === 0, iconBg: '#FFF6EC', color: '#F59E0B', icon: ACT_ICONS.ticket.svg },
  ];

  const filtered = events.filter(e => evFilter === 'all' || e.status === evFilter);

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpiDefs.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} delta={k.delta} pos={k.pos} iconBg={k.iconBg} iconSvg={k.icon} iconColor={k.color}/>
        ))}
      </div>

      {/* Category bars + status donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Events by Category</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>RSVPs generated per category</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginTop: 18 }}>
            {catDefs.map((c, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2233' }}>{c.label}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#7B8499' }}>{c.value} <span style={{ color: '#B6BCC8' }}>· {c.count} events</span></span>
                </div>
                <div style={{ height: 12, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: c.w + '%', borderRadius: 999, background: c.c }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Status Breakdown</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Across all your events</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
            <Donut values={[published||1, upcoming, draft, pending]} colors={['#22C55E', '#0098F0', '#D4D9E2', '#F59E0B']} centerVal={String(total)} centerLabel="events" theme={theme}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {statusLegend.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: l.color, flex: 'none' }}/>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#5B6473' }}>{l.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0E1726' }}>{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All Events table */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>All Events</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {EVF.map(f => (
              <button key={f.id} onClick={() => setEvFilter(f.id)} style={{ border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '8px 13px', background: f.id === evFilter ? '#0098F0' : '#F1F3F7', color: f.id === evFilter ? '#fff' : '#7B8499' }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.9fr 0.8fr 0.8fr 0.9fr 1fr', gap: 8, padding: '14px 4px 10px', borderBottom: '1px solid #EEF1F6' }}>
          {['Event','Date','Status','Likes','Attend','Rate','Actions'].map((h, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: '#9AA3B2', textTransform: 'uppercase', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((e, i) => {
            const grad = catGrads[(e.category||'').toLowerCase()] || 'linear-gradient(135deg,#7C5CFF,#B06BFF)';
            const st = e.status || 'draft';
            const dateStr = e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';
            const attend = e.capacity > 0 && e.attendee_count > 0 ? Math.round((e.attendee_count/e.capacity)*100)+'%' : '—';
            return (
              <div key={e.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 0.9fr 0.8fr 0.8fr 0.9fr 1fr', gap: 8, alignItems: 'center', padding: '13px 4px', borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, flex: 'none', background: grad, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.16) 0,rgba(255,255,255,0.16) 2px,transparent 2px,transparent 8px)' }}/>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</div>
                    <div style={{ fontSize: 12, color: '#9AA3B2' }}>{e.category}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#5B6473' }}>{dateStr}</span>
                <span><span style={statusStyles[st] || statusStyles.draft}>{st.charAt(0).toUpperCase()+st.slice(1)}</span></span>
                <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', color: '#5B6473' }}>{e.likes ?? 0}</span>
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{e.attendee_count ?? 0}</span>
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{attend}</span>
                <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                  {st === 'pending' && onApprove && (
                    <button onClick={() => onApprove(e.id, e.title)} style={{ height: 28, padding: '0 8px', borderRadius: 8, border: 'none', background: '#E4F7EC', color: '#15A34A', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✓</button>
                  )}
                  {st === 'pending' && onReject && (
                    <button onClick={() => onReject(e.id, e.title)} style={{ height: 28, padding: '0 8px', borderRadius: 8, border: 'none', background: '#FDE7E4', color: '#E5484D', fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>✗</button>
                  )}
                  {onDelete && (
                    <button onClick={() => onDelete(e.id)} style={{ height: 28, padding: '0 8px', borderRadius: 8, border: '1.5px solid #E8EBF0', background: '#fff', color: '#9AA3B2', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>del</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Groups & Communities view ─────────────────────────────────────────────────
function GroupsView({ theme, grpFilter, setGrpFilter, groups, onMessageGroup, startingChatGroupId }) {
  const totalMembers = groups.reduce((s, g) => s + (g.member_count || 0), 0);
  const fmt = n => n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'K' : String(n);
  // No historical snapshots exist yet for real deltas/sparklines, and no
  // join-timestamp query is wired up yet for a real "new joins" count —
  // both omitted rather than faked.
  const kpiDefs = [
    { label: 'Total Communities', value: String(groups.length), iconBg: '#F1ECFF', color: '#7C5CFF', icon: NAV_ITEMS[2].icon },
    { label: 'Total Members',     value: fmt(totalMembers),     iconBg: '#E9F6FF', color: '#0098F0', icon: NAV_ITEMS[4].icon },
    { label: 'New Joins (30d)',   value: '—',                   iconBg: '#E4F7EC', color: '#15A34A', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.2" stroke="C" stroke-width="1.9"/><path d="M3.5 19c0-3.2 2.5-4.8 5.5-4.8" stroke="C" stroke-width="1.9" stroke-linecap="round"/><path d="M17 8v6M14 11h6" stroke="C" stroke-width="1.9" stroke-linecap="round"/></svg>' },
    { label: 'Avg. Events/Group', value: groups.length > 0 ? (groups.reduce((s,g) => s+(g.event_count||0),0)/groups.length).toFixed(1) : '0', iconBg: '#FFF6EC', color: '#F59E0B', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 12h4l2.5-6 5 14 2.5-8H21" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  ];

  const pubCount = groups.filter(g => g.privacy === 'public').length;
  const privCount = groups.filter(g => g.privacy === 'private').length;
  const invCount = groups.filter(g => g.privacy !== 'public' && g.privacy !== 'private').length;
  const typeLegend = [
    { label: 'Public',      value: String(pubCount),  color: '#0098F0' },
    { label: 'Private',     value: String(privCount), color: '#7C5CFF' },
    { label: 'Other',       value: String(invCount),  color: '#FFB020' },
  ];

  const typeStyles = {
    public:  { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#E9F6FF', color: '#0098F0', fontSize: 12.5, fontWeight: 800 },
    private: { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#F1ECFF', color: '#7C5CFF', fontSize: 12.5, fontWeight: 800 },
    invite:  { display: 'inline-flex', alignItems: 'center', height: 23, padding: '0 10px', borderRadius: 999, background: '#FFF6EC', color: '#D9890B', fontSize: 12.5, fontWeight: 800 },
  };

  const GRF = [{ id: 'all', label: 'All' }, { id: 'public', label: 'Public' }, { id: 'private', label: 'Private' }];

  const grpColors = ['linear-gradient(135deg,#2F6BFF,#6C4DF2)','linear-gradient(135deg,#FF5A8A,#FF8A3D)','linear-gradient(135deg,#7C5CFF,#B06BFF)','linear-gradient(135deg,#10B981,#06B6D4)','linear-gradient(135deg,#FF6B6B,#FFB347)','linear-gradient(135deg,#2F6BFF,#5B7CFF)'];
  const filtered = groups
    .filter(g => grpFilter === 'all' || g.privacy === grpFilter);

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpiDefs.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} iconBg={k.iconBg} iconSvg={k.icon} iconColor={k.color}/>
        ))}
      </div>

      {/* Member growth + group types */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Member Growth</div>
              <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>New joins vs. active members</div>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: '#7C5CFF' }}/><span style={{ fontSize: 13, fontWeight: 600, color: '#5B6473' }}>Active</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ width: 11, height: 11, borderRadius: 3, background: '#19BFFF' }}/><span style={{ fontSize: 13, fontWeight: 600, color: '#5B6473' }}>New joins</span></div>
            </div>
          </div>
          {/* No historical membership snapshots exist yet to plot a real
              growth trend from. */}
          <div style={{ marginTop: 18, height: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
            No growth history yet
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Group Types</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Public vs. private vs. invite</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
            <Donut values={[pubCount||1, privCount, invCount]} colors={['#0098F0', '#7C5CFF', '#FFB020']} centerVal={String(groups.length)} centerLabel="groups" theme={theme}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            {typeLegend.map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ width: 11, height: 11, borderRadius: 3, background: l.color, flex: 'none' }}/>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#5B6473' }}>{l.label}</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#0E1726' }}>{l.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top communities table */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Top Communities</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {GRF.map(f => (
              <button key={f.id} onClick={() => setGrpFilter(f.id)} style={{ border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, padding: '8px 13px', background: f.id === grpFilter ? '#0098F0' : '#F1F3F7', color: f.id === grpFilter ? '#fff' : '#7B8499' }}>{f.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', gap: 8, padding: '14px 4px 10px', borderBottom: '1px solid #EEF1F6' }}>
          {['Community','Type','Members','New (30d)','Active'].map((h, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: '#9AA3B2', textTransform: 'uppercase', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
          ))}
          <span />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((g, i) => {
            const grad = g.logo_color || grpColors[i % grpColors.length];
            const initial = g.initial || g.name?.charAt(0) || '?';
            const privacy = g.privacy || 'public';
            const typeStyle = typeStyles[privacy] || typeStyles.public;
            const starting = startingChatGroupId === g.id;
            return (
              <div key={g.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px', gap: 8, alignItems: 'center', padding: '13px 4px', borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 11, flex: 'none', background: grad, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, fontWeight: 800 }}>
                    <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.16) 0,rgba(255,255,255,0.16) 2px,transparent 2px,transparent 8px)' }}/>
                    <span style={{ position: 'relative' }}>{initial}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                    <div style={{ fontSize: 12, color: '#9AA3B2' }}>{g.category}</div>
                  </div>
                </div>
                <span><span style={typeStyle}>{privacy.charAt(0).toUpperCase()+privacy.slice(1)}</span></span>
                <span style={{ fontSize: 14, fontWeight: 700, textAlign: 'right' }}>{(g.member_count ?? 0).toLocaleString()}</span>
                <span style={{ fontSize: 14, fontWeight: 800, textAlign: 'right', color: '#15A34A' }}>{g.event_count ?? 0} events</span>
                <span style={{ fontSize: 14, fontWeight: 600, textAlign: 'right', color: '#5B6473' }}>{g.post_count ?? 0} posts</span>
                <span style={{ textAlign: 'right' }}>
                  <button onClick={() => onMessageGroup?.(g)} disabled={starting} style={{ height: 30, padding: '0 12px', borderRadius: 9, border: '1.5px solid #E8EBF0', background: '#fff', color: '#0098F0', fontSize: 12.5, fontWeight: 700, cursor: starting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: starting ? 0.6 : 1 }}>
                    {starting ? 'Opening…' : 'Message'}
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Funnel & Moderation view ──────────────────────────────────────────────────
function FunnelView({ theme, funnelStats, pendingEvents, recentReviews, onApprove, onReject, showToast }) {
  const avgRating = funnelStats?.avgRating ?? 0;
  // No real view-tracking data source exists — RSVPs are the first
  // measurable stage of the funnel.
  const totalRsvps = funnelStats?.totalRsvps ?? 0;
  const totalTickets = funnelStats?.totalTickets ?? 0;
  const reviewCount = funnelStats?.reviewCount ?? 0;
  const pctOf = (n, of) => of > 0 ? ((n / of) * 100).toFixed(1) : null;
  const conv = pctOf(totalTickets, totalRsvps); // real: RSVPs -> tickets
  const rsvpToTicketDrop = conv != null ? (100 - parseFloat(conv)).toFixed(1) : null;

  const kpiDefs = [
    { label: 'Overall Conversion', value: conv != null ? conv + '%' : '—', iconBg: '#E4F7EC', color: '#15A34A', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 8v6l-4-2v-4L3 5Z" stroke="C" stroke-width="2" stroke-linejoin="round"/></svg>' },
    { label: 'Avg. Event Rating',  value: String(avgRating || '—'), iconBg: '#FFF6EC', color: '#F59E0B', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.6 5.3 5.9.85-4.25 4.15.99 5.85L12 16.9 6.75 19.05l.99-5.85L3.5 9.15l5.9-.85L12 3Z" stroke="C" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
    { label: 'Pending Approvals',  value: String(pendingEvents.length), delta: 'live', pos: pendingEvents.length === 0, iconBg: '#E9F6FF', color: '#0098F0', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8.5" stroke="C" stroke-width="1.9"/><path d="M12 8v4.5l3 2" stroke="C" stroke-width="1.9" stroke-linecap="round"/></svg>' },
    { label: 'Biggest Drop-off',   value: 'RSVP→Ticket', delta: rsvpToTicketDrop != null ? '-' + rsvpToTicketDrop + '%' : '—', pos: false, iconBg: '#FDE7E4', color: '#E5484D', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 6l7 7 3-3 6 6" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 16v-4h-4" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  ];

  const fmt = n => n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'K' : String(n);
  // No "Attended" stage — RSVPs/tickets don't track actual attendance, so
  // there's no real data source for it. RSVPs are the first real stage.
  const stages = [
    { label: 'RSVPs',          value: fmt(totalRsvps),   pct: totalRsvps > 0 ? '100%' : '—', w: totalRsvps > 0 ? 100 : 0, c: '#19BFFF', drop: '' },
    { label: 'Tickets Bought', value: fmt(totalTickets), pct: conv != null ? conv + '%' : '—', w: Math.min(100, parseFloat(conv || 0)), c: '#15A34A', drop: rsvpToTicketDrop != null ? rsvpToTicketDrop + '%' : '' },
  ];

  // Real per-star breakdown, computed from every review (not just the 5
  // most recent) — see fetchFunnelStats.
  const ratingDefs = (funnelStats?.ratingBreakdown ?? []).map(r => ({ stars: r.stars, w: r.pct, pct: r.pct + '%' }));

  const queueGrads = ['linear-gradient(135deg,#7C5CFF,#B06BFF)','linear-gradient(135deg,#FF5A8A,#FF8A3D)','linear-gradient(135deg,#2F6BFF,#5B7CFF)','linear-gradient(135deg,#10B981,#06B6D4)'];
  const avColors = ['#FF5A8A','#2F6BFF','#7C5CFF','#10B981','#F59E0B'];

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpiDefs.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} delta={k.delta} pos={k.pos} iconBg={k.iconBg} iconSvg={k.icon} iconColor={k.color}/>
        ))}
      </div>

      {/* Big funnel + ratings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Conversion Funnel</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>RSVP → ticket, with drop-off</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 18 }}>
            {stages.map((f, i) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {f.w > 0 ? (
                      <div style={{ height: 42, width: f.w + '%', minWidth: 74, borderRadius: 11, background: f.c, display: 'flex', alignItems: 'center', paddingLeft: 13, boxSizing: 'border-box' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>{f.value}</span>
                      </div>
                    ) : (
                      <div style={{ height: 42, borderRadius: 11, border: '1.5px dashed #E4E7ED', display: 'flex', alignItems: 'center', paddingLeft: 13, boxSizing: 'border-box' }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#9AA3B2' }}>{f.value}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 'none', width: 120 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2233' }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: '#9AA3B2' }}>{f.pct}</div>
                  </div>
                </div>
                {f.drop && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0 4px 6px' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14m0 0 5-5m-5 5-5-5" stroke="#E5484D" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#E5484D' }}>{f.drop} drop-off</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Event Ratings</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Average across attended events</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
            <span style={{ fontSize: 41, fontWeight: 800, letterSpacing: -1.5 }}>{avgRating || '—'}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', gap: 2 }}><Stars rating={parseFloat(avgRating) || 0} size={15}/></div>
              <span style={{ fontSize: 12.5, color: '#9AA3B2', marginTop: 3 }}>{reviewCount} reviews</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
            {ratingDefs.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#7B8499', width: 30 }}>{r.stars}★</span>
                <div style={{ flex: 1, height: 9, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: r.w + '%', borderRadius: 999, background: '#FFB020' }}/>
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#9AA3B2', width: 38, textAlign: 'right' }}>{r.pct}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Approval queue + feedback */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Pending Approval</div>
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 11px', borderRadius: 999, background: '#FFF6EC', color: '#D9890B', fontSize: 13, fontWeight: 800 }}>{pendingEvents.length} waiting</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            {pendingEvents.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 14 }}>No events pending approval</div>
            )}
            {pendingEvents.map((q, i) => {
              const grad = queueGrads[i % queueGrads.length];
              const ago = q.created_at ? (() => { const mins = Math.round((Date.now() - new Date(q.created_at)) / 60000); return mins < 60 ? mins + 'm ago' : Math.round(mins/60) + 'h ago'; })() : '';
              return (
                <div key={q.id} style={{ border: '1.5px solid #EEF1F6', borderRadius: 16, padding: 14, background: '#fff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flex: 'none', background: grad, position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.16) 0,rgba(255,255,255,0.16) 2px,transparent 2px,transparent 8px)' }}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
                      <div style={{ fontSize: 12.5, color: '#9AA3B2', marginTop: 2 }}>{q.org || q.category || 'Event'}{ago ? ' · ' + ago : ''}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 9, marginTop: 13 }}>
                    <button onClick={() => onReject && onReject(q.id, q.title)} style={{ flex: 1, height: 40, border: '1.5px solid #E8EBF0', borderRadius: 12, background: '#fff', color: '#E5484D', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M7 7l10 10M17 7L7 17" stroke="#E5484D" strokeWidth="2.2" strokeLinecap="round"/></svg>Reject
                    </button>
                    <button onClick={() => onApprove && onApprove(q.id, q.title)} style={{ flex: 1, height: 40, border: 'none', borderRadius: 12, background: 'linear-gradient(135deg,#22C55E,#15A34A)', color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 6px 14px rgba(21,163,74,0.3)' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>Approve
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Recent Feedback</div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9AA3B2' }}>{reviewCount} total reviews</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 12 }}>
            {recentReviews.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 14 }}>No reviews yet</div>
            )}
            {recentReviews.map((r, i) => {
              const initial = r.user_id?.charAt(0).toUpperCase() || '?';
              const avBg = avColors[i % avColors.length];
              const ago = r.created_at ? (() => { const d = Math.round((Date.now() - new Date(r.created_at)) / 86400000); return d === 0 ? 'today' : d + 'd ago'; })() : '';
              return (
                <div key={r.id} style={{ padding: '13px 0', borderBottom: '1px solid #F5F7FA' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', background: avBg }}>{initial}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2233' }}>{r.event_title || 'Event'}</div>
                      <div style={{ fontSize: 12, color: '#9AA3B2' }}>{ago}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 1, flex: 'none' }}><Stars rating={r.rating} size={13}/></div>
                  </div>
                  {r.body && <div style={{ fontSize: 13.5, lineHeight: 1.5, color: '#5B6473', marginTop: 8 }}>{r.body}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Users & Audience view ─────────────────────────────────────────────────────
function UsersView({ theme, users }) {
  const fmt = n => n >= 1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'K' : String(n);
  const thirtyDaysAgo = new Date(Date.now() - 30*24*60*60*1000).toISOString();
  const newUsers30d = users.filter(u => u.created_at >= thirtyDaysAgo).length;
  // "Active (30d)" and "Retention Rate" have no real data source yet — no
  // last-active or session tracking exists in the schema — shown as "—"
  // rather than fabricated. No historical snapshots exist for deltas or
  // sparklines either.
  const kpis = [
    { label: 'Total Users',    value: fmt(users.length),   iconBg: '#F1ECFF', color: '#7C5CFF', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="C" stroke-width="2"/><path d="M5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6" stroke="C" stroke-width="2" stroke-linecap="round"/></svg>' },
    { label: 'Active (30d)',   value: '—',                  iconBg: '#E9F6FF', color: '#0098F0', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M3 12h4l2.5-6 5 14 2.5-8H21" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { label: 'New (30d)',      value: String(newUsers30d), iconBg: '#E4F7EC', color: '#15A34A', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="3.4" stroke="C" stroke-width="2"/><path d="M19 20c0-3.3-3-5.3-7-5.3S5 16.7 5 20" stroke="C" stroke-width="2" stroke-linecap="round"/><path d="M16 4v6M13 7h6" stroke="C" stroke-width="2" stroke-linecap="round"/></svg>' },
    { label: 'Retention Rate', value: '—',                  iconBg: '#FFF6EC', color: '#F59E0B', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" stroke="C" stroke-width="2"/><path d="M12 6v6l4 2" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
  ];

  // Real aggregation from users.campus (closest field to "faculty") and
  // users.year — both empty-state cleanly when unset rather than showing
  // fabricated percentages.
  // Percentages/donut are computed against the categorized population (not
  // users.length) so slice widths and percentages stay internally
  // consistent — a donut with a "1%" legend but a full circle around the
  // total user count would be misleading when most users haven't set this
  // field yet.
  const facultyColors = ['#7C5CFF','#0098F0','#22C55E','#F59E0B','#E5484D','#19BFFF'];
  const facultyCounts = {};
  users.forEach(u => { if (u.campus) facultyCounts[u.campus] = (facultyCounts[u.campus] || 0) + 1; });
  const facultyEntries = Object.entries(facultyCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const categorizedFaculty = Object.values(facultyCounts).reduce((a, b) => a + b, 0);
  const maxFaculty = facultyEntries[0]?.[1] || 1;
  const faculties = facultyEntries.map(([label, count]) => ({ label, count, pct: Math.round((count / categorizedFaculty) * 100) + '%', w: count / maxFaculty }));

  const yearCounts = {};
  users.forEach(u => { if (u.year) yearCounts[u.year] = (yearCounts[u.year] || 0) + 1; });
  const yearEntries = Object.entries(yearCounts).sort((a, b) => a[0].localeCompare(b[0]));
  const categorizedYears = Object.values(yearCounts).reduce((a, b) => a + b, 0);
  const yearLegend = yearEntries.map(([label, count], i) => ({
    label: label.length <= 2 ? `Year ${label}` : label,
    value: Math.round((count / categorizedYears) * 100) + '%',
    count,
    color: facultyColors[i % facultyColors.length],
  }));

  const memberColors = ['linear-gradient(135deg,#7C5CFF,#B06BFF)','linear-gradient(135deg,#19BFFF,#0E84E0)','linear-gradient(135deg,#22C55E,#15A34A)','linear-gradient(135deg,#FF5A8A,#FF8A3D)','linear-gradient(135deg,#F59E0B,#FFB020)','linear-gradient(135deg,#06B6D4,#10B981)'];
  const members = users.slice(0, 10);
  const scoreColors = ['#15A34A','#0098F0','#0098F0','#7C5CFF','#7C5CFF','#9AA3B2','#9AA3B2','#9AA3B2','#9AA3B2','#9AA3B2'];

  return (
    <>
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {kpis.map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: k.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={iconSt(k.icon, k.color, 19)} />
              </div>
            </div>
            <div style={{ fontSize: 29, fontWeight: 800, letterSpacing: -1, marginTop: 14 }}>{k.value}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#7B8499', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Active Hours + Year donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Active Hours</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>When students engage with Riply</div>
          {/* No timestamped session/activity log exists yet to build a real
              hourly distribution from. */}
          <div style={{ marginTop: 18, height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
            No activity history yet
          </div>
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>By Year of Study</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Of users with a year set ({categorizedYears} of {users.length})</div>
          {yearLegend.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
              No year data set yet
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                <Donut values={yearLegend.map(l => l.count)} colors={yearLegend.map(l => l.color)} centerVal={fmt(categorizedYears)} centerLabel="users" theme={theme} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 8 }}>
                {yearLegend.map((l, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#5B6473' }}>{l.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 800 }}>{l.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Faculties + Retention */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Top Campuses</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Of users with a campus set ({categorizedFaculty} of {users.length})</div>
          {faculties.length === 0 ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
              No campus data set yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {faculties.map((f, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{f.label}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#7B8499' }}>{f.pct}</span>
                  </div>
                  <div style={{ height: 11, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${f.w * 100}%`, borderRadius: 999, background: 'linear-gradient(90deg,#7C5CFF,#19BFFF)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Retention</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Returning users by week since signup</div>
          {/* No cohort/retention tracking exists yet to compute this from. */}
          <div style={{ marginTop: 18, height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
            No retention data yet
          </div>
        </div>
      </div>

      {/* Most Engaged Members table */}
      <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>Most Engaged Members</div>
          <button style={{ fontSize: 13.5, fontWeight: 700, color: '#0098F0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>View all →</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 0.9fr 0.9fr 1.1fr', gap: 8, padding: '14px 4px 10px', borderBottom: '1px solid #EEF1F6' }}>
          {['Member','Year','Program','Univ.','Role','Joined'].map((h, i) => (
            <span key={i} style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.3, color: '#9AA3B2', textTransform: 'uppercase', textAlign: i >= 3 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {members.length === 0 && <div style={{ padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 14 }}>No users yet</div>}
          {members.map((m, i) => {
            const initial = m.name?.charAt(0)?.toUpperCase() || m.email?.charAt(0)?.toUpperCase() || '?';
            const avBg = m.avatar_color || memberColors[i % memberColors.length];
            const joinedDate = m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—';
            return (
              <div key={m.id || i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr 0.9fr 0.9fr 1.1fr', gap: 8, alignItems: 'center', padding: '12px 4px', borderBottom: '1px solid #F5F7FA' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', background: avBg }}>{initial}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.name || m.email}</div>
                    <div style={{ fontSize: 12, color: '#9AA3B2' }}>{m.email}</div>
                  </div>
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#5B6473' }}>{m.year ? 'Year '+m.year : '—'}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#5B6473', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.program || m.campus || '—'}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#5B6473', textAlign: 'right' }}>{m.university?.slice(0,3)?.toUpperCase() || '—'}</span>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#5B6473', textAlign: 'right' }}>{m.role || 'user'}</span>
                <span style={{ textAlign: 'right' }}>
                  <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: i === 0 ? '#E4F7EC' : i <= 2 ? '#E9F6FF' : i <= 4 ? '#F1ECFF' : '#F1F3F7', color: scoreColors[i], fontSize: 12.5, fontWeight: 700 }}>{joinedDate}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Real-time Activity view ───────────────────────────────────────────────────
function ActivityView({ actFilter, setActFilter, theme, liveEvents, sessionCounts }) {
  // subscribeToActivity only emits rsvp/ticket/like/group inserts — there's
  // no realtime subscription on event inserts, so 'event' is not a real
  // filter option here.
  const ACT_FILTER_TABS = ['all','rsvp','ticket','group','like'];
  // sessionCounts is a cumulative, unbounded per-kind counter (see the main
  // Dashboard component) — using it here instead of liveEvents (which is
  // capped to the last 20 items for feed display) keeps these totals correct
  // even after more than 20 realtime events have arrived this session.
  const countByKind = kind => sessionCounts[kind] || 0;
  const totalSession = Object.values(sessionCounts).reduce((a, b) => a + b, 0);
  const liveStats = [
    { label: 'New RSVPs (session)',   value: String(countByKind('rsvp')),   iconBg: '#E4F7EC', color: '#15A34A', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="m5 12 4.5 4.5L19 7" stroke="C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' },
    { label: 'New Tickets (session)', value: String(countByKind('ticket')), iconBg: '#FFF6EC', color: '#F59E0B', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M4 8.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 1.7 1.7 0 0 0 0 3.3 1.7 1.7 0 0 0 0 3.4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 1.7 1.7 0 0 0 0-3.4 1.7 1.7 0 0 0 0-3.3Z" stroke="C" stroke-width="1.8" stroke-linejoin="round"/></svg>' },
    { label: 'New Group Joins (session)', value: String(countByKind('group')), iconBg: '#FFF1F5', color: '#FF5A8A', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="2.4" stroke="C" stroke-width="1.9"/><circle cx="16" cy="9" r="2.4" stroke="C" stroke-width="1.9"/><path d="M4 18c0-2 1.6-3.2 4-3.2M20 18c0-2-1.6-3.2-4-3.2" stroke="C" stroke-width="1.9" stroke-linecap="round"/></svg>' },
    { label: 'Total (session)',       value: String(totalSession),          iconBg: '#F1ECFF', color: '#7C5CFF', icon: '<svg width="19" height="19" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.4" stroke="C" stroke-width="2"/><path d="M5 20c0-3.6 3-5.6 7-5.6s7 2 7 5.6" stroke="C" stroke-width="2" stroke-linecap="round"/></svg>' },
  ];

  const filtered = actFilter === 'all' ? liveEvents : liveEvents.filter(a => a.kind === actFilter);

  const kindLabels = { rsvp: 'RSVPs', ticket: 'Tickets', group: 'Groups', like: 'Likes' };
  const typePcts = Object.entries(sessionCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, count]) => ({ label: kindLabels[kind] || kind, kind, count, w: count / totalSession, pct: Math.round((count / totalSession) * 100) + '%' }));

  // liveEvents doesn't change while the feed is idle, so nothing else forces
  // a re-render — without this, a "just now" label would never advance to
  // "5m ago" etc. until the next realtime event arrived.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, []);

  const timeAgo = a => {
    if (!a.created_at) return 'just now';
    const secs = Math.round((Date.now() - new Date(a.created_at)) / 1000);
    if (secs < 60) return 'just now';
    if (secs < 3600) return Math.round(secs / 60) + 'm ago';
    return Math.round(secs / 3600) + 'h ago';
  };

  return (
    <>
      {/* Session KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
        {liveStats.map((k, i) => (
          <div key={i} style={{ background: '#fff', borderRadius: 20, padding: 18, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: k.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={iconSt(k.icon, k.color, 19)} />
              </div>
            </div>
            <div style={{ fontSize: 29, fontWeight: 800, letterSpacing: -1, marginTop: 14 }}>{k.value}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#7B8499', marginTop: 2 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Live feed + type breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 16, marginTop: 16 }}>
        {/* Feed panel */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 17, fontWeight: 800 }}>Live Feed</div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 24, padding: '0 10px', borderRadius: 999, background: '#E4F7EC' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'rdPulse 1.6s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: '#15A34A' }}>Streaming</span>
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ACT_FILTER_TABS.map(f => (
                <button key={f} onClick={() => setActFilter(f)} style={{ height: 32, padding: '0 14px', borderRadius: 999, border: '1.5px solid', borderColor: actFilter === f ? '#7C5CFF' : '#E8EBF0', background: actFilter === f ? '#F1ECFF' : '#fff', color: actFilter === f ? '#7C5CFF' : '#7B8499', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>
                  {f === 'all' ? 'All' : f}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
            {filtered.length === 0 && (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
                No activity yet this session — this feed only shows events that happen while this page is open
              </div>
            )}
            {filtered.slice(0, 8).map((a, i) => {
              const ic = ACT_ICONS[a.kind] || ACT_ICONS.rsvp;
              const who = a.user_id?.slice(0, 8) || 'A user';
              const action = a.kind === 'rsvp' ? "RSVP'd to" : a.kind === 'ticket' ? 'bought a ticket for' : a.kind === 'like' ? 'liked' : 'joined';
              const target = a.event_id?.slice(0, 8) || a.group_id?.slice(0, 8) || '';
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: '1px solid #F5F7FA', animation: i === 0 ? 'rdSlideIn 0.3s ease' : undefined }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ic.bg }}>
                    <div style={iconSt(ic.svg, ic.color, 15)} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, color: '#1A2233', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 800 }}>{who}</span> {action} <span style={{ fontWeight: 800 }}>{target}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                      <span style={{ height: 20, padding: '0 8px', borderRadius: 999, background: ic.bg, color: ic.color, fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', textTransform: 'capitalize' }}>{a.kind}</span>
                      <span style={{ fontSize: 12, color: '#9AA3B2' }}>{timeAgo(a)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Type breakdown */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
          <div style={{ fontSize: 17, fontWeight: 800 }}>By Type</div>
          <div style={{ fontSize: 13.5, color: '#7B8499', marginTop: 2 }}>Share of this session's activity</div>
          {typePcts.length === 0 ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5, fontWeight: 600 }}>
              No activity yet
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 16 }}>
              {typePcts.map((t, i) => {
                const ic = ACT_ICONS[t.kind] || ACT_ICONS.rsvp;
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: ic.bg }}>
                      <div style={iconSt(ic.svg, ic.color, 15)} />
                    </div>
                    <span style={{ flexShrink: 0, width: 62, fontSize: 13.5, fontWeight: 700 }}>{t.label}</span>
                    <div style={{ flex: 1, height: 9, borderRadius: 999, background: '#EEF1F6', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${t.w * 100}%`, borderRadius: 999, background: ic.color }} />
                    </div>
                    <span style={{ flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#7B8499', width: 34, textAlign: 'right' }}>{t.pct}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Messages view ────────────────────────────────────────────────────────────
function MessagesView({ chats, activeChat, setActiveChat, messages, msgsLoading, msgDraft, setMsgDraft, onSend, msgEndRef, groups = [], onMessageGroup, startingChatGroupId }) {
  const chatColors = ['linear-gradient(135deg,#19BFFF,#0E84E0)','linear-gradient(135deg,#10B981,#06B6D4)','linear-gradient(135deg,#7C5CFF,#B06BFF)','linear-gradient(135deg,#FF6B6B,#FFB347)'];
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const messagedGroupIds = new Set(chats.filter(c => c.group_id).map(c => c.group_id));
  const pickerGroups = groups.filter(g => g.name?.toLowerCase().includes(groupSearch.toLowerCase()));

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, height: 'calc(100vh - 220px)', minHeight: 480 }}>
      {/* Conversation list */}
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
        <div style={{ padding: '18px 18px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 17, fontWeight: 800 }}>Conversations</div>
            <button onClick={() => setShowGroupPicker(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28, padding: '0 11px', borderRadius: 999, border: 'none', background: showGroupPicker ? '#0098F0' : '#E9F6FF', color: showGroupPicker ? '#fff' : '#0098F0', fontSize: 12.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>
              Message a group
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F1F3F7', borderRadius: 12, padding: '0 13px', height: 42, marginTop: 12 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="#9AA3B2" strokeWidth="2"/><path d="m20 20-3.2-3.2" stroke="#9AA3B2" strokeWidth="2" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 14, color: '#9AA3B2', fontWeight: 500 }}>Search chats…</span>
          </div>
        </div>
        {showGroupPicker && (
          <div style={{ position: 'absolute', top: 62, left: 12, right: 12, zIndex: 10, background: '#fff', border: '1.5px solid #E8EBF0', borderRadius: 14, boxShadow: '0 12px 30px rgba(16,24,40,0.14)', maxHeight: 340, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: 10, borderBottom: '1px solid #F1F3F7' }}>
              <input autoFocus value={groupSearch} onChange={e => setGroupSearch(e.target.value)} placeholder="Search groups…"
                style={{ width: '100%', boxSizing: 'border-box', height: 36, border: '1.5px solid #E8EBF0', borderRadius: 10, padding: '0 11px', fontSize: 13.5, fontWeight: 500, outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div style={{ overflowY: 'auto' }}>
              {pickerGroups.length === 0 && (
                <div style={{ padding: '18px 14px', textAlign: 'center', color: '#9AA3B2', fontSize: 13.5 }}>No groups found</div>
              )}
              {pickerGroups.map(g => {
                const starting = startingChatGroupId === g.id;
                const alreadyMessaged = messagedGroupIds.has(g.id);
                return (
                  <button key={g.id} disabled={starting} onClick={() => { onMessageGroup?.(g); setShowGroupPicker(false); setGroupSearch(''); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 11, width: '100%', padding: '10px 14px', border: 'none', background: '#fff', cursor: starting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', textAlign: 'left', opacity: starting ? 0.6 : 1 }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', background: g.logo_color || chatColors[0] }}>
                      {g.initial || g.name?.charAt(0) || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.name}</div>
                      {alreadyMessaged && <div style={{ fontSize: 11.5, color: '#9AA3B2' }}>Already messaged — opens existing chat</div>}
                    </div>
                    {starting && <span style={{ fontSize: 12, color: '#9AA3B2', flexShrink: 0 }}>Opening…</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 && <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9AA3B2', fontSize: 14 }}>No conversations yet</div>}
          {chats.map((c, ci) => {
            const on = activeChat?.id === c.id;
            const bg = c.color || chatColors[ci % chatColors.length];
            const initial = c.initial || c.name?.charAt(0) || '?';
            const timeStr = c.last_message_at ? new Date(c.last_message_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : '';
            return (
              <button key={c.id} onClick={() => setActiveChat(c)} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '12px 18px', border: 'none', background: on ? '#F1F8FF' : '#fff', borderLeft: on ? '3px solid #0098F0' : '3px solid transparent', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', background: bg }}>
                  {initial}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                      {c.group_id && <span style={{ flexShrink: 0, fontSize: 10.5, fontWeight: 800, color: '#7C5CFF', background: '#F1ECFF', padding: '1px 7px', borderRadius: 999 }}>GROUP</span>}
                    </span>
                    <span style={{ fontSize: 11.5, color: '#9AA3B2', flexShrink: 0 }}>{timeStr}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#7B8499', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last_message || 'No messages yet'}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat thread */}
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeChat ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9AA3B2', fontSize: 15 }}>Select a conversation</div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #F1F3F7' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800, color: '#fff', background: activeChat.color || chatColors[0] }}>
                {activeChat.initial || activeChat.name?.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800 }}>{activeChat.name}</div>
                <div style={{ fontSize: 12.5, color: '#22C55E', fontWeight: 700 }}>{activeChat.group_id ? 'Group chat' : 'Chat'}</div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12, background: '#F8FAFC' }}>
              <div style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: '#9AA3B2', background: '#EEF1F6', padding: '4px 12px', borderRadius: 999 }}>Today</span></div>
              {msgsLoading && <div style={{ textAlign: 'center', color: '#9AA3B2', fontSize: 14, padding: 16 }}>Loading messages…</div>}
              {!msgsLoading && messages.length === 0 && <div style={{ textAlign: 'center', color: '#9AA3B2', fontSize: 14, padding: 16 }}>No messages yet. Say hello!</div>}
              {messages.map((m, i) => {
                const isMe = m.sender_id != null;
                const text = m.content || m.text || '';
                const time = m.created_at ? new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : m.time || '';
                return (
                  <div key={m.id || i} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                    <div style={{ maxWidth: '70%', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: isMe ? 'linear-gradient(135deg,#19BFFF,#0E84E0)' : '#fff', color: isMe ? '#fff' : '#1A2233', fontSize: 14.5, lineHeight: 1.5, fontWeight: 500, boxShadow: '0 2px 8px rgba(14,23,38,0.08)' }}>{text}</div>
                    <div style={{ fontSize: 11.5, color: '#9AA3B2', marginTop: 3, padding: '0 4px' }}>{time}</div>
                  </div>
                );
              })}
              <div ref={msgEndRef}/>
            </div>

            {/* Composer */}
            <div style={{ padding: '14px 18px', borderTop: '1px solid #F1F3F7', display: 'flex', alignItems: 'center', gap: 11 }}>
              <input value={msgDraft} onChange={e => setMsgDraft(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} placeholder="Type a message…" style={{ flex: 1, height: 46, border: '1.5px solid #E8EBF0', borderRadius: 14, background: '#fff', padding: '0 16px', fontSize: 15, fontWeight: 500, color: '#1A2233', outline: 'none', fontFamily: 'inherit' }} />
              <button onClick={onSend} style={{ width: 46, height: 46, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#19BFFF,#0E84E0)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, boxShadow: '0 6px 14px rgba(2,162,240,0.32)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12l16-7-7 16-2.5-6.5L4 12Z" fill="#fff"/></svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Create Event view ─────────────────────────────────────────────────────────
function CreateEventView({ ceCat, setCeCat, ceTitle, setCeTitle, ceAbout, setCeAbout, ceDate, setCeDate, ceStart, setCeStart, ceEnd, setCeEnd, ceVenue, setCeVenue, cePricing, setCePricing, cePrice, setCePrice, ceCapacity, setCeCapacity, ceCoverUrl, onCoverUpload, coverUploading, onPublish, onDraft, submitting }) {
  const activeCat = CE_CATS.find(c => c.id === ceCat) || CE_CATS[0];

  const fieldWrap = (icon, children) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#F8FAFC', border: '1.5px solid #E8EBF0', borderRadius: 12, padding: '0 13px', height: 46 }}>
      {icon}<div style={{ flex: 1 }}>{children}</div>
    </div>
  );

  const fieldInput = (val, setter, placeholder, type = 'text') => (
    <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', border: 'none', background: 'none', fontSize: 15, fontWeight: 600, color: '#1A2233', outline: 'none', fontFamily: 'inherit' }} />
  );

  const label = (text) => <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: '#9AA3B2', marginBottom: 7 }}>{text}</div>;

  return (
    <div style={{ maxWidth: 880 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Cover */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)' }}>
            {label('Cover')}
            <label style={{
              width: '100%', height: 150, borderRadius: 16, border: '2px dashed #C7D2E0',
              background: ceCoverUrl ? `url(${ceCoverUrl}) center/cover no-repeat` : activeCat.grad,
              position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 8, cursor: coverUploading ? 'wait' : 'pointer',
            }}>
              <input type="file" accept="image/*" disabled={coverUploading} onChange={e => onCoverUpload?.(e.target.files?.[0])} style={{ display: 'none' }} />
              {!ceCoverUrl && <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(135deg,rgba(255,255,255,0.10) 0,rgba(255,255,255,0.10) 2px,transparent 2px,transparent 16px)' }} />}
              {ceCoverUrl && <div style={{ position: 'absolute', inset: 0, background: 'rgba(14,23,38,0.35)' }} />}
              <div style={{ width: 44, height: 44, borderRadius: 13, background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="6" width="17" height="13" rx="3" stroke="#0098F0" strokeWidth="1.9"/><circle cx="12" cy="12.5" r="3" stroke="#0098F0" strokeWidth="1.9"/><path d="M8.5 6l1-2h5l1 2" stroke="#0098F0" strokeWidth="1.9" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', position: 'relative' }}>
                {coverUploading ? 'Uploading…' : ceCoverUrl ? 'Change cover photo' : 'Add cover photo'}
              </div>
            </label>
          </div>

          {/* Details */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              {label('Event Title')}
              <input value={ceTitle} onChange={e => setCeTitle(e.target.value)} placeholder="e.g. Welcome Week Concert"
                style={{ width: '100%', boxSizing: 'border-box', height: 46, border: '1.5px solid #E8EBF0', borderRadius: 13, background: '#fff', padding: '0 14px', fontSize: 16, fontWeight: 700, color: '#1A2233', outline: 'none', fontFamily: 'inherit' }} />
            </div>
            <div>
              {label('Category')}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {CE_CATS.map(c => (
                  <button key={c.id} onClick={() => setCeCat(c.id)} style={{ height: 34, padding: '0 14px', borderRadius: 999, border: 'none', background: ceCat === c.id ? c.grad : '#F1F3F7', color: ceCat === c.id ? '#fff' : '#5B6473', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{c.label}</button>
                ))}
              </div>
            </div>
            <div>
              {label('About')}
              <textarea value={ceAbout} onChange={e => setCeAbout(e.target.value)} placeholder="Describe the event — activities, guests, food, networking…"
                style={{ width: '100%', boxSizing: 'border-box', minHeight: 96, border: '1.5px solid #E8EBF0', borderRadius: 13, background: '#fff', padding: '12px 14px', fontSize: 15, fontWeight: 500, lineHeight: 1.55, color: '#1A2233', outline: 'none', fontFamily: 'inherit', resize: 'none' }} />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* When & Where */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {label('When & Where')}
            {fieldWrap(
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="#0098F0" strokeWidth="1.9"/><path d="M3.5 9.5h17M8 3v4M16 3v4" stroke="#0098F0" strokeWidth="1.9" strokeLinecap="round"/></svg>,
              fieldInput(ceDate, setCeDate, '', 'date')
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              {fieldWrap(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="8.5" stroke="#0098F0" strokeWidth="1.9"/><path d="M12 8v4.5l3 2" stroke="#0098F0" strokeWidth="1.9" strokeLinecap="round"/></svg>,
                fieldInput(ceStart, setCeStart, '', 'time')
              )}
              {fieldWrap(
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><circle cx="12" cy="12" r="8.5" stroke="#9AA3B2" strokeWidth="1.9"/><path d="M12 8v4.5l3 2" stroke="#9AA3B2" strokeWidth="1.9" strokeLinecap="round"/></svg>,
                fieldInput(ceEnd, setCeEnd, '', 'time')
              )}
            </div>
            {fieldWrap(
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" stroke="#0098F0" strokeWidth="1.9"/><circle cx="12" cy="10" r="2.4" stroke="#0098F0" strokeWidth="1.9"/></svg>,
              fieldInput(ceVenue, setCeVenue, 'Venue — e.g. Central Quad')
            )}
          </div>

          {/* Pricing & Capacity */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 20, boxShadow: '0 4px 16px rgba(16,24,40,0.05)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {label('Pricing & Capacity')}
            <div style={{ display: 'flex', gap: 8 }}>
              {['free','paid'].map(p => (
                <button key={p} onClick={() => setCePricing(p)} style={{ flex: 1, height: 40, border: '1.5px solid', borderColor: cePricing === p ? '#0098F0' : '#E8EBF0', borderRadius: 12, background: cePricing === p ? '#E9F6FF' : '#fff', color: cePricing === p ? '#0098F0' : '#5B6473', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize' }}>{p}</button>
              ))}
            </div>
            {cePricing === 'paid' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F8FAFC', border: '1.5px solid #E8EBF0', borderRadius: 12, padding: '0 13px', height: 46 }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: '#15A34A' }}>$</span>
                <input value={cePrice} onChange={e => setCePrice(e.target.value)} placeholder="0.00" style={{ flex: 1, border: 'none', background: 'none', fontSize: 15, fontWeight: 700, color: '#1A2233', outline: 'none', fontFamily: 'inherit' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#9AA3B2' }}>per ticket</span>
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', border: '1.5px solid #E8EBF0', borderRadius: 12, padding: '0 8px 0 14px', height: 46 }}>
              <span style={{ fontSize: 14.5, fontWeight: 700 }}>Capacity</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setCeCapacity(c => Math.max(10, c - 10))} style={{ width: 32, height: 32, border: '1.5px solid #E8EBF0', borderRadius: 9, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M5 12h14" stroke="#39414F" strokeWidth="2.4" strokeLinecap="round"/></svg>
                </button>
                <span style={{ fontSize: 17, fontWeight: 800, minWidth: 48, textAlign: 'center' }}>{ceCapacity}</span>
                <button onClick={() => setCeCapacity(c => c + 10)} style={{ width: 32, height: 32, border: 'none', borderRadius: 9, background: '#0098F0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
                </button>
              </div>
            </div>
          </div>

          {/* Publish actions */}
          <div style={{ display: 'flex', gap: 11 }}>
            <button onClick={onDraft} disabled={submitting} style={{ flexShrink: 0, height: 50, padding: '0 20px', border: '1.5px solid #E2E6EC', borderRadius: 14, background: '#fff', color: '#5B6473', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', opacity: submitting ? 0.6 : 1 }}>Save Draft</button>
            <button onClick={onPublish} disabled={submitting} style={{ flex: 1, height: 50, border: 'none', borderRadius: 14, background: submitting ? '#B0C8E8' : 'linear-gradient(135deg,#19BFFF,#0E84E0)', color: '#fff', fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: submitting ? 'none' : '0 8px 20px rgba(2,162,240,0.36)' }}>
              {submitting ? 'Submitting…' : (<><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12h13M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>Publish Event</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { userId } = useClerkAuth();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [nav, setNav] = useState('overview');
  const [range, setRange] = useState('30d');
  const [scope, setScope] = useState('My events');
  const [scopeOpen, setScopeOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [toast, setToast] = useState(null);
  const [evFilter, setEvFilter] = useState('all');
  const [grpFilter, setGrpFilter] = useState('all');
  const [actFilter, setActFilter] = useState('all');
  const toastTimer = useRef(null);

  // ── Data state ─────────────────────────────────────────────────────────────
  const [kpis, setKpis] = useState(null);
  const [events, setEvents] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [funnelStats, setFunnelStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [recentReviews, setRecentReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifsRead, setNotifsRead] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]); // real-time activity feed (bounded, for display)
  const [sessionCounts, setSessionCounts] = useState({}); // cumulative per-kind counts, unbounded
  const [currentUser, setCurrentUser] = useState(null);

  // ── Messages state ─────────────────────────────────────────────────────────
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgDraft, setMsgDraft] = useState('');
  const [msgsLoading, setMsgsLoading] = useState(false);
  const [startingChatGroupId, setStartingChatGroupId] = useState(null);
  const msgEndRef = useRef(null);

  // ── Create Event state ─────────────────────────────────────────────────────
  const [ceCat, setCeCat] = useState('social');
  const [ceTitle, setCeTitle] = useState('');
  const [ceAbout, setCeAbout] = useState('');
  const [ceDate, setCeDate] = useState('');
  const [ceStart, setCeStart] = useState('');
  const [ceEnd, setCeEnd] = useState('');
  const [ceVenue, setCeVenue] = useState('');
  const [cePricing, setCePricing] = useState('free');
  const [cePrice, setCePrice] = useState('');
  const [ceCapacity, setCeCapacity] = useState(500);
  const [ceCoverUrl, setCeCoverUrl] = useState('');
  const [ceCoverUploading, setCeCoverUploading] = useState(false);
  const [ceSubmitting, setCeSubmitting] = useState(false);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = useCallback(msg => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);

  // ── Initial data fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [kpisData, eventsResult, groupsData, usersResult, funnelData, pendingData, reviewsData, notifsData] = await Promise.all([
        fetchOverviewKpis().catch(() => null),
        fetchEvents().then(d => ({ ok: true, d })).catch(() => ({ ok: false, d: [] })),
        fetchGroups().catch(() => []),
        fetchUsers().then(d => ({ ok: true, d })).catch(() => ({ ok: false, d: [] })),
        fetchFunnelStats().catch(() => null),
        fetchPendingEvents().catch(() => []),
        fetchRecentReviews().catch(() => []),
        fetchNotifications(userId).catch(() => []),
      ]);
      if (cancelled) return;
      setKpis(kpisData);
      setEvents(eventsResult.d);
      setEventsLoaded(eventsResult.ok);
      setGroups(groupsData);
      setUsers(usersResult.d);
      setUsersLoaded(usersResult.ok);
      setFunnelStats(funnelData);
      setPendingEvents(pendingData);
      setRecentReviews(reviewsData);
      setNotifications(notifsData);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch chats on messages nav ────────────────────────────────────────────
  useEffect(() => {
    if (nav !== 'messages') return;
    fetchChats().then(data => {
      setChats(data);
      if (data.length > 0 && !activeChat) setActiveChat(data[0]);
    }).catch(() => {});
  }, [nav]);

  // ── Load messages when active chat changes ─────────────────────────────────
  useEffect(() => {
    if (!activeChat) return;
    setMsgsLoading(true);
    fetchMessages(activeChat.id).then(data => {
      setMessages(data);
      setMsgsLoading(false);
    }).catch(() => setMsgsLoading(false));

    const channel = subscribeToMessages(activeChat.id, msg => {
      setMessages(prev => [...prev, msg]);
    });
    return () => { channel.unsubscribe(); };
  }, [activeChat]);

  // ── Scroll messages to bottom ──────────────────────────────────────────────
  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Real-time activity subscription ───────────────────────────────────────
  // liveEvents is bounded to 20 for the feed display; sessionCounts tracks
  // every event received this session (unbounded) so per-kind counts don't
  // silently stop growing once the feed buffer fills up.
  useEffect(() => {
    const ch = subscribeToActivity(event => {
      setLiveEvents(prev => [event, ...prev].slice(0, 20));
      setSessionCounts(prev => ({ ...prev, [event.kind]: (prev[event.kind] || 0) + 1 }));
    });
    return () => { ch.unsubscribe(); };
  }, []);

  // ── Event approval ─────────────────────────────────────────────────────────
  const handleApproval = async (id, status, title) => {
    await updateEventStatus(id, status);
    setPendingEvents(prev => prev.filter(e => e.id !== id));
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e));
    showToast(`"${title}" ${status === 'published' ? 'approved & published' : 'rejected'}`);
  };

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSendMessage = async () => {
    const text = msgDraft.trim();
    if (!text || !activeChat) return;
    setMsgDraft('');
    const msg = await sendMessage(activeChat.id, text, userId).catch(err => {
      showToast('Failed to send: ' + err.message);
      return null;
    });
    if (msg) setMessages(prev => [...prev, msg]);
  };

  // ── Start / open a group chat ──────────────────────────────────────────────
  const handleMessageGroup = async (group) => {
    setStartingChatGroupId(group.id);
    try {
      const chat = await startGroupChat(group, userId);
      setChats(prev => prev.some(c => c.id === chat.id) ? prev : [chat, ...prev]);
      setActiveChat(chat);
      setNav('messages');
    } catch (err) {
      showToast('Could not start chat: ' + err.message);
    } finally {
      setStartingChatGroupId(null);
    }
  };

  // ── Create event ───────────────────────────────────────────────────────────
  // ceDate is a native <input type="date"> value (YYYY-MM-DD) — `date` is what
  // EventsView parses with `new Date(e.date)`, so it must actually be set
  // here rather than only the human-readable `full_date` string.
  const buildEventPayload = () => ({
    title: ceTitle, category: ceCat, full_desc: ceAbout, description: ceAbout,
    date: ceDate || null,
    full_date: ceDate ? new Date(ceDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '',
    start_time: ceStart, time_range: ceStart && ceEnd ? `${ceStart} – ${ceEnd}` : (ceStart || ceEnd || ''),
    venue: ceVenue, price: cePricing === 'free' ? 'Free' : `$${cePrice}`,
    capacity: ceCapacity, image_url: ceCoverUrl || null,
  });

  const resetEventForm = () => {
    setCeTitle(''); setCeAbout(''); setCeDate(''); setCeStart(''); setCeEnd('');
    setCeVenue(''); setCeCapacity(500); setCeCoverUrl(''); setCePricing('free'); setCePrice('');
  };

  const handlePublishEvent = async () => {
    if (!ceTitle.trim()) { showToast('Please add an event title'); return; }
    setCeSubmitting(true);
    try {
      await createEvent(buildEventPayload(), userId, 'pending');
      showToast('Event submitted for approval!');
      resetEventForm();
      fetchPendingEvents().then(setPendingEvents).catch(() => {});
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setCeSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!ceTitle.trim()) { showToast('Please add an event title'); return; }
    setCeSubmitting(true);
    try {
      await createEvent(buildEventPayload(), userId, 'draft');
      showToast('Draft saved');
      resetEventForm();
      fetchEvents().then(setEvents).catch(() => {});
    } catch (err) {
      showToast('Error: ' + err.message);
    } finally {
      setCeSubmitting(false);
    }
  };

  const handleCoverUpload = async (file) => {
    if (!file) return;
    setCeCoverUploading(true);
    try {
      const url = await uploadEventCover(file);
      setCeCoverUrl(url);
    } catch (err) {
      showToast('Cover upload failed: ' + err.message);
    } finally {
      setCeCoverUploading(false);
    }
  };

  // ── Mark notifications read ────────────────────────────────────────────────
  const handleMarkNotifsRead = async () => {
    try {
      await markAllNotificationsRead(userId);
      setNotifsRead(true);
    } catch {
      // leave notifsRead as-is so the unread state is preserved
    }
  };

  // ── Sign out ───────────────────────────────────────────────────────────────
  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/auth', { replace: true });
  };

  const dark = theme === 'dark';
  const page = PAGE[nav] || PAGE.overview;
  const grey = '#7B8499';
  const unreadNotifs = notifsRead ? 0 : notifications.filter(n => !n.read).length;

  // If the dedicated KPI query hasn't resolved yet, fall back to the length
  // of the already-fetched users/events arrays — still real data, just a
  // less precise count until fetchOverviewKpis() returns. That fallback only
  // applies once those fetches have actually succeeded (usersLoaded/
  // eventsLoaded) — otherwise an initial or failed empty array would render
  // as a real zero instead of "—".
  // totalRsvps/totalTickets have no array-length fallback like users/events
  // do, so they're left undefined (rendered as "—") rather than 0 while
  // kpis hasn't loaded — indistinguishable from a real zero otherwise.
  const displayKpis = {
    totalUsers:  kpis?.totalUsers  ?? (usersLoaded ? users.length : undefined),
    totalEvents: kpis?.totalEvents ?? (eventsLoaded ? events.length : undefined),
    totalRsvps:  kpis?.totalRsvps,
    totalTickets: kpis?.totalTickets,
  };

  return (
    <div className={dark ? 'rd-dark' : ''} style={{ minHeight: '100vh', background: '#EEF1F6', fontFamily: "'Montserrat',-apple-system,system-ui,sans-serif", display: 'flex', color: '#0E1726' }}>

      {/* ── Sidebar ── */}
      <aside style={{ flex: 'none', width: 248, minHeight: '100vh', background: '#fff', borderRight: '1px solid #E8EBF0', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '22px 22px 20px' }}>
          <img src="/riply-logo.png" alt="Riply" style={{ width: 38, height: 38, objectFit: 'contain' }}/>
          <div>
            <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: 0.5, color: '#0098F0', lineHeight: 1 }}>RIPLY</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, color: '#9AA3B2', marginTop: 3 }}>ANALYTICS</div>
          </div>
        </div>
        <div style={{ padding: '4px 14px 10px' }}>
          <button onClick={() => { setNav('create'); setBellOpen(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 46, border: 'none', borderRadius: 14, background: 'linear-gradient(135deg,#19BFFF,#0E84E0)', color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 16px rgba(2,162,240,0.32)' }}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"/></svg>
            Create Event
          </button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 12px' }}>
          {NAV_ITEMS.map(n => {
            const on = n.id === nav;
            return (
              <button key={n.id} onClick={() => setNav(n.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, height: 44, padding: '0 14px', border: 'none', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, background: on ? 'linear-gradient(135deg,#19BFFF,#0E84E0)' : 'none', color: on ? '#fff' : '#5B6473', boxShadow: on ? '0 6px 16px rgba(2,162,240,0.3)' : 'none' }}>
                <div style={iconSt(n.icon, on ? '#fff' : grey, 19)}/>
                <span style={{ flex: 1, textAlign: 'left' }}>{n.label}</span>
                {n.id === 'funnel' && pendingEvents.length > 0 && (
                  <span style={{ minWidth: 18, height: 18, padding: '0 5px', boxSizing: 'border-box', borderRadius: 999, background: on ? 'rgba(255,255,255,0.3)' : '#FF3B6B', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{pendingEvents.length}</span>
                )}
                {n.live && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', animation: 'rdPulse 1.6s ease-in-out infinite' }}/>}
              </button>
            );
          })}
        </nav>
        <div style={{ marginTop: 'auto', padding: '16px 14px' }}>
          <div style={{ background: 'linear-gradient(135deg,#19BFFF,#0E84E0)', borderRadius: 18, padding: 16, color: '#fff' }}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>Riply Admin</div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>University workspace</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>A</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Admin</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>Administrator</div>
              </div>
              <button onClick={handleSignOut} title="Sign out" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.75, padding: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Header */}
        <header style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(238,241,246,0.85)', backdropFilter: 'blur(12px)', padding: '22px 30px 16px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: '1px solid #E4E8EF' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5 }}>{page.title}</div>
            <div style={{ fontSize: 14, color: '#7B8499', marginTop: 3 }}>{page.sub}</div>
          </div>
          <button onClick={() => { setScopeOpen(o => !o); setBellOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 9, height: 42, padding: '0 15px', border: '1.5px solid #E2E6EC', borderRadius: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none"><path d="M12 3.5 4 7v1.5h16V7l-8-3.5Z" stroke="#0098F0" strokeWidth="1.8" strokeLinejoin="round"/><path d="M6 11v6M10 11v6M14 11v6M18 11v6M4 19.5h16" stroke="#0098F0" strokeWidth="1.8" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1A2233' }}>{scope}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="#9AA3B2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1.5px solid #E2E6EC', borderRadius: 13, padding: 4 }}>
            {RANGES.map(r => <button key={r.id} onClick={() => setRange(r.id)} style={{ border: 'none', borderRadius: 9, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, padding: '8px 13px', background: r.id === range ? '#0098F0' : 'none', color: r.id === range ? '#fff' : '#7B8499' }}>{r.label}</button>)}
          </div>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 42, padding: '0 13px', border: '1.5px solid #E2E6EC', borderRadius: 13, background: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
            <div style={iconSt(dark ? SUN : MOON, dark ? '#FFC24D' : '#39414F', 18)}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A2233' }}>{dark ? 'Light' : 'Dark'}</span>
          </button>
          <button onClick={() => { setNav('messages'); setBellOpen(false); }} style={{ position: 'relative', width: 42, height: 42, border: '1.5px solid #E2E6EC', borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 6.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-4 3.5V16.5H6a2 2 0 0 1-2-2Z" stroke="#39414F" strokeWidth="1.9" strokeLinejoin="round"/></svg>
          </button>
          <button onClick={() => { setBellOpen(o => !o); setScopeOpen(false); }} style={{ position: 'relative', width: 42, height: 42, border: '1.5px solid #E2E6EC', borderRadius: 13, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 8.5a6 6 0 1 0-12 0c0 6-2.5 7.5-2.5 7.5h17S18 14.5 18 8.5Z" stroke="#39414F" strokeWidth="1.9" strokeLinejoin="round"/><path d="M10 19.5a2.2 2.2 0 0 0 4 0" stroke="#39414F" strokeWidth="1.9" strokeLinecap="round"/></svg>
            {unreadNotifs > 0 && <span style={{ position: 'absolute', top: 8, right: 9, width: 9, height: 9, borderRadius: '50%', background: '#FF3B6B', border: '2px solid #fff' }}/>}
          </button>
        </header>

        {/* Notifications dropdown */}
        {bellOpen && (
          <div style={{ position: 'absolute', right: 30, top: 78, zIndex: 25, background: '#fff', borderRadius: 18, boxShadow: '0 16px 40px rgba(16,24,40,0.18)', overflow: 'hidden', width: 360, animation: 'rdSlideIn .16s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderBottom: '1px solid #F1F3F7' }}>
              <span style={{ fontSize: 16, fontWeight: 800 }}>Notifications</span>
              <button onClick={handleMarkNotifsRead} style={{ fontSize: 13, fontWeight: 700, color: '#0098F0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Mark all read</button>
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '24px 18px', textAlign: 'center', color: '#9AA3B2', fontSize: 14 }}>No notifications</div>
              ) : notifications.map((n, i) => {
                const ic = ACT_ICONS.rsvp;
                const unread = !notifsRead && !n.read;
                return (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '13px 18px', borderBottom: '1px solid #F7F8FA', background: unread ? '#F6FBFF' : '#fff' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: ic.bg }}>
                      <div style={iconSt(ic.svg, ic.color, 15)}/>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1A2233' }}>{n.title}</div>
                      <div style={{ fontSize: 13, color: '#5B6473', marginTop: 2 }}>{n.body}</div>
                      <div style={{ fontSize: 12, color: '#9AA3B2', marginTop: 3 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                    {unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#0098F0', flex: 'none', marginTop: 5 }}/>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Scope dropdown */}
        {scopeOpen && (
          <div style={{ position: 'absolute', right: 30, top: 78, zIndex: 20, background: '#fff', borderRadius: 16, boxShadow: '0 12px 32px rgba(16,24,40,0.16)', overflow: 'hidden', width: 230, animation: 'rdSlideIn .16s ease' }}>
            {SCOPES.map((o, i) => (
              <button key={o} onClick={() => { setScope(o); setScopeOpen(false); }} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', background: o === scope ? '#F1F8FF' : 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: o === scope ? 800 : 600, color: o === scope ? '#0098F0' : '#1A2233', padding: '13px 16px', borderBottom: i < SCOPES.length - 1 ? '1px solid #F1F3F7' : 'none' }}>{o}</button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: '22px 30px 40px' }}>
          {nav === 'overview' && (
            <OverviewView
              theme={theme}
              onViewAllEvents={() => setNav('events')}
              kpis={displayKpis}
              events={events}
              liveEvents={liveEvents}
              funnelStats={funnelStats}
            />
          )}
          {nav === 'events' && (
            <EventsView
              theme={theme} evFilter={evFilter} setEvFilter={setEvFilter}
              events={events}
              onApprove={(id, title) => handleApproval(id, 'published', title)}
              onReject={(id, title) => handleApproval(id, 'draft', title)}
              onDelete={async (id) => {
                await deleteEvent(id);
                setEvents(prev => prev.filter(e => e.id !== id));
                showToast('Event deleted');
              }}
            />
          )}
          {nav === 'groups' && (
            <GroupsView theme={theme} grpFilter={grpFilter} setGrpFilter={setGrpFilter} groups={groups} onMessageGroup={handleMessageGroup} startingChatGroupId={startingChatGroupId} />
          )}
          {nav === 'funnel' && (
            <FunnelView
              theme={theme}
              funnelStats={funnelStats}
              pendingEvents={pendingEvents}
              recentReviews={recentReviews}
              onApprove={(id, title) => handleApproval(id, 'published', title)}
              onReject={(id, title) => handleApproval(id, 'draft', title)}
              showToast={showToast}
            />
          )}
          {nav === 'users' && (
            <UsersView theme={theme} users={users} />
          )}
          {nav === 'activity' && (
            <ActivityView actFilter={actFilter} setActFilter={setActFilter} theme={theme} liveEvents={liveEvents} sessionCounts={sessionCounts} />
          )}
          {nav === 'messages' && (
            <MessagesView
              chats={chats}
              activeChat={activeChat}
              setActiveChat={setActiveChat}
              messages={messages}
              msgsLoading={msgsLoading}
              msgDraft={msgDraft}
              setMsgDraft={setMsgDraft}
              onSend={handleSendMessage}
              msgEndRef={msgEndRef}
              groups={groups}
              onMessageGroup={handleMessageGroup}
              startingChatGroupId={startingChatGroupId}
            />
          )}
          {nav === 'create' && (
            <CreateEventView
              ceCat={ceCat} setCeCat={setCeCat}
              ceTitle={ceTitle} setCeTitle={setCeTitle}
              ceAbout={ceAbout} setCeAbout={setCeAbout}
              ceDate={ceDate} setCeDate={setCeDate}
              ceStart={ceStart} setCeStart={setCeStart}
              ceEnd={ceEnd} setCeEnd={setCeEnd}
              ceVenue={ceVenue} setCeVenue={setCeVenue}
              cePricing={cePricing} setCePricing={setCePricing}
              cePrice={cePrice} setCePrice={setCePrice}
              ceCapacity={ceCapacity} setCeCapacity={setCeCapacity}
              ceCoverUrl={ceCoverUrl} onCoverUpload={handleCoverUpload} coverUploading={ceCoverUploading}
              onPublish={handlePublishEvent}
              onDraft={handleSaveDraft}
              submitting={ceSubmitting}
            />
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 30, zIndex: 40, display: 'flex', alignItems: 'center', gap: 10, background: '#0E1726', color: '#fff', borderRadius: 14, padding: '13px 18px', boxShadow: '0 10px 28px rgba(14,23,38,0.4)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#19BFFF" strokeWidth="2"/><path d="m8 12 2.5 2.5L16 9" stroke="#19BFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <span style={{ fontSize: 14, fontWeight: 600 }}>{toast}</span>
        </div>
      )}
    </div>
  );
}
