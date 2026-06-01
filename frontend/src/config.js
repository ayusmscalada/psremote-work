/**
 * API base URL for all backend requests.
 * Set VITE_API_BASE_URL in frontend/.env (see .env.example).
 */
function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

const configured = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE = normalizeBaseUrl(
  configured || "http://localhost:3001/api"
);
