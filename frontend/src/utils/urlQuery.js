import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "../hooks/usePagination";

export function getStringParam(searchParams, name, fallback = "") {
  const value = searchParams.get(name);
  return value ?? fallback;
}

export function getIntParam(searchParams, name, fallback, min = 1) {
  const raw = searchParams.get(name);
  if (raw == null || raw === "") return fallback;
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed >= min ? parsed : fallback;
}

/** Write param only when different from default (omitted from URL when default). */
export function setQueryParam(params, name, value, defaultValue) {
  if (value == null || value === "" || value === defaultValue) {
    params.delete(name);
  } else {
    params.set(name, String(value));
  }
}

export function prefixedName(prefix, name) {
  if (!prefix) return name;
  return `${prefix}${name.charAt(0).toUpperCase()}${name.slice(1)}`;
}

export function parseApplicationFiltersFromUrl(searchParams, { includeWorker = false } = {}) {
  const filters = {
    search: getStringParam(searchParams, "search"),
    bidStatus: getStringParam(searchParams, "bidStatus", "all"),
    screenshot: getStringParam(searchParams, "screenshot", "all"),
    registeredFrom: getStringParam(searchParams, "registeredFrom"),
    registeredTo: getStringParam(searchParams, "registeredTo"),
  };
  if (includeWorker) {
    filters.worker = getStringParam(searchParams, "worker", "all");
  }
  return filters;
}

export function writeApplicationFiltersToParams(params, filters, defaults) {
  setQueryParam(params, "search", filters.search, defaults.search);
  setQueryParam(params, "bidStatus", filters.bidStatus, defaults.bidStatus);
  setQueryParam(params, "screenshot", filters.screenshot, defaults.screenshot);
  setQueryParam(params, "registeredFrom", filters.registeredFrom, defaults.registeredFrom);
  setQueryParam(params, "registeredTo", filters.registeredTo, defaults.registeredTo);
  if (defaults.worker !== undefined) {
    setQueryParam(params, "worker", filters.worker, defaults.worker);
  }
}

export function parsePaginationFromUrl(searchParams, { pageKey = "page", pageSizeKey = "pageSize" } = {}) {
  return {
    page: getIntParam(searchParams, pageKey, DEFAULT_PAGE),
    pageSize: getIntParam(searchParams, pageSizeKey, DEFAULT_PAGE_SIZE),
  };
}

export function writePaginationToParams(
  params,
  { page, pageSize },
  { pageKey = "page", pageSizeKey = "pageSize" } = {}
) {
  setQueryParam(params, pageKey, page, DEFAULT_PAGE);
  setQueryParam(params, pageSizeKey, pageSize, DEFAULT_PAGE_SIZE);
}

export function updateSearchParams(setSearchParams, mutator) {
  setSearchParams(
    (prev) => {
      const next = new URLSearchParams(prev);
      mutator(next);
      return next;
    },
    { replace: true }
  );
}
