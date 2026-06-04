import { supabase } from "../supabase/client.js";
import { mapBid, mapJob } from "./mappers.js";

export async function getAllJobs() {
  const { data, error } = await supabase.from("jobs").select("*").order("id");
  if (error) throw new Error(error.message);
  return (data || []).map(mapJob);
}

export async function getJobsByCustomerId(customerId) {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("customer_id", customerId)
    .order("id");

  if (error) throw new Error(error.message);
  return (data || []).map(mapJob);
}

export async function getAllBids() {
  const { data, error } = await supabase.from("bids").select("*").order("id");
  if (error) throw new Error(error.message);
  return (data || []).map(mapBid);
}

export async function listJobsPaginated({ search = "", status = "all", customerId = "", from, to }) {
  let query = supabase.from("jobs").select("*", { count: "exact" });

  if (search) {
    const term = search.replace(/[%_,]/g, "").trim();
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(`title.ilike.${pattern},description.ilike.${pattern}`);
    }
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (customerId) {
    const id = Number(customerId);
    if (!Number.isNaN(id)) {
      query = query.eq("customer_id", id);
    }
  }

  query = query.order("id", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { items: (data || []).map(mapJob), total: count ?? 0 };
}

export async function listBidsPaginated({ search = "", status = "all", jobId = "", from, to }) {
  let query = supabase.from("bids").select("*", { count: "exact" });

  if (search) {
    const term = search.replace(/[%_,]/g, "").trim();
    if (term) {
      const pattern = `%${term}%`;
      query = query.or(`message.ilike.${pattern},status.ilike.${pattern}`);
    }
  }

  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  if (jobId) {
    const id = Number(jobId);
    if (!Number.isNaN(id)) {
      query = query.eq("job_id", id);
    }
  }

  query = query.order("id", { ascending: false }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return { items: (data || []).map(mapBid), total: count ?? 0 };
}

export async function getBidsForJobIds(jobIds) {
  if (jobIds.length === 0) return [];

  const { data, error } = await supabase.from("bids").select("*").in("job_id", jobIds);
  if (error) throw new Error(error.message);
  return (data || []).map(mapBid);
}

export async function countBidsForCustomer(customerId) {
  const jobs = await getJobsByCustomerId(customerId);
  const jobIds = jobs.map((job) => job.id);
  if (jobIds.length === 0) return 0;

  const { count, error } = await supabase
    .from("bids")
    .select("*", { count: "exact", head: true })
    .in("job_id", jobIds);

  if (error) throw new Error(error.message);
  return count || 0;
}
