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

export async function createApplication({ workerId, customerId, ...fields }) {
  const { data, error } = await supabase
    .from("job_applications")
    .insert({
      worker_id: workerId,
      customer_id: customerId,
      ...toApplicationRow(fields),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapApplication(data);
}

export async function updateApplication(id, fields) {
  const { data, error } = await supabase
    .from("job_applications")
    .update(toApplicationRow(fields))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
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
