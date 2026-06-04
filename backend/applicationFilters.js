export function parseApplicationFiltersQuery(query) {
  return {
    search: (query.search || "").trim(),
    bidStatus: query.bidStatus || "all",
    screenshot: query.screenshot || "all",
    registeredFrom: query.registeredFrom || "",
    registeredTo: query.registeredTo || "",
    worker: query.worker || "all",
  };
}

export function sanitizeIlikeTerm(term) {
  return term.replace(/[%_,.()]/g, "").trim();
}
