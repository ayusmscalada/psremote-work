import "dotenv/config";
import bcrypt from "bcryptjs";
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
  deleteApplicationScreenshot,
  formatApplication,
} from "./applications.js";
import { parseApplicationFiltersQuery } from "./applicationFilters.js";
import {
  getDistinctWorkerUsernamesForCustomer,
  getDistinctWorkerUsernamesForCustomers,
  listApplications,
} from "./db/applicationList.js";
import { autoAllocateJobToCustomers } from "./matching/autoAllocate.js";
import { buildPaginationMeta, parsePaginationQuery } from "./pagination.js";
import {
  countApplicationsForCustomer,
  countCompletedApplicationsForCustomer,
  countIncompleteApplicationsForCustomer,
  createApplication,
  deleteApplication,
  claimApplicationBid,
  findApplicationAccessibleToWorker,
  findApplicationById,
  findOwnedApplication,
  reassignApplicationCustomer,
  updateApplication,
} from "./db/applications.js";
import {
  countBidsForCustomer,
  getAllBids,
  getAllJobs,
  getBidsForJobIds,
  getJobsByCustomerId,
  listBidsPaginated,
  listJobsPaginated,
} from "./db/jobs.js";
import {
  authenticateUser,
  createUser,
  deleteUser,
  findUserById,
  getUsersByRole,
  listUsersByRole,
  sanitizeUser,
  updateUser,
  usernameExists,
} from "./db/users.js";
import { buildCustomerProfileResponse, pickCustomerProfile, validateCustomerProfile } from "./db/customerProfile.js";
import { uploadScreenshot } from "./s3.js";
import { screenshotUpload } from "./upload.js";

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
            : message.includes("exists") ||
                message.includes("duplicate") ||
                message.includes("already registered")
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
  const registrarId = app.registeredByWorkerId ?? app.workerId;
  const [registrar, assignee] = await Promise.all([
    findUserById(registrarId),
    findUserById(app.workerId),
  ]);
  const registrarName = registrar?.username || `Worker #${registrarId}`;
  const assigneeName = assignee?.username || `Worker #${app.workerId}`;
  return formatApplication({
    ...app,
    workerUsername: registrarName,
    registeredByUsername: registrarName,
    assigneeUsername: assigneeName !== registrarName ? assigneeName : null,
  });
}

async function formatApplicationForWorkerView(app, { customerMap, currentWorkerId } = {}) {
  const registrarId = app.registeredByWorkerId ?? app.workerId;
  const [assignee, registrar, customer] = await Promise.all([
    findUserById(app.workerId),
    findUserById(registrarId),
    customerMap?.get(app.customerId) ?? findUserById(app.customerId),
  ]);
  const registrarName = registrar?.username || `Worker #${registrarId}`;
  const assigneeName = assignee?.username || `Worker #${app.workerId}`;
  const isOwnedByMe = currentWorkerId != null && app.workerId === currentWorkerId;
  const assigneeBidStatus = app.bidStatus;
  return formatApplication({
    ...app,
    workerUsername: assigneeName,
    registeredByUsername: registrarName,
    assigneeUsername: assigneeName,
    assigneeBidStatus,
    customerUsername: customer?.username || `Customer #${app.customerId}`,
    isOwnedByMe,
    canClaimBid:
      currentWorkerId != null && !isOwnedByMe && assigneeBidStatus === "not_yet",
  });
}

async function formatApplicationWithCustomer(app, customerMap) {
  const customer =
    customerMap?.get(app.customerId) || (await findUserById(app.customerId));
  return formatApplication({
    ...app,
    customerUsername: customer?.username || `Customer #${app.customerId}`,
  });
}

