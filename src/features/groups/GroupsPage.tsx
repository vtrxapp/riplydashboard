import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { KpiCardSkeleton, CardSkeleton, TableRowSkeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Pagination } from '@/components/ui/Pagination';
import { SortableHeader } from '@/components/ui/SortableHeader';
import { DonutChart, DonutLegend } from '@/components/charts/DonutChart';
import { DualAreaChart } from '@/components/charts/DualAreaChart';
import { useUiStore } from '@/stores/uiStore';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useGroupsQuery } from '@/hooks/queries/useGroups';
import { useGroupTypeBreakdownQuery, useMemberGrowthQuery } from '@/hooks/queries/useAnalytics';
import { GroupPrivacyBadge } from './components/GroupPrivacyBadge';
import { PAGE_SIZE } from '@/utils/constants';
import { formatCompactNumber, formatDate, titleCase } from '@/utils/format';
import type { GroupFilters, GroupPrivacy } from '@/types/group';

const PRIVACY_FILTERS: { id: GroupPrivacy | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'public', label: 'Public' },
  { id: 'private', label: 'Private' },
];

const GROUP_GRADIENTS = [
  'linear-gradient(135deg,#2F6BFF,#6C4DF2)',
  'linear-gradient(135deg,#FF5A8A,#FF8A3D)',
  'linear-gradient(135deg,#7C5CFF,#B06BFF)',
  'linear-gradient(135deg,#10B981,#06B6D4)',
  'linear-gradient(135deg,#FF6B6B,#FFB347)',
];

export default function GroupsPage() {
  const range = useUiStore((s) => s.range);
  const [privacyFilter, setPrivacyFilter] = useState<GroupPrivacy | 'all'>('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [sortBy, setSortBy] = useState<GroupFilters['sortBy']>('member_count');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const filters: GroupFilters = { privacy: privacyFilter, search: debouncedSearch, sortBy, sortDir, page, pageSize: PAGE_SIZE };
  const groups = useGroupsQuery(filters);
  const typeBreakdown = useGroupTypeBreakdownQuery();
  const memberGrowth = useMemberGrowthQuery(range);

  const totalMembers = (groups.data?.rows ?? []).reduce((s, g) => s + (g.member_count || 0), 0);
  const totalGroups = groups.data?.totalCount ?? 0;
  const newJoins30d = (memberGrowth.data ?? []).reduce((s, p) => s + p.new_joins, 0);
  const avgEvents = groups.data?.rows.length ? (groups.data.rows.reduce((s, g) => s + (g.event_count || 0), 0) / groups.data.rows.length).toFixed(1) : '0';

  const kpiDefs = [
    { label: 'Total Communities', value: totalGroups, iconName: 'group' as const, iconBg: 'var(--color-violet-bg)', color: 'var(--color-violet)' },
    { label: 'Members (this page)', value: totalMembers, iconName: 'users' as const, iconBg: 'var(--color-brand-50)', color: 'var(--color-brand-500)' },
    { label: 'New Joins (range)', value: newJoins30d, iconName: 'user' as const, iconBg: 'var(--color-green-bg)', color: 'var(--color-green)' },
    { label: 'Avg. Events/Group', value: avgEvents, iconName: 'activity' as const, iconBg: 'var(--color-amber-bg)', color: 'var(--color-amber)' },
  ];

  const donutColors: Record<string, string> = { public: '#0098F0', private: '#7C5CFF', invite: '#FFB020' };
  const donutData = (typeBreakdown.data ?? []).map((d) => ({ label: titleCase(d.privacy), value: d.group_count, color: donutColors[d.privacy] ?? '#9AA3B2' }));
  const totalTyped = donutData.reduce((s, d) => s + d.value, 0);

  const growthChartData = (memberGrowth.data ?? []).map((p) => ({ label: formatDate(p.bucket), a: p.active_members, b: p.new_joins }));

  const handleSort = (key: NonNullable<GroupFilters['sortBy']>) => {
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
        {groups.isLoading && Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)}
        {!groups.isLoading && kpiDefs.map((k) => (
          <KpiCard key={k.label} label={k.label} value={k.value} iconName={k.iconName} iconBg={k.iconBg} iconColor={k.color} compact />
        ))}
      </div>

      <div className="split-grid">
        <Card>
          <div className="card-header-row">
            <div>
              <div className="card-title">Member Growth</div>
              <div className="card-subtitle">New joins vs. active members</div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            {memberGrowth.isLoading ? (
              <CardSkeleton height={210} />
            ) : (
              <DualAreaChart data={growthChartData} aLabel="Active members" bLabel="New joins" aColor="#7C5CFF" bColor="#19BFFF" />
            )}
          </div>
        </Card>

        <Card>
          <div className="card-title">Group Types</div>
          <div className="card-subtitle">Public vs. private vs. invite</div>
          {typeBreakdown.isLoading ? (
            <CardSkeleton height={160} />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 10 }}>
                <DonutChart data={donutData} centerValue={String(totalTyped)} centerLabel="groups" />
              </div>
              <DonutLegend data={donutData} />
            </>
          )}
        </Card>
      </div>

      <Card style={{ marginTop: 16 }}>
        <div className="table-toolbar">
          <div className="card-title">Top Communities</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search groups…" />
            <div className="pill-group" role="tablist" aria-label="Filter by privacy">
              {PRIVACY_FILTERS.map((f) => (
                <button key={f.id} role="tab" aria-pressed={f.id === privacyFilter} className="pill" onClick={() => { setPrivacyFilter(f.id); setPage(1); }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="data-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <SortableHeader label="Community" sortKey="name" activeSortKey={sortBy ?? 'member_count'} sortDir={sortDir} onSort={handleSort} />
                <th>Type</th>
                <SortableHeader label="Members" sortKey="member_count" activeSortKey={sortBy ?? 'member_count'} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortableHeader label="Events" sortKey="event_count" activeSortKey={sortBy ?? 'member_count'} sortDir={sortDir} onSort={handleSort} align="right" />
                <th style={{ textAlign: 'right' }}>Posts</th>
              </tr>
            </thead>
            <tbody>
              {groups.isLoading && Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)}
              {groups.data?.rows.map((g, i) => (
                <tr key={g.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 11,
                          flex: 'none',
                          background: g.logo_color || GROUP_GRADIENTS[i % GROUP_GRADIENTS.length],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 800,
                        }}
                      >
                        {g.initial || g.name?.charAt(0) || '?'}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{g.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-faint)' }}>{g.category}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <GroupPrivacyBadge privacy={g.privacy || 'public'} />
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatCompactNumber(g.member_count)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--color-green)' }}>{g.event_count ?? 0}</td>
                  <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--color-text-secondary)' }}>{g.post_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {groups.isError && <ErrorState message="Couldn't load groups." onRetry={() => groups.refetch()} />}
        {!groups.isLoading && groups.data?.rows.length === 0 && (
          <EmptyState title="No groups found" description="Try adjusting your search or filters." icon="search" />
        )}

        {groups.data && (
          <Pagination page={page} totalPages={Math.max(1, Math.ceil(groups.data.totalCount / PAGE_SIZE))} totalCount={groups.data.totalCount} pageSize={PAGE_SIZE} onPageChange={setPage} />
        )}
      </Card>
    </>
  );
}
