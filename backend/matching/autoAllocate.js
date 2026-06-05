import { DUPLICATE_JOB_LINK_ERROR } from "../jobLink.js";
import { createApplication } from "../db/applications.js";
import { findUserById } from "../db/users.js";
import { matchJobToCustomerProfiles } from "./jobProfileMatch.js";

export async function autoAllocateJobToCustomers({ workerId, jobData, allowedCustomerIds }) {
  const worker = await findUserById(workerId);
  if (!worker || worker.role !== "worker") {
    throw new Error("Worker not found");
  }
  if (!worker.canAutoMatchUpload) {
    throw new Error("Auto-match job upload is not enabled for your account. Contact your admin.");
  }

  const customers = [];
  for (const customerId of allowedCustomerIds) {
    const customer = await findUserById(customerId);
    if (customer?.role === "customer") {
      customers.push(customer);
    }
  }

  if (customers.length === 0) {
    throw new Error("No allowed customers to match against");
  }

  const matches = await matchJobToCustomerProfiles(jobData, customers);
  const customerById = new Map(customers.map((c) => [c.id, c]));

  const created = [];
  const skipped = [];

  for (const match of matches) {
    const customer = customerById.get(match.customerId);
    try {
      const application = await createApplication({
        workerId,
        customerId: match.customerId,
        ...jobData,
      });
      created.push({
        application,
        customerUsername: customer?.username,
        matchScore: match.score,
        matchRationale: match.rationale,
      });
    } catch (err) {
      const reason =
        err.message === DUPLICATE_JOB_LINK_ERROR
          ? "Job link already registered for this customer"
          : err.message;
      skipped.push({
        customerId: match.customerId,
        customerUsername: customer?.username,
        matchScore: match.score,
        matchRationale: match.rationale,
        reason,
      });
    }
  }

  const unmatched = customers
    .filter((c) => !matches.some((m) => m.customerId === c.id))
    .map((c) => ({
      customerId: c.id,
      customerUsername: c.username,
      reason: "Not selected by profile matching",
    }));

  return {
    matches: matches.map((m) => ({
      ...m,
      customerUsername: customerById.get(m.customerId)?.username,
    })),
    created,
    skipped,
    unmatched,
  };
}
