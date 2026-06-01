export const API_BASE = "http://localhost:3001/api";

export const BID_STATUSES = [
  { value: "not_yet", label: "Not Yet" },
  { value: "expired", label: "Expired" },
  { value: "completed", label: "Completed" },
  { value: "error", label: "Error" },
];

export function bidStatusLabel(status) {
  return BID_STATUSES.find((s) => s.value === status)?.label || status;
}
