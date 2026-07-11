import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiCardSkeleton, CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DonutChart, DonutLegend } from '@/components/charts/DonutChart';
import { SimpleBarChart } from '@/components/charts/SimpleBarChart';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useUsersQuery } from '@/hooks/queries/useUsers';
import { useActiveHoursQuery, useFacultyBreakdownQuery, useRetentionCurveQuery, useYearBreakdownQuery } from '@/hooks/queries/useAnalytics';
import { formatDate, initialOf } from '@/utils/format';
import { PAGE_SIZE } from '@/utils/constants';
import type { UserFilters } from '@/services/users.service';

const AVATAR_COLORS = [
  'linear-gradient(135deg,#7C5CFF,#B06BFF)',
  'linear-gradient(135deg,#19BFFF,#0E84E0)',
  'linear-gradient(135deg,#22C55E,#15A34A)',
  'linear-gradient(135deg,#FF5A8A,#FF8A3D)',
  'linear-gradient(135deg,#F59E0B,#FFB020)',
];

const YEAR_COLORS = ['#7C5CFF', '#0098F0', '#22C55E', '#F59E0B', '#D4D9E2'];

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sortBy, setSortBy] = useState<UserFilters['sortBy']>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const users = useUsersQuery({ search: debouncedSearch, sortBy, sortDir, page, pageSize: PAGE_SIZE });
  const activeHours = useActiveHoursQuery();
  const yearBreakdown = useYearBreakdownQuery();
  const facultyBreakdown = useFacultyBreakdownQuery();
  const retention = useRetentionCurveQuery(6);

  // Computed once when the page mounts, rather than on every render, to keep
  // the "30 days ago" cutoff stable for the lifetime of this view.
  const [thirtyDaysAgoCutoff] = useState(() => Date.now() - 30 * 24 * 60 * 60 * 1000);

  const newUsers30d = useMemo(() => {
    return (users.data?.rows ?? []).filter((u) => new Date(u.created_at).getTime() >= thirtyDaysAgoCutoff).length;
  }, [users.data, thirtyDaysAgoCutoff]);

  const retentionWeek4 = retention.data?.find((r) => r.week_number === 4)?.retained_pct;

  const kpiDefs = [
    { label: 'Total Users', value: users.data?.totalCount ?? 0, iconName: 'users' as const, iconBg: 'var(--color-violet-bg)', color: 'var(--color-violet)' },
    { label: 'New (this page, 30d)', value: newUsers30d, iconName: 'user' as const, iconBg: 'var(--color-green-bg)', color: 'var(--color-green)' },
    { label: 'Retained after 4wk', value: retentionWeek4 != null ? `${retentionWeek4}%` : '—', iconName: 'activity' as const, iconBg: 'var(--color-amber-bg)', color: 'var(--color-amber)' },
    { label: 'Faculties Tracked', value: facultyBreakdown.data?.length ?? 0, iconName: 'building' as const, iconBg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
  ];

  const maxFaculty = Math.max(1, ...(facultyBreakdown.data ?? []).map((f) => f.user_count));
  const totalFacultyUsers = (facultyBreakdown.data ?? []).reduce((s, f) => s + f.user_count, 0) || 1;

  const yearDonutData = (yearBreakdown.data ?? []).map((y, i) => ({ label: y.study_year, value: y.user_count, color: YEAR_COLORS[i % YEAR_COLORS.length] }));
  const totalYearUsers = yearDonutData.reduce((s, d) => s + d.value, 0);

  const activeHoursData = (activeHours.data ?? []).map((h) => ({
    label: `${h.hour_of_day % 12 === 0 ? 12 : h.hour_of_day % 12}${h.hour_of_day < 12 ? 'a' : 'p'}`,
    value: h.activity_count,
  }));

  const retentionMax = Math.max(1, ...(retention.data ?? []).map((r) => r.retained_pct));

  const handleSort = (key: NonNullable<UserFilters['sortBy']>) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortBy(key);
      setSortDir('desc');
    }
    setPage(1);
  };

  return (
    <>
      <div className="kpi-grid">
        {users.isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {!users.isLoading && kpiDefs.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} iconName={k.iconName} iconBg={k.iconBg} iconColor={k.color} compact />
        ))}
      </div>

      <div className="split-grid">
        <Card>
          <div className="card-title">Active Hours</div>
          <div className="card-subtitle">When students engage with Riply (last 30 days)</div>
          <div style={{ marginTop: 18 }}>
            {activeHours.isLoading ? <CardSkeleton height={190} /> : <SimpleBarChart data={activeHoursData} ariaLabel="Activity by hour of day" tickInterval={3} />}
          </div>
        </Card>
        <Card>
          <div className="card-title">By Year of Study</div>
          <div className="card-subtitle">Audience composition</div>
          {yearBreakdown.isLoading ? (
            <CardSkeleton height={160} />
          ) : yearDonutData.length === 0 ? (
            <EmptyState title="No data yet" icon="users" />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                <DonutChart data={yearDonutData} centerValue={String(totalYearUsers)} centerLabel="users" />
              </div>
              <DonutLegend data={yearDonutData} />
            </>
          )}
        </Card>
      </div>

      <div className="even-grid">
        <Card>
          <div className="card-title">Top Faculties</div>
          <div className="card-subtitle">Share of registered users</div>
          {facultyBreakdown.isLoading ? (
            <CardSkeleton height={160} />
          ) : (facultyBreakdown.data ?? []).length === 0 ? (
            <EmptyState title="No faculty data yet" icon="building" />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              {facultyBreakdown.data?.map((f) => (
                <div key={f.program}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{f.program}</span>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--color-text-muted)' }}>{((f.user_count / totalFacultyUsers) * 100).toFixed(0)}%</span>
                  </div>
                  <div style={{ height: 11, borderRadius: 999, background: 'var(--color-surface-muted)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(f.user_count / maxFaculty) * 100}%`, borderRadius: 999, background: 'linear-gradient(90deg,#7C5CFF,#19BFFF)' }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card>
          <div className="card-title">Retention</div>
          <div className="card-subtitle">Returning users by week since signup</div>
          {retention.isLoading ? (
            <CardSkeleton height={150} />
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, marginTop: 20, height: 150 }}>
              {retention.data?.map((r) => (
                <div key={r.week_number} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-secondary)' }}>{r.retained_pct}%</span>
                  <div
                    style={{
                      width: '100%',
                      height: Math.max(4, (r.retained_pct / retentionMax) * 120),
                      borderRadius: 8,
                      background: r.week_number === 0 ? 'linear-gradient(180deg,#7C5CFF,#B06BFF)' : 'linear-gradient(180deg,#E4E8F4,#D4D9E2)',
                    }}
                  />
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--color-text-faint)' }}>Wk {r.week_number}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <div className="table-toolbar">
          <div className="card-title">Members</div>
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" />
        </div>

        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="Member" sortKey="name" activeSortKey={sortBy ?? 'created_at'} sortDir={sortDir} onSort={handleSort} />
                <th>Year</th>
                <th>Program</th>
                <th style={{ textAlign: 'right' }}>Role</th>
                <SortableHeader label="Joined" sortKey="created_at" activeSortKey={sortBy ?? 'created_at'} sortDir={sortDir} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {users.isLoading && Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)}
              {users.data?.rows.map((m, i) => (
                <tr key={m.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 13,
                          fontWeight: 800,
                          color: '#fff',
                          background: m.avatar_color || AVATAR_COLORS[i % AVATAR_COLORS.length],
                        }}
                      >
                        {initialOf(m.name || m.email)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{m.name || m.email}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>{m.year ? `Year ${m.year}` : '—'}</td>
                  <td style={{ color: 'var(--color-text-secondary)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{m.program || m.campus || '—'}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 600, textTransform: 'capitalize' }}>{m.role || 'organizer'}</td>
                  <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)', fontWeight: 600 }}>{formatDate(m.created_at, { month: 'short', year: 'numeric' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.isError && <ErrorState message="Couldn't load users." onRetry={() => users.refetch()} />}
        {!users.isLoading && users.data?.rows.length === 0 && <EmptyState title="No users found" description="Try adjusting your search." icon="search" />}

        {users.data && (
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(users.data.totalCount / PAGE_SIZE))} totalCount={users.data.totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </Card>
    </>
  );
}
