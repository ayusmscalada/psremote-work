import { supabase } from "../supabase/client.js";

export async function getCustomerIdsForWorker(workerId) {
  const { data, error } = await supabase
    .from("worker_allowances")
    .select("customer_id")
    .eq("worker_id", workerId);

  if (error) throw new Error(error.message);
  return (data || []).map((row) => Number(row.customer_id));
}

export async function setWorkerAllowances(workerId, customerIds) {
  const { error: deleteError } = await supabase
    .from("worker_allowances")
    .delete()
    .eq("worker_id", workerId);

  if (deleteError) throw new Error(deleteError.message);
  if (customerIds.length === 0) return;

  const rows = customerIds.map((customerId) => ({
    worker_id: workerId,
    customer_id: customerId,
  }));

  const { error: insertError } = await supabase.from("worker_allowances").insert(rows);
  if (insertError) throw new Error(insertError.message);
}

export async function workerCanAccessCustomer(workerId, customerId) {
  const { data, error } = await supabase
    .from("worker_allowances")
    .select("customer_id")
    .eq("worker_id", workerId)
    .eq("customer_id", customerId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return Boolean(data);
}

export async function countWorkersWithAccess(customerId) {
  const { count, error } = await supabase
    .from("worker_allowances")
    .select("*", { count: "exact", head: true })
    .eq("customer_id", customerId);

  if (error) throw new Error(error.message);
  return count || 0;
}
