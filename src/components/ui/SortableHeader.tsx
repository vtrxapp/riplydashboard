import { Icon } from './Icon';

interface SortableHeaderProps<TSortKey extends string> {
  label: string;
  sortKey?: TSortKey;
  activeSortKey: TSortKey;
  sortDir: 'asc' | 'desc';
  onSort: (key: TSortKey) => void;
  align?: 'left' | 'right';
}

export function SortableHeader<TSortKey extends string>({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  align = 'left',
}: SortableHeaderProps<TSortKey>) {
  const isActive = sortKey && sortKey === activeSortKey;
  const content = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
      {label}
      {isActive && <Icon name={sortDir === 'asc' ? 'up' : 'down'} size={11} color="var(--color-text-secondary)" />}
    </span>
  );

  if (!sortKey) {
    return <th style={{ textAlign: align }}>{content}</th>;
  }

  return (
    <th className="sortable" onClick={() => onSort(sortKey)} style={{ textAlign: align }} aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      {content}
    </th>
  );
}
