import { useCallback, useState } from "react";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./usePagination";

export function useServerPagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    rangeStart: 0,
    rangeEnd: 0,
    hasPrev: false,
    hasNext: false,
  });

  const applyResponse = useCallback((pagination) => {
    if (!pagination) return;
    setPage(pagination.page);
    setPageSize(pagination.pageSize);
    setMeta({
      total: pagination.total,
      totalPages: pagination.totalPages,
      rangeStart: pagination.rangeStart,
      rangeEnd: pagination.rangeEnd,
      hasPrev: pagination.hasPrev,
      hasNext: pagination.hasNext,
    });
  }, []);

  function resetPage() {
    setPage(DEFAULT_PAGE);
  }

  function handlePageSizeChange(nextSize) {
    setPageSize(Number(nextSize));
    setPage(DEFAULT_PAGE);
  }

  return {
    page,
    setPage,
    pageSize,
    setPageSize: handlePageSizeChange,
    resetPage,
    applyResponse,
    ...meta,
  };
}
