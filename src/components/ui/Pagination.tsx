import { Button } from './Button';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalCount, pageSize, onPageChange }: PaginationProps) {
  if (totalCount === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <nav className="pagination-bar" aria-label="Pagination">
      <span style={{ fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 600 }}>
        Showing {from}–{to} of {totalCount}
      </span>
      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          Previous
        </Button>
        <span style={{ fontSize: 13, fontWeight: 700, alignSelf: 'center', color: 'var(--color-text-secondary)' }}>
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </nav>
  );
}
