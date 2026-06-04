import { mapCustomerProfileFromRow } from "./customerProfile.js";

export function mapUser(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    username: row.username,
    password: row.password,
    role: row.role,
    ...mapCustomerProfileFromRow(row),
  };
}

export function mapJob(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    title: row.title,
    description: row.description,
    customerId: Number(row.customer_id),
    status: row.status,
    budget: row.budget != null ? Number(row.budget) : null,
  };
}

export function mapBid(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    jobId: Number(row.job_id),
    workerId: Number(row.worker_id),
    amount: Number(row.amount),
    message: row.message,
    status: row.status,
  };
}

export function mapApplication(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    workerId: Number(row.worker_id),
    customerId: Number(row.customer_id),
    jobLink: row.job_link,
    jobTitle: row.job_title,
    jobDescription: row.job_description,
    companyName: row.company_name,
    bidStatus: row.bid_status,
    screenshotLink: row.screenshot_link,
    createdAt: row.created_at,
  };
}

export function toApplicationRow(data) {
  const row = {};
  if (data.jobLink !== undefined) row.job_link = data.jobLink;
  if (data.jobTitle !== undefined) row.job_title = data.jobTitle;
  if (data.jobDescription !== undefined) row.job_description = data.jobDescription;
  if (data.companyName !== undefined) row.company_name = data.companyName;
  if (data.bidStatus !== undefined) row.bid_status = data.bidStatus;
  if (data.screenshotLink !== undefined) row.screenshot_link = data.screenshotLink;
  if (data.jobLinkNormalized !== undefined) row.job_link_normalized = data.jobLinkNormalized;
  if (data.customerId !== undefined) row.customer_id = data.customerId;
  return row;
}
