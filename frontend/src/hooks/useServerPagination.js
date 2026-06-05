import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  parsePaginationFromUrl,
  updateSearchParams,
  writePaginationToParams,
} from "../utils/urlQuery";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./usePagination";

export function useServerPagination(
  initialPageSize = DEFAULT_PAGE_SIZE,
  { syncToUrl = false, pageKey = "page", pageSizeKey = "pageSize" } = {}
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlPagination = useMemo(
    () =>
      syncToUrl
        ? parsePaginationFromUrl(searchParams, { pageKey, pageSizeKey })
        : null,
    [syncToUrl, searchParams, pageKey, pageSizeKey]
  );

  const [localPage, setLocalPage] = useState(DEFAULT_PAGE);
  const [localPageSize, setLocalPageSize] = useState(initialPageSize);
  const [meta, setMeta] = useState({
    total: 0,
    totalPages: 1,
    rangeStart: 0,
    rangeEnd: 0,
    hasPrev: false,
    hasNext: false,
  });

  const page = syncToUrl ? urlPagination.page : localPage;
  const pageSize = syncToUrl ? urlPagination.pageSize : localPageSize;

  const writePage = useCallback(
    (nextPage, nextPageSize = pageSize) => {
      if (syncToUrl) {
        updateSearchParams(setSearchParams, (params) => {
          writePaginationToParams(
            params,
            { page: nextPage, pageSize: nextPageSize },
            { pageKey, pageSizeKey }
          );
        });
      } else {
        setLocalPage(nextPage);
        if (nextPageSize !== localPageSize) {
          setLocalPageSize(nextPageSize);
        }
      }
    },
    [syncToUrl, setSearchParams, pageSize, localPageSize, pageKey, pageSizeKey]
  );

  const applyResponse = useCallback(
    (pagination) => {
      if (!pagination) return;
      const pageChanged = pagination.page !== page || pagination.pageSize !== pageSize;
      if (!syncToUrl || pageChanged) {
        writePage(pagination.page, pagination.pageSize);
      }
      setMeta({
        total: pagination.total,
        totalPages: pagination.totalPages,
        rangeStart: pagination.rangeStart,
        rangeEnd: pagination.rangeEnd,
        hasPrev: pagination.hasPrev,
        hasNext: pagination.hasNext,
      });
    },
    [writePage, syncToUrl, page, pageSize]
  );

  const resetPage = useCallback(() => {
    writePage(DEFAULT_PAGE);
  }, [writePage]);

  const handlePageSizeChange = useCallback(
    (nextSize) => {
      writePage(DEFAULT_PAGE, Number(nextSize));
    },
    [writePage]
  );

  const setPage = useCallback(
    (nextPage) => {
      writePage(nextPage);
    },
    [writePage]
  );

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
