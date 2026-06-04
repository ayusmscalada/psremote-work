export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export function parsePaginationQuery(query) {
  const page = Math.max(1, parseInt(query.page, 10) || DEFAULT_PAGE);
  let pageSize = parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE;
  if (!PAGE_SIZE_OPTIONS.includes(pageSize)) {
    pageSize = DEFAULT_PAGE_SIZE;
  }
  pageSize = Math.min(pageSize, MAX_PAGE_SIZE);

  return { page, pageSize, from: (page - 1) * pageSize, to: (page - 1) * pageSize + pageSize - 1 };
}

export function buildPaginationMeta(total, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const rangeStart = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd = Math.min(safePage * pageSize, total);

  return {
    page: safePage,
    pageSize,
    total,
    totalPages,
    rangeStart,
    rangeEnd,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
  };
}
