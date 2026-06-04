export const DUPLICATE_JOB_LINK_ERROR =
  "This job link is already registered for this customer. The full URL is compared, including path and query parameters (?…).";

/**
 * Normalize a job URL for duplicate detection (per customer).
 * Keeps path and query string; strips hash only; lowercases host; sorts query params for stable matching.
 */
export function normalizeJobLink(raw) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();

    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }

    if (
      (url.protocol === "https:" && url.port === "443") ||
      (url.protocol === "http:" && url.port === "80")
    ) {
      url.port = "";
    }

    url.search = canonicalSearchString(url.searchParams);

    return url.href;
  } catch {
    const withoutHash = trimmed.split("#")[0].trim();
    const [pathPart, queryPart] = splitPathAndQuery(withoutHash);
    let path = pathPart.toLowerCase();
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    const query = queryPart ? `?${canonicalSearchString(parseQueryString(queryPart))}` : "";
    return `${path}${query}`;
  }
}

function splitPathAndQuery(value) {
  const qIndex = value.indexOf("?");
  if (qIndex === -1) return [value, ""];
  return [value.slice(0, qIndex), value.slice(qIndex + 1)];
}

function parseQueryString(queryWithoutQuestion) {
  const params = new URLSearchParams();
  if (queryWithoutQuestion) {
    new URLSearchParams(queryWithoutQuestion).forEach((val, key) => {
      params.append(key, val);
    });
  }
  return params;
}

function canonicalSearchString(params) {
  if (!params || [...params.keys()].length === 0) return "";

  const entries = [];
  for (const key of [...params.keys()].sort()) {
    const values = params.getAll(key).sort();
    for (const value of values) {
      entries.push([key, value]);
    }
  }

  const sorted = new URLSearchParams();
  for (const [key, value] of entries) {
    sorted.append(key, value);
  }

  const serialized = sorted.toString();
  return serialized ? `?${serialized}` : "";
}
