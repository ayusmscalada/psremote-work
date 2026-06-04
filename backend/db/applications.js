import { DUPLICATE_JOB_LINK_ERROR, normalizeJobLink } from "../jobLink.js";
import { supabase } from "../supabase/client.js";
import { mapApplication, toApplicationRow } from "./mappers.js";

export async function getWorkerApplications(workerId, customerId) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("worker_id", workerId)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

/** All applications for a worker, optionally limited to specific customer IDs. */
export async function getAllWorkerApplications(workerId, customerIds) {
  if (!customerIds?.length) {
    return [];
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("worker_id", workerId)
    .in("customer_id", customerIds)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function getApplicationsForCustomer(customerId) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []).map(mapApplication);
}

export async function findApplicationById(id) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapApplication(data);
}

export async function findWorkerApplication(workerId, applicationId) {
  const application = await findApplicationById(applicationId);
  if (!application || application.workerId !== workerId) return null;
  return application;
}

export async function findCustomerApplicationByNormalizedJobLink(
  customerId,
  jobLink,
  excludeApplicationId = null
) {
  const normalized = normalizeJobLink(jobLink);
  if (!normalized) return null;

  let query = supabase
    .from("job_applications")
    .select("id")
    .eq("customer_id", customerId)
    .eq("job_link_normalized", normalized)
    .limit(1);

  if (excludeApplicationId != null) {
    query = query.neq("id", excludeApplicationId);
  }

  const { data, error } = await query;
  if (error) {
    if (error.message?.includes("job_link_normalized")) {
      return findCustomerApplicationByNormalizedJobLinkFallback(
        customerId,
        normalized,
        excludeApplicationId
      );
    }
    throw new Error(error.message);
  }

  return data?.[0] ? mapApplication(data[0]) : null;
}

async function findCustomerApplicationByNormalizedJobLinkFallback(
  customerId,
  normalized,
  excludeApplicationId
) {
  const applications = await getApplicationsForCustomer(customerId);
  return (
    applications.find(
      (app) =>
        app.id !== excludeApplicationId && normalizeJobLink(app.jobLink) === normalized
    ) || null
  );
}

async function assertUniqueJobLinkForCustomer(customerId, fields, excludeApplicationId = null) {
  const existing = await findCustomerApplicationByNormalizedJobLink(
    customerId,
    fields.jobLink,
    excludeApplicationId
  );
  if (existing) {
    throw new Error(DUPLICATE_JOB_LINK_ERROR);
  }
}

export async function createApplication({ workerId, customerId, ...fields }) {
  await assertUniqueJobLinkForCustomer(customerId, fields);
  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      worker_id: workerId,
      customer_id: customerId,
      ...toApplicationRow(fields),
    })
    .select("*")
    .single();

  if (error) {
    if (isDuplicateJobLinkError(error)) {
      throw new Error(DUPLICATE_JOB_LINK_ERROR);
    }
    throw new Error(error.message);
  }
  return mapApplication(data);
}

function isDuplicateJobLinkError(error) {
  return (
    error.code === "23505" ||
    error.message?.includes("idx_job_applications_customer_normalized_link") ||
    error.message?.includes("duplicate key")
  );
}

export async function reassignApplicationCustomer(applicationId, workerId, newCustomerId) {
  const application = await findWorkerApplication(workerId, applicationId);
  if (!application) {
    throw new Error("Job application not found");
  }

  if (application.customerId === newCustomerId) {
    return application;
  }

  await assertUniqueJobLinkForCustomer(
    newCustomerId,
    { jobLink: application.jobLink },
    applicationId
  );

  const { data, error } = await supabase
    .from("job_applications")
    .update({ customer_id: newCustomerId })
    .eq("id", applicationId)
    .select("*")
    .single();

  if (error) {
    if (isDuplicateJobLinkError(error)) {
      throw new Error(DUPLICATE_JOB_LINK_ERROR);
    }
    throw new Error(error.message);
  }
  return mapApplication(data);
}

export async function updateApplication(id, fields, { customerId } = {}) {
  const linkCustomerId = customerId ?? fields.customerId;
  if (linkCustomerId != null && fields.jobLink !== undefined) {
    await assertUniqueJobLinkForCustomer(linkCustomerId, fields, id);
  }

  const { data, error } = await supabase
    .from("job_applications")
    .update(toApplicationRow(fields))
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (isDuplicateJobLinkError(error)) {
      throw new Error(DUPLICATE_JOB_LINK_ERROR);
    }
    throw new Error(error.message);
  }
  return mapApplication(data);
}

export async function deleteApplication(id) {
  const { error } = await supabase.from("job_applications").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function countApplicationsForCustomer(customerId) {
  const { count, error } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function countCompletedApplicationsForCustomer(customerId) {
  const { count, error } = await supabase
    .from("job_applications")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId)
    .eq("bid_status", "completed");

  if (error) throw new Error(error.message);
  return count || 0;
}

/** Backfill job_link_normalized after schema patch (npm run db:patch). Re-runs when normalization rules change. */
export async function backfillJobLinkNormalized({ force = true } = {}) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("id, job_link, job_link_normalized");

  if (error) {
    if (error.message?.includes("job_link_normalized")) {
      return { updated: 0, skipped: true };
    }
    throw new Error(error.message);
  }

  let updated = 0;
  for (const row of data || []) {
    const normalized = normalizeJobLink(row.job_link);
    if (!force && row.job_link_normalized === normalized) continue;

    const { error: updateError } = await supabase
      .from("job_applications")
      .update({ job_link_normalized: normalized })
      .eq("id", row.id);

    if (updateError) throw new Error(updateError.message);
    updated += 1;
  }

  return { updated, skipped: false };
}