function createRoleRoutes(role) {
  const label = role.charAt(0).toUpperCase() + role.slice(1);

  app.get(
    `/api/admin/${role}s`,
    authMiddleware,
    requireRole("admin"),
    asyncHandler(async (req, res) => {
      const { page, pageSize, from, to } = parsePaginationQuery(req.query);

      const { items, total } = await listUsersByRole(role, {
        search: req.query.search || "",
        techStack: req.query.techStack || "",
        from,
        to,
      });

      if (role === "worker") {
        const usersWithAllowances = await Promise.all(
          items.map(async (user) => ({
            ...user,
            allowedCustomerIds: await getCustomerIdsForWorker(user.id),
          }))
        );
        return res.json({
          users: usersWithAllowances,
          pagination: buildPaginationMeta(total, page, pageSize),
        });
      }

      res.json({
        users: items,
        pagination: buildPaginationMeta(total, page, pageSize),
      });
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

      if (role === "customer") {
        const profileError = validateCustomerProfile(req.body);
        if (profileError) return res.status(400).json({ error: profileError });
      }

      const user = await createUser({
        username: req.body.username,
        password: req.body.password,
        role,
        ...(role === "customer" ? req.body : {}),
      });
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

      if (role === "customer") {
        const profileError = validateCustomerProfile(req.body);
        if (profileError) return res.status(400).json({ error: profileError });
      }

      const updated = await updateUser(user.id, {
        username: req.body.username,
        password: req.body.password,
        ...(role === "customer" ? req.body : {}),
        ...(role === "worker" && req.body.canAutoMatchUpload !== undefined
          ? { canAutoMatchUpload: req.body.canAutoMatchUpload }
          : {}),
      });
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

    if (req.body.canAutoMatchUpload !== undefined) {
      await updateUser(worker.id, {
        canAutoMatchUpload: Boolean(req.body.canAutoMatchUpload),
      });
    }

    const updatedWorker = await findUserById(worker.id);
    res.json({
      allowedCustomerIds: await getCustomerIdsForWorker(worker.id),
      canAutoMatchUpload: updatedWorker?.canAutoMatchUpload ?? false,
    });
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

app.get("/api/me", authMiddleware, asyncHandler(async (req, res) => {
  const user = await findUserById(req.user.id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json({ user: sanitizeUser(user) });
}));

app.put(
  "/api/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const { username, password, currentPassword } = req.body;
    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const validationError = validateCredentials(username, password, false);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    if (user.role === "customer") {
      const profileError = validateCustomerProfile(req.body);
      if (profileError) return res.status(400).json({ error: profileError });
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required to set a new password" });
      }
      const fullUser = await findUserById(req.user.id);
      const valid = await bcrypt.compare(currentPassword, fullUser.password);
      if (!valid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
    }

    if (username?.trim() && (await usernameExists(username.trim(), user.id))) {
      return res.status(409).json({ error: "Username already exists" });
    }

    const updatePayload = {
      username,
      password,
      ...(user.role === "customer" ? pickCustomerProfile(req.body) : {}),
    };

    const updated = await updateUser(user.id, updatePayload);
    const token = jwt.sign(
      { id: updated.id, username: updated.username, role: updated.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ user: updated, token });
  })
);

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
    });
  })
);

app.get(
  "/api/admin/platform-jobs",
  authMiddleware,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, from, to } = parsePaginationQuery(req.query);
    const { items, total } = await listJobsPaginated({
      search: req.query.search || "",
      status: req.query.status || "all",
      customerId: req.query.customerId || "",
      from,
      to,
    });

    res.json({
      jobs: items,
      pagination: buildPaginationMeta(total, page, pageSize),
    });
  })
);

