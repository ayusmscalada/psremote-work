import "dotenv/config";
import bcrypt from "bcryptjs";
import { setWorkerAllowances } from "../db/allowances.js";
import { createApplication } from "../db/applications.js";
import { supabase } from "../supabase/client.js";
import { applySchema, isMissingTableError } from "./migrate.js";

async function seed() {
  let { count, error: countError } = await supabase
    .from("users")
    .select("id", { count: "exact" })
    .limit(0);

  if (countError && isMissingTableError(countError.message)) {
    console.log("Tables not found — applying schema...");
    await applySchema();
    ({ count, error: countError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .limit(0));
  }

  if (countError) throw new Error(countError.message);
  if (count > 0) {
    console.log("Database already seeded, skipping.");
    return;
  }

  const passwordHash = async (value) => bcrypt.hash(value, 10);

  const { data: users, error: usersError } = await supabase
    .from("users")
    .insert([
      { username: "admin", password: await passwordHash("admin123"), role: "admin" },
      { username: "customer", password: await passwordHash("customer123"), role: "customer",
        tech_stack: "React, Node.js, PostgreSQL",
        email: "customer@example.com",
        phone: "+1 555 010 0200",
        linkedin: "https://linkedin.com/in/demo-customer",
        github: "https://github.com/demo-customer",
        street: "123 Main St",
        city: "Austin",
        state: "TX",
        zip_code: "78701",
        ssn_last4: "1234",
        date_of_birth: "1990-05-15",
        hourly_rate_range: "$50–$80/hr",
        salary_range: "$100k–$150k",
        citizenship: "US",
        nationality: "American",
      },
      { username: "worker", password: await passwordHash("worker123"), role: "worker" },
    ])
    .select("*");

  if (usersError) throw new Error(usersError.message);

  const customer = users.find((user) => user.role === "customer");
  const worker = users.find((user) => user.role === "worker");

  await setWorkerAllowances(worker.id, [customer.id]);

  const { error: jobsError } = await supabase.from("jobs").insert([
    {
      title: "Office network setup",
      description: "Configure routers and Wi-Fi for a 20-person office.",
      customer_id: customer.id,
      status: "open",
      budget: 2500,
    },
    {
      title: "Website maintenance",
      description: "Monthly updates and security patches for company site.",
      customer_id: customer.id,
      status: "in_progress",
      budget: 800,
    },
    {
      title: "Data migration",
      description: "Move legacy CRM records to a new platform.",
      customer_id: customer.id,
      status: "open",
      budget: 4200,
    },
  ]);

  if (jobsError) throw new Error(jobsError.message);

  const { data: jobs } = await supabase.from("jobs").select("id").eq("customer_id", customer.id);
  const jobIds = (jobs || []).map((job) => job.id);

  if (jobIds.length >= 2) {
    await supabase.from("bids").insert([
      {
        job_id: jobIds[0],
        worker_id: worker.id,
        amount: 2300,
        message: "Can start next week.",
        status: "pending",
      },
      {
        job_id: jobIds[2] || jobIds[0],
        worker_id: worker.id,
        amount: 3900,
        message: "Experienced with CRM migrations.",
        status: "pending",
      },
    ]);
  }

  await createApplication({
    workerId: worker.id,
    customerId: customer.id,
    jobLink: "https://example.com/jobs/network-engineer",
    jobTitle: "Network Engineer",
    jobDescription: "Remote network setup and maintenance role.",
    companyName: "TechCorp Inc.",
    bidStatus: "not_yet",
    screenshotLink: null,
  });

  console.log("Seed data inserted.");
  console.log("Demo accounts: admin/admin123, customer/customer123, worker/worker123");
}

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
