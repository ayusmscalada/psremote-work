export const BID_STATUSES = ["not_yet", "expired", "completed", "error"];

export const BID_STATUS_LABELS = {
  not_yet: "Not Yet",
  expired: "Expired",
  completed: "Completed",
  error: "Error",
};

export function formatApplication(application) {
  return {
    ...application,
    screenshotUrl: application.screenshotLink || null,
  };
}

export function buildApplicationData(body, existing = null) {
  const jobLink = (body.jobLink ?? existing?.jobLink ?? "").trim();
  const jobTitle = (body.jobTitle ?? existing?.jobTitle ?? "").trim();
  const jobDescription = (body.jobDescription ?? existing?.jobDescription ?? "").trim();
  const companyName = (body.companyName ?? existing?.companyName ?? "").trim();
  const nextBidStatus = body.bidStatus ?? existing?.bidStatus ?? "not_yet";

  if (!jobLink) return { error: "Job link is required" };
  if (!jobTitle) return { error: "Job title is required" };
  if (!jobDescription) return { error: "Job description is required" };
  if (!companyName) return { error: "Company name is required" };
  if (!BID_STATUSES.includes(nextBidStatus)) {
    return { error: "Invalid bid status" };
  }

  const screenshotLink =
    body.screenshotLink !== undefined
      ? body.screenshotLink?.trim() || null
      : existing?.screenshotLink ?? null;

  if (nextBidStatus === "completed" && !screenshotLink) {
    return { error: "Screenshot link is required when bid status is Completed" };
  }

  return {
    data: {
      jobLink,
      jobTitle,
      jobDescription,
      companyName,
      bidStatus: nextBidStatus,
      screenshotLink,
    },
  };
}
