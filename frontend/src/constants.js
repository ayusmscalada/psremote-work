export { API_BASE } from "./config";

export const BID_STATUSES = [
  { value: "not_yet", label: "Not Yet" },
  { value: "expired", label: "Expired" },
  { value: "completed", label: "Completed" },
  { value: "error", label: "Error" },
];

export function bidStatusLabel(status) {
  return BID_STATUSES.find((s) => s.value === status)?.label || status;
}

/** Bid status of whoever currently owns the job (the assignee). */
export function assigneeBidStatusValue(app) {
  return app.assigneeBidStatus ?? app.bidStatus;
}

export function formatAssigneeBidStatus(app, { isOwned = false } = {}) {
  const status = assigneeBidStatusValue(app);
  const label = bidStatusLabel(status);
  if (isOwned) return label;
  const who = app.assigneeUsername || app.workerUsername || "Assignee";
  return `${who}: ${label}`;
}
