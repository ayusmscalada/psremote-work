CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'customer', 'worker')),
  tech_stack TEXT,
  phone TEXT,
  linkedin TEXT,
  github TEXT,
  email TEXT,
  street TEXT,
  city TEXT,
  state TEXT,
  ssn_last4 TEXT,
  date_of_birth TEXT,
  hourly_rate_range TEXT,
  salary_range TEXT,
  citizenship TEXT,
  nationality TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS tech_stack TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS linkedin TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS street TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ssn_last4 TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hourly_rate_range TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS salary_range TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS citizenship TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS nationality TEXT;

CREATE TABLE IF NOT EXISTS worker_allowances (
  worker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (worker_id, customer_id)
);

CREATE TABLE IF NOT EXISTS jobs (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open',
  budget NUMERIC
);

CREATE TABLE IF NOT EXISTS bids (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  worker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS job_applications (
  id BIGSERIAL PRIMARY KEY,
  worker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_link TEXT NOT NULL,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  company_name TEXT NOT NULL,
  bid_status TEXT NOT NULL DEFAULT 'not_yet',
  screenshot_link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Migrate existing databases
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS screenshot_link TEXT;

CREATE INDEX IF NOT EXISTS idx_job_applications_worker_customer
  ON job_applications(worker_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_job_applications_customer
  ON job_applications(customer_id);

CREATE INDEX IF NOT EXISTS idx_jobs_customer
  ON jobs(customer_id);

-- Public storage bucket for resume/screenshot uploads (publishable key access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('application-files', 'application-files', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read application files" ON storage.objects;
CREATE POLICY "Allow public read application files"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'application-files');

DROP POLICY IF EXISTS "Allow anon insert application files" ON storage.objects;
CREATE POLICY "Allow anon insert application files"
  ON storage.objects FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'application-files');

DROP POLICY IF EXISTS "Allow anon delete application files" ON storage.objects;
CREATE POLICY "Allow anon delete application files"
  ON storage.objects FOR DELETE
  TO anon
  USING (bucket_id = 'application-files');

-- Allow API access via publishable (anon) key
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
