import { useMemo, useState } from 'react';

export interface PaginationState {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  totalPages: number;
  rangeFrom: number;
  rangeTo: number;
}

/** Local pagination-state helper; server-side queries read `page`/`pageSize` from this. */
export function usePagination(totalCount: number, pageSize = 10): PaginationState {
  const [page, setPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  return useMemo(
    () => ({
      page: safePage,
      pageSize,
      setPage,
      totalPages,
      rangeFrom: (safePage - 1) * pageSize,
      rangeTo: safePage * pageSize - 1,
    }),
    [safePage, pageSize, totalPages],
  );
}
