# PS Remote Work Dashboard

A simple React + Node.js dashboard with role-based login for **Admin**, **Customer**, and **Worker**. No registration — use the pre-configured demo accounts.

## Demo accounts

| Role       | Username   | Password     |
|------------|------------|--------------|
| Admin      | `admin`    | `admin123`   |
| Customer   | `customer` | `customer123`|
| Worker     | `worker`   | `worker123`  |

## Quick start

### 1. Configure Supabase

Create a [Supabase](https://supabase.com) project, then:

1. Copy `backend/.env.example` to `backend/.env`
2. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` (Settings → API → Project API keys)
3. Set `SUPABASE_DB_PASSWORD` (Settings → Database → Database password) — used once to create tables
4. Apply schema and seed demo data:

```bash
npm run db:migrate
npm run db:seed
```

`db:seed` will also run the migration automatically if tables are missing (when `SUPABASE_DB_PASSWORD` is set).

### 2. Configure frontend (optional)

Copy `frontend/.env.example` to `frontend/.env` and set the API URL if the backend is not on `http://localhost:3001`:

```env
VITE_API_BASE_URL=http://localhost:3001/api
```

Restart the Vite dev server after changing `.env`.

### 3. Run the app

Install dependencies:

```bash
npm run install:all
```

Start the API (terminal 1):

```bash
npm run dev:backend
```

Start the frontend (terminal 2):

```bash
npm run dev:frontend
```

Open [http://localhost:5173](http://localhost:5173) and sign in with one of the demo accounts.

## Project structure

```
backend/     Express API with JWT auth, Supabase Postgres + Storage
frontend/    React (Vite) SPA with role dashboards
```

## API endpoints

- `POST /api/login` — authenticate
- `GET /api/me` — current user (requires token)
- `GET /api/admin/overview` — dashboard stats (admin)
- `GET /api/admin/workers` — list workers (admin)
- `POST /api/admin/workers` — create worker (admin)
- `PUT /api/admin/workers/:id` — update worker (admin)
- `DELETE /api/admin/workers/:id` — delete worker (admin)
- `PUT /api/admin/workers/:id/allowances` — set customer access for worker (admin)
- `GET /api/admin/customers` — list customers (admin)
- `POST /api/admin/customers` — create customer (admin)
- `PUT /api/admin/customers/:id` — update customer (admin)
- `DELETE /api/admin/customers/:id` — delete customer (admin)
- `GET /api/customer/overview` — dashboard stats (customer)
- `GET /api/customer/applications` — worker job applications (customer)
- `GET /api/customer/applications/:id` — application detail (customer)
- `GET /api/customer/jobs` — platform jobs (customer)
- `GET /api/worker/jobs` — allowed customers for worker
- `GET /api/worker/customers/:id` — customer profile and applications (worker)
- `POST /api/worker/customers/:id/applications` — add job application (worker)
- `GET /api/worker/applications/:id` — get job application (worker)
- `PUT /api/worker/applications/:id` — update job application (worker)
- `DELETE /api/worker/applications/:id` — delete job application (worker)
