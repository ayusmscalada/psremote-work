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
