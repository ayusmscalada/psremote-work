export function getProjectRef() {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) return null;
  return new URL(supabaseUrl).hostname.split(".")[0];
}

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const projectRef = getProjectRef();
  const dbPassword = process.env.SUPABASE_DB_PASSWORD;
  if (!projectRef || !dbPassword) {
    return null;
  }

  const encodedPassword = encodeURIComponent(dbPassword);
  return `postgresql://postgres:${encodedPassword}@db.${projectRef}.supabase.co:5432/postgres`;
}

export function getSqlEditorUrl() {
  const projectRef = getProjectRef();
  if (!projectRef) return "https://supabase.com/dashboard";
  return `https://supabase.com/dashboard/project/${projectRef}/sql/new`;
}
