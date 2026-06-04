import bcrypt from "bcryptjs";
import { supabase } from "../supabase/client.js";
import { customerProfileToRow, pickCustomerProfile } from "./customerProfile.js";
import { mapUser } from "./mappers.js";

export function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

export async function findUserById(id) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapUser(data);
}

export async function findUserByUsername(username) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return mapUser(data);
}

export async function getUsersByRole(role) {
  const { data, error } = await supabase.from("users").select("*").eq("role", role);

  if (error) throw new Error(error.message);
  return (data || []).map(mapUser).map(sanitizeUser);
}

export async function listUsersByRole(role, { search = "", techStack = "", from, to } = {}) {
  let query = supabase.from("users").select("*", { count: "exact" }).eq("role", role);

  if (search) {
    const term = search.replace(/[%_,]/g, "").trim();
    if (term) {
      const pattern = `%${term}%`;
      if (role === "customer") {
        query = query.or(
          `username.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern},tech_stack.ilike.${pattern}`
        );
      } else {
        query = query.ilike("username", pattern);
      }
    }
  }

  if (role === "customer" && techStack) {
    const stackTerm = techStack.replace(/[%_,]/g, "").trim();
    if (stackTerm) {
      query = query.ilike("tech_stack", `%${stackTerm}%`);
    }
  }

  query = query.order("id", { ascending: true }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  return {
    items: (data || []).map(mapUser).map(sanitizeUser),
    total: count ?? 0,
  };
}

export async function usernameExists(username, excludeId = null) {
  let query = supabase.from("users").select("id").eq("username", username.trim());
  if (excludeId != null) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).length > 0;
}

export async function createUser({ username, password, role, ...rest }) {
  const passwordHash = await bcrypt.hash(password, 10);
  const row = {
    username: username.trim(),
    password: passwordHash,
    role,
  };

  if (role === "customer") {
    Object.assign(row, customerProfileToRow(pickCustomerProfile(rest)));
  }

  const { data, error } = await supabase.from("users").insert(row).select("*").single();

  if (error) throw new Error(error.message);
  return sanitizeUser(mapUser(data));
}

export async function updateUser(id, { username, password, ...rest }) {
  const updates = {};
  if (username?.trim()) updates.username = username.trim();
  if (password) updates.password = await bcrypt.hash(password, 10);

  const profileUpdates = customerProfileToRow(pickCustomerProfile(rest));
  Object.assign(updates, profileUpdates);

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return sanitizeUser(mapUser(data));
}

export async function deleteUser(id) {
  const { error } = await supabase.from("users").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function authenticateUser(username, password) {
  const user = await findUserByUsername(username);
  if (!user) return null;

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;

  return sanitizeUser(user);
}
