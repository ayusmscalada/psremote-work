import { sanitizeIlikeTerm } from "../applicationFilters.js";
import { supabase } from "../supabase/client.js";
import { findUserByUsername } from "./users.js";
import { mapApplication } from "./mappers.js";

function applyApplicationFilters(query, filters) {
  if (!filters) return query;

  if (filters.search) {
    const term = sanitizeIlikeTerm(filters.search);
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(
        `job_title.ilike.${pattern},company_name.ilike.${pattern},job_link.ilike.${pattern}`
      );
    }
  }

  if (filters.bidStatus && filters.bidStatus !== "all") {
    query = query.eq("bid_status", filters.bidStatus);
  }

  if (filters.screenshot === "yes") {
    query = query.not("screenshot_link", "is", null);
  } else if (filters.screenshot === "no") {
    query = query.is("screenshot_link", null);
  }

  if (filters.registeredFrom) {
    const start = new Date(filters.registeredFrom);
    if (!Number.isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0);
      query = query.gte("created_at", start.toISOString());
    }
  }

  if (filters.registeredTo) {
    const end = new Date(filters.registeredTo);
    if (!Number.isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999);
      query = query.lte("created_at", end.toISOString());
    }
  }

  if (filters.assigneeWorkerId != null) {
    query = query.eq("worker_id", filters.assigneeWorkerId);
  }

  if (filters.registeredByWorkerId != null) {
    query = query.eq("registered_by_worker_id", filters.registeredByWorkerId);
  }

  return query;
}

export async function listApplications({
  workerId,
  customerId,
  customerIds,
  filters,
  from,
  to,
}) {
  if (customerIds && customerIds.length === 0) {
    return { items: [], total: 0 };
  }

  let query = supabase.from("job_applications").select("*", { count: "exact" });

  if (workerId != null) {
    query = query.eq("worker_id", workerId);
  }

  if (customerId != null) {
    query = query.eq("customer_id", customerId);
  } else if (customerIds?.length) {
    query = query.in("customer_id", customerIds);
  }

  const resolvedFilters = { ...filters };
  if (filters?.worker && filters.worker !== "all") {
    const workerUser = await findUserByUsername(filters.worker);
    if (!workerUser) {
      return { items: [], total: 0 };
    }
    resolvedFilters.registeredByWorkerId = workerUser.id;
  }

  if (filters?.assignee && filters.assignee !== "all") {
    const assigneeUser = await findUserByUsername(filters.assignee);
    if (!assigneeUser) {
      return { items: [], total: 0 };
    }
    resolvedFilters.assigneeWorkerId = assigneeUser.id;
  }

  query = applyApplicationFilters(query, resolvedFilters);
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    items: (data || []).map(mapApplication),
    total: count ?? 0,
  };
}

export async function getDistinctWorkerUsernamesForCustomers(customerIds) {
  if (!customerIds?.length) return [];

  const { data, error } = await supabase
    .from("job_applications")
    .select("registered_by_worker_id, worker_id")
    .in("customer_id", customerIds);

  if (error) throw new Error(error.message);

  const workerIds = [
    ...new Set(
      (data || []).flatMap((row) => [
        row.registered_by_worker_id ?? row.worker_id,
        row.worker_id,
      ])
    ),
  ];
  if (workerIds.length === 0) return [];

  const { data: workers, error: workersError } = await supabase
    .from("users")
    .select("username")
    .in("id", workerIds)
    .eq("role", "worker");

  if (workersError) throw new Error(workersError.message);

  return (workers || []).map((w) => w.username).sort((a, b) => a.localeCompare(b));
}

export async function getDistinctWorkerUsernamesForCustomer(customerId) {
  const { data, error } = await supabase
    .from("job_applications")
    .select("registered_by_worker_id, worker_id")
    .eq("customer_id", customerId);

  if (error) throw new Error(error.message);

  const workerIds = [
    ...new Set(
      (data || []).flatMap((row) => [
        row.registered_by_worker_id ?? row.worker_id,
        row.worker_id,
      ])
    ),
  ];
  if (workerIds.length === 0) return [];

  const { data: workers, error: workersError } = await supabase
    .from("users")
    .select("username")
    .in("id", workerIds)
    .eq("role", "worker");

  if (workersError) throw new Error(workersError.message);

  return (workers || []).map((w) => w.username).sort((a, b) => a.localeCompare(b));
}
