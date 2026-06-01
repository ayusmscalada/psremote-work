import "dotenv/config";
import cors from "cors";
import express from "express";
import jwt from "jsonwebtoken";
import {
  getCustomerIdsForWorker,
  setWorkerAllowances,
  workerCanAccessCustomer,
  countWorkersWithAccess,
} from "./db/allowances.js";
import {
  buildApplicationData,
  formatApplication,
} from "./applications.js";
import {
  countApplicationsForCustomer,
  countCompletedApplicationsForCustomer,
  createApplication,
  deleteApplication,
  findApplicationById,
  findWorkerApplication,
  getApplicationsForCustomer,
  getWorkerApplications,
  updateApplication,
} from "./db/applications.js";
import {
  countBidsForCustomer,
  getAllBids,
  getAllJobs,
  getBidsForJobIds,
  getJobsByCustomerId,
} from "./db/jobs.js";
import {
  authenticateUser,
  createUser,
  deleteUser,
  findUserById,
  getUsersByRole,
  updateUser,
  usernameExists,
} from "./db/users.js";

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

app.use(cors());
app.use(express.json());

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((err) => {
      const message = err.message || "Server error";
      const status = message.includes("not found")
        ? 404
        : message.includes("denied") || message.includes("Access")
          ? 403
          : message.includes("required") ||
              message.includes("Invalid") ||
              message.includes("must be")
            ? 400
            : message.includes("exists") || message.includes("duplicate")
              ? 409
              : 500;
      res.status(status).json({ error: message });
    });
  };
}

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }
    next();
  };
}

function validateCredentials(username, password, requirePassword = true) {
  if (!username?.trim()) return "Username is required";
  if (requirePassword && !password) return "Password is required";
  return null;
}

async function formatApplicationWithWorker(app) {
  const worker = await findUserById(app.workerId);
  return formatApplication({
    ...app,
    workerUsername: worker?.username || `Worker #${app.workerId}`,
  });
}

function createRoleRoutes(role) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);

  app.get(
    `/api/admin/${role}s`,
    authMiddleware,
    requireRole("admin"),
    asyncHandler(async (_req, res) => {
      const usersList = await getUsersByRole(role);
      if (role === "worker") {
        const usersWithAllowances = await Promise.all(
          usersList.map(async (user) => ({
            ...user,
            allowedCustomerIds: await getCustomerIdsForWorker(user.id),
          }))
        );
        res.json({ users: usersWithAllowances });
        return;
      }
      res.json({ users: usersList });
    })
  );

  app.post(
    `/api/admin/${role}s`,
    authMiddleware,
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { username, password } = req.body;
      const validationError = validateCredentials(username, password);
      if (validationError) return res.status(400).json({ error: validationError });

      if (await usernameExists(username.trim())) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const user = await createUser({ username, password, role });
      res.status(201).json({ user });
    })
  );

  app.put(
    `/api/admin/${role}s/:id`,
    authMiddleware,
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const user = await findUserById(req.params.id);
      if (!user || user.role !== role) {
        return res.status(404).json({ error: `${label} not found` });
      }

      const { username, password } = req.body;
      const validationError = validateCredentials(username, password, false);
      if (validationError) return res.status(400).json({ error: validationError });

      if (username?.trim() && (await usernameExists(username.trim(), user.id))) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const updated = await updateUser(user.id, { username, password });
      res.json({ user: updated });
    })
  );

  app.delete(
    `/api/admin/${role}s/:id`,
    authMiddleware,
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const user = await findUserById(req.params.id);
      if (!user || user.role !== role) {
        return res.status(404).json({ error: `${label} not found` });
      }

      await deleteUser(user.id);
      res.json({ success: true });
    })
  );
}

createRoleRoutes("worker");
createRoleRoutes("customer");

app.put(
  "/api/admin/workers/:id/allowances",
  authMiddleware,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const worker = await findUserById(req.params.id);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    const { customerIds } = req.body;
    if (!Array.isArray(customerIds)) {
      return res.status(400).json({ error: "customerIds must be an array" });
    }

    const validCustomerIds = (await getUsersByRole("customer")).map((c) => c.id);
    const normalizedIds = [...new Set(customerIds.map(Number))];

    if (normalizedIds.some((id) => !validCustomerIds.includes(id))) {
      return res.status(400).json({ error: "One or more customers not found" });
    }

    await setWorkerAllowances(worker.id, normalizedIds);
    res.json({ allowedCustomerIds: await getCustomerIdsForWorker(worker.id) });
  })
);

