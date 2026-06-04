export const DUPLICATE_JOB_LINK_ERROR =
  "This job link is already registered for this customer. URLs that differ only by query parameters (?...) count as the same job.";

/**
 * Normalize a job URL for duplicate detection (per customer).
 * Strips query string and hash; lowercases host; trims trailing slashes on path.
 */
export function normalizeJobLink(raw) {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(withProtocol);
    url.search = "";
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

    return url.href;
  } catch {
    const withoutHash = trimmed.split("#")[0];
    const withoutQuery = withoutHash.split("?")[0].trim().toLowerCase();
    if (withoutQuery.length > 1 && withoutQuery.endsWith("/")) {
      return withoutQuery.slice(0, -1);
    }
    return withoutQuery;
  }
}
