-- Run this in Supabase SQL Editor if job create fails with screenshot_link error.
-- Or: npm run db:migrate (requires SUPABASE_DB_PASSWORD in backend/.env)

ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS screenshot_link TEXT;

-- Reload PostgREST schema cache (Supabase)
NOTIFY pgrst, 'reload schema';
