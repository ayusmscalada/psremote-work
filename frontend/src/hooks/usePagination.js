import { useEffect, useMemo, useState } from "react";

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function usePagination(items, { pageSize: initialPageSize = DEFAULT_PAGE_SIZE, resetKey } = {}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);

  useEffect(() => {
    setPage(1);
  }, [resetKey, pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const rangeStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalItems);

  function goToPage(nextPage) {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
  }

  function handlePageSizeChange(nextSize) {
    setPageSize(Number(nextSize));
  }

  return {
    paginatedItems,
    page,
    setPage: goToPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalPages,
    totalItems,
    rangeStart,
    rangeEnd,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}
