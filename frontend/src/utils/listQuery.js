export function appendPaginationParams(params, { page, pageSize }) {
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
}

export function appendApplicationFilterParams(params, filters) {
  if (!filters) return;
  if (filters.search) params.set("search", filters.search);
  if (filters.bidStatus && filters.bidStatus !== "all") {
    params.set("bidStatus", filters.bidStatus);
  }
  if (filters.screenshot && filters.screenshot !== "all") {
    params.set("screenshot", filters.screenshot);
  }
  if (filters.registeredFrom) params.set("registeredFrom", filters.registeredFrom);
  if (filters.registeredTo) params.set("registeredTo", filters.registeredTo);
  if (filters.worker && filters.worker !== "all") params.set("worker", filters.worker);
}

export function buildApplicationsQuery({ page, pageSize, customerId, filters } = {}) {
  const params = new URLSearchParams();
  appendPaginationParams(params, { page, pageSize });
  if (customerId != null && customerId !== "" && customerId !== "all") {
    params.set("customerId", String(customerId));
  }
  appendApplicationFilterParams(params, filters);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function paginationFromResponse(apiPagination, fallbackPage, fallbackPageSize) {
  if (!apiPagination) {
    return {
      page: fallbackPage,
      pageSize: fallbackPageSize,
      total: 0,
      totalPages: 1,
      rangeStart: 0,
      rangeEnd: 0,
      hasPrev: false,
      hasNext: false,
    };
  }
  return apiPagination;
}