app.get(
  "/api/admin/platform-bids",
  authMiddleware,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { page, pageSize, from, to } = parsePaginationQuery(req.query);
    const { items, total } = await listBidsPaginated({
      search: req.query.search || "",
      status: req.query.status || "all",
      jobId: req.query.jobId || "",
      from,
      to,
    });

    res.json({
      bids: items,
      pagination: buildPaginationMeta(total, page, pageSize),
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
    const customerId = req.user.id;
    const { page, pageSize, from, to } = parsePaginationQuery(req.query);
    const filters = parseApplicationFiltersQuery(req.query);

    const { items, total } = await listApplications({
      customerId,
      filters,
      from,
      to,
    });

    const formatted = await Promise.all(items.map(formatApplicationWithWorker));
    const workerUsernames = await getDistinctWorkerUsernamesForCustomer(customerId);

    res.json({
      applications: formatted,
      pagination: buildPaginationMeta(total, page, pageSize),
      filterOptions: { workers: workerUsernames },
    });
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

    const worker = await findUserById(workerId);
    const allowedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const [applicationCount, pendingBidCount] = await Promise.all([
          countApplicationsForCustomer(customer.id),
          countIncompleteApplicationsForCustomer(customer.id),
        ]);
        return { ...customer, applicationCount, pendingBidCount };
      })
    );

    res.json({
      allowedCustomers,
      canAutoMatchUpload: worker?.canAutoMatchUpload ?? false,
    });
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

    const applicationCount = await countApplicationsForCustomer(customerId);
    const { page, pageSize, from, to } = parsePaginationQuery(req.query);
    const filters = parseApplicationFiltersQuery(req.query);

    const { items, total } = await listApplications({
      customerId,
      filters,
      from,
      to,
    });

    const workerUsernames = await getDistinctWorkerUsernamesForCustomer(customerId);
    const formatted = await Promise.all(
      items.map((app) =>
        formatApplicationForWorkerView(app, { currentWorkerId: workerId })
      )
    );

    res.json({
      profile: buildCustomerProfileResponse(customer, { applicationCount }),
      applications: formatted,
      pagination: buildPaginationMeta(total, page, pageSize),
      filterOptions: { workers: workerUsernames },
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

app.post(
  "/api/worker/applications/auto-match",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const workerId = req.user.id;
    const allowedCustomerIds = await getCustomerIdsForWorker(workerId);

    const parsed = buildApplicationData(req.body);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    if (parsed.data.bidStatus !== "not_yet") {
      return res.status(400).json({
        error: "Auto-match uploads must start with bid status Not Yet",
      });
    }

    try {
      const result = await autoAllocateJobToCustomers({
        workerId,
        jobData: parsed.data,
        allowedCustomerIds,
      });

      const customers = (await getUsersByRole("customer")).filter((c) =>
        allowedCustomerIds.includes(c.id)
      );
      const customerMap = new Map(customers.map((c) => [c.id, c]));

      const created = await Promise.all(
        result.created.map(async (item) => ({
          customerUsername: item.customerUsername,
          matchScore: item.matchScore,
          matchRationale: item.matchRationale,
          application: await formatApplicationForWorkerView(item.application, {
            customerMap,
            currentWorkerId: workerId,
          }),
        }))
      );

      const payload = {
        matches: result.matches,
        created,
        skipped: result.skipped,
        unmatched: result.unmatched,
        message:
          created.length === 0
            ? result.matches.length === 0
              ? "No customer profiles matched this job."
              : "Matched profiles found but no new jobs were created (duplicates or errors)."
            : `Created ${created.length} job${created.length !== 1 ? "s" : ""} across matching customers.`,
      };

      res.status(created.length > 0 ? 201 : 200).json(payload);
    } catch (err) {
      if (err.message?.includes("OpenAI is not configured")) {
        return res.status(503).json({ error: err.message });
      }
      if (err.message?.includes("Auto-match job upload is not enabled")) {
        return res.status(403).json({ error: err.message });
      }
      if (err.message?.includes("OpenAI request failed")) {
        return res.status(502).json({ error: err.message });
      }
      return res.status(400).json({ error: err.message });
    }
  })
);

app.get(
  "/api/worker/applications",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const workerId = req.user.id;
    const allowedCustomerIds = await getCustomerIdsForWorker(workerId);
    const customers = (await getUsersByRole("customer")).filter((c) =>
      allowedCustomerIds.includes(c.id)
    );
    const customerMap = new Map(customers.map((c) => [c.id, c]));

    const rawCustomerId = req.query.customerId;
    let filterCustomerIds = allowedCustomerIds;

    if (
      rawCustomerId != null &&
      rawCustomerId !== "" &&
      rawCustomerId !== "all"
    ) {
      const customerId = Number(rawCustomerId);
      if (!allowedCustomerIds.includes(customerId)) {
        return res.status(403).json({ error: "Access denied for this customer" });
      }
      filterCustomerIds = [customerId];
    }

    const { page, pageSize, from, to } = parsePaginationQuery(req.query);
    const filters = parseApplicationFiltersQuery(req.query);

    const { items, total } = await listApplications({
      customerIds: filterCustomerIds,
      filters,
      from,
      to,
    });

    const workerUsernames = await getDistinctWorkerUsernamesForCustomers(filterCustomerIds);
    const formatted = await Promise.all(
      items.map((app) =>
        formatApplicationForWorkerView(app, { customerMap, currentWorkerId: workerId })
      )
    );

    res.json({
      applications: formatted,
      pagination: buildPaginationMeta(total, page, pageSize),
      filterOptions: { workers: workerUsernames },
    });
  })
);