app.post(
  "/api/login",
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }

    const user = await authenticateUser(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, user });
  })
);

app.get("/api/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

app.get(
  "/api/admin/overview",
  authMiddleware,
  requireRole("admin"),
  asyncHandler(async (_req, res) => {
    const [jobs, bids, workers, customers] = await Promise.all([
      getAllJobs(),
      getAllBids(),
      getUsersByRole("worker"),
      getUsersByRole("customer"),
    ]);

    res.json({
      stats: {
        totalJobs: jobs.length,
        openJobs: jobs.filter((j) => j.status === "open").length,
        totalBids: bids.length,
        workers: workers.length,
        customers: customers.length,
      },
      jobs,
      bids,
    });
  })
);

app.get(
  "/api/customer/overview",
  authMiddleware,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const customerId = req.user.id;
    const [applications, workersWithAccess, platformJobs, bids, completedApplications] =
      await Promise.all([
        countApplicationsForCustomer(customerId),
        countWorkersWithAccess(customerId),
        getJobsByCustomerId(customerId),
        countBidsForCustomer(customerId),
        countCompletedApplicationsForCustomer(customerId),
      ]);

    res.json({
      stats: {
        applications,
        workersWithAccess,
        platformJobs: platformJobs.length,
        bids,
        completedApplications,
      },
    });
  })
);

app.get(
  "/api/customer/applications",
  authMiddleware,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const applications = await getApplicationsForCustomer(req.user.id);
    const formatted = await Promise.all(applications.map(formatApplicationWithWorker));
    res.json({ applications: formatted });
  })
);

app.get(
  "/api/customer/applications/:id",
  authMiddleware,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const application = await findApplicationById(req.params.id);
    if (!application || application.customerId !== req.user.id) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json({ application: await formatApplicationWithWorker(application) });
  })
);

app.get(
  "/api/customer/jobs",
  authMiddleware,
  requireRole("customer"),
  asyncHandler(async (req, res) => {
    const customerJobs = await getJobsByCustomerId(req.user.id);
    const jobIds = customerJobs.map((job) => job.id);
    const jobBids = await getBidsForJobIds(jobIds);
    const jobsWithBids = customerJobs.map((job) => ({
      ...job,
      bids: jobBids.filter((bid) => bid.jobId === job.id),
    }));
    res.json({ jobs: jobsWithBids });
  })
);

app.get(
  "/api/worker/jobs",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const workerId = req.user.id;
    const allowedCustomerIds = await getCustomerIdsForWorker(workerId);
    const customers = (await getUsersByRole("customer")).filter((c) =>
      allowedCustomerIds.includes(c.id)
    );

    const allowedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const applications = await getWorkerApplications(workerId, customer.id);
        return { ...customer, applicationCount: applications.length };
      })
    );

    res.json({ allowedCustomers });
  })
);

app.get(
  "/api/worker/customers/:customerId",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const customerId = Number(req.params.customerId);
    const workerId = req.user.id;

    if (!(await workerCanAccessCustomer(workerId, customerId))) {
      return res.status(403).json({ error: "Access denied for this customer" });
    }

    const customer = await findUserById(customerId);
    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ error: "Customer not found" });
    }

    const applications = await getWorkerApplications(workerId, customerId);

    res.json({
      profile: {
        id: customer.id,
        username: customer.username,
        applicationCount: applications.length,
      },
      applications: applications.map(formatApplication),
    });
  })
);

app.post(
  "/api/worker/customers/:customerId/applications",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const customerId = Number(req.params.customerId);
    const workerId = req.user.id;

    if (!(await workerCanAccessCustomer(workerId, customerId))) {
      return res.status(403).json({ error: "Access denied for this customer" });
    }

    const customer = await findUserById(customerId);
    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ error: "Customer not found" });
    }

    const parsed = buildApplicationData(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const application = await createApplication({
      workerId,
      customerId,
      ...parsed.data,
    });

    res.status(201).json({ application: formatApplication(application) });
  })
);

app.get(
  "/api/worker/applications/:id",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const application = await findWorkerApplication(req.user.id, req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }
    res.json({ application: formatApplication(application) });
  })
);

app.put(
  "/api/worker/applications/:id",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const application = await findWorkerApplication(req.user.id, req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }

    const parsed = buildApplicationData(req.body, application);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const updated = await updateApplication(application.id, parsed.data);
    res.json({ application: formatApplication(updated) });
  })
);

app.delete(
  "/api/worker/applications/:id",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const application = await findWorkerApplication(req.user.id, req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }

    await deleteApplication(application.id);
    res.json({ success: true });
  })
);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