app.get(
  "/api/worker/applications/:id",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const application = await findApplicationAccessibleToWorker(
      req.user.id,
      req.params.id
    );
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }
    const customer = await findUserById(application.customerId);
    const customerMap = new Map([[application.customerId, customer]]);
    res.json({
      application: await formatApplicationForWorkerView(application, {
        customerMap,
        currentWorkerId: req.user.id,
      }),
    });
  })
);

app.post(
  "/api/worker/applications/:id/claim-bid",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    try {
      const updated = await claimApplicationBid(req.params.id, req.user.id);
      const customer = await findUserById(updated.customerId);
      const customerMap = new Map([[updated.customerId, customer]]);
      res.json({
        application: await formatApplicationForWorkerView(updated, {
          customerMap,
          currentWorkerId: req.user.id,
        }),
      });
    } catch (err) {
      if (err.message === "Job application not found") {
        return res.status(404).json({ error: err.message });
      }
      if (err.message === "You already own this job") {
        return res.status(400).json({ error: err.message });
      }
      if (err.message === "Take Bid is only available when bid status is Not Yet") {
        return res.status(400).json({ error: err.message });
      }
      throw err;
    }
  })
);

app.put(
  "/api/worker/applications/:id/screenshot",
  authMiddleware,
  requireRole("worker"),
  screenshotUpload.single("screenshot"),
  asyncHandler(async (req, res) => {
    const application = await findOwnedApplication(req.user.id, req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Screenshot image file is required" });
    }

    if (application.screenshotLink) {
      await deleteApplicationScreenshot(application);
    }

    const uploaded = await uploadScreenshot(req.file, application.id);
    const updated = await updateApplication(application.id, {
      screenshotLink: uploaded.publicUrl,
    });

    res.json({ application: formatApplication(updated) });
  })
);

app.put(
  "/api/worker/applications/:id",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const application = await findOwnedApplication(req.user.id, req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }

    const newCustomerId =
      req.body.customerId != null ? Number(req.body.customerId) : application.customerId;

    if (req.body.customerId != null) {
      if (!(await workerCanAccessCustomer(req.user.id, newCustomerId))) {
        return res.status(403).json({ error: "Access denied for this customer" });
      }
    }

    const jobFieldKeys = ["jobLink", "jobTitle", "jobDescription", "companyName", "bidStatus"];
    const hasJobFieldUpdates = jobFieldKeys.some((key) => req.body[key] !== undefined);

    if (req.body.customerId != null && !hasJobFieldUpdates) {
      const updated = await reassignApplicationCustomer(
        application.id,
        req.user.id,
        newCustomerId
      );
      const customer = await findUserById(updated.customerId);
      return res.json({
        application: formatApplication({
          ...updated,
          customerUsername: customer?.username || `Customer #${updated.customerId}`,
        }),
      });
    }

    const parsed = buildApplicationData(req.body, application);
    if (parsed.error) return res.status(400).json({ error: parsed.error });

    const updateData = { ...parsed.data };
    if (req.body.customerId != null && newCustomerId !== application.customerId) {
      await reassignApplicationCustomer(application.id, req.user.id, newCustomerId);
      updateData.customerId = newCustomerId;
    }

    const updated = await updateApplication(application.id, updateData, {
      customerId: newCustomerId,
    });
    const customer = await findUserById(updated.customerId);
    res.json({
      application: formatApplication({
        ...updated,
        customerUsername: customer?.username || `Customer #${updated.customerId}`,
      }),
    });
  })
);

app.delete(
  "/api/worker/applications/:id",
  authMiddleware,
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    const application = await findOwnedApplication(req.user.id, req.params.id);
    if (!application) {
      return res.status(404).json({ error: "Job application not found" });
    }

    await deleteApplicationScreenshot(application);
    await deleteApplication(application.id);
    res.json({ success: true });
  })
);

app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Screenshot must be 5 MB or smaller" });
  }
  if (err?.message?.includes("Screenshot must be an image")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
