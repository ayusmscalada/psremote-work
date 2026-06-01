import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import UserCrudPanel from "../components/UserCrudPanel";
import WorkerAllowancePanel from "../components/WorkerAllowancePanel";
import AdminProfilePanel from "../components/AdminProfilePanel";
import "../components/AppShell.css";
import "./AdminDashboard.css";

const adminNav = [
  { id: "overview", label: "Dashboard", icon: "▣" },
  { id: "workers", label: "Workers", icon: "◉" },
  { id: "customers", label: "Customers", icon: "◎" },
  { id: "access", label: "Worker Access", icon: "⇄" },
  { id: "jobs", label: "Jobs & Bids", icon: "☰" },
  { id: "profile", label: "Profile", icon: "⚙" },
];

const sectionMeta = {
  overview: {
    title: "Dashboard",
    description: "Overview of workers, customers, jobs, and bids.",
  },
  workers: {
    title: "Workers",
    description: "Create, update, and remove worker accounts.",
  },
  customers: {
    title: "Customers",
    description: "Create, view, update, and delete customer accounts and profile details.",
  },
  access: {
    title: "Worker Access",
    description: "Control which customers each worker can access.",
  },
  jobs: {
    title: "Jobs & Bids",
    description: "View all platform jobs and recent bids.",
  },
  profile: {
    title: "Profile",
    description: "Update your admin username and password.",
  },
};

export default function AdminDashboard() {
  const { token } = useAuth();
  const [activeSection, setActiveSection] = useState("overview");
  const [data, setData] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [error, setError] = useState("");

  async function loadAll() {
    const [overview, workerData, customerData] = await Promise.all([
      apiFetch("/admin/overview", { token }),
      apiFetch("/admin/workers", { token }),
      apiFetch("/admin/customers", { token }),
    ]);
    setData(overview);
    setWorkers(workerData.users);
    setCustomers(customerData.users);
  }

  useEffect(() => {
    loadAll().catch((err) => setError(err.message));
  }, [token]);

  const meta = sectionMeta[activeSection];

  function renderContent() {
    if (activeSection === "profile") {
      if (error) return <div className="error-banner">{error}</div>;
      return (
        <div className="admin-panel">
          <AdminProfilePanel token={token} />
        </div>
      );
    }

    if (error) return <div className="error-banner">{error}</div>;
    if (!data) return <div className="loading-screen">Loading...</div>;

    const { stats, jobs, bids } = data;

    switch (activeSection) {
      case "overview":
        return (
          <>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="stat-label">Workers</div>
                <div className="stat-value">{stats.workers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-label">Customers</div>
                <div className="stat-value">{stats.customers}</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-label">Open Jobs</div>
                <div className="stat-value">{stats.openJobs}</div>
              </div>
              <div className="admin-stat-card">
                <div className="stat-label">Total Bids</div>
                <div className="stat-value">{stats.totalBids}</div>
              </div>
            </div>
            <div className="admin-panel">
              <h2 className="section-title">Quick summary</h2>
              <p className="card-meta">
                {stats.workers} workers, {stats.customers} customers, {jobs.length} jobs,{" "}
                {bids.length} bids on the platform.
              </p>
            </div>
          </>
        );

      case "workers":
        return (
          <div className="admin-panel">
            <UserCrudPanel
              title="Workers"
              role="worker"
              users={workers}
              token={token}
              onChange={loadAll}
              hideTitle
            />
          </div>
        );

      case "customers":
        return (
          <div className="admin-panel">
            <UserCrudPanel
              title="Customers"
              role="customer"
              users={customers}
              token={token}
              onChange={loadAll}
              hideTitle
            />
          </div>
        );

      case "access":
        return (
          <div className="admin-panel">
            <WorkerAllowancePanel
              workers={workers}
              customers={customers}
              token={token}
              onChange={loadAll}
              hideTitle
            />
          </div>
        );

      case "jobs":
        return (
          <>
            <div className="admin-panel">
              <h2 className="section-title">All Jobs</h2>
              {jobs.length === 0 ? (
                <p className="card-meta">No jobs.</p>
              ) : (
                <div className="admin-jobs-list">
                  {jobs.map((job) => (
                    <div key={job.id} className="admin-job-item">
                      <div className="card-title">{job.title}</div>
                      <div className="card-meta">
                        Budget: ${job.budget.toLocaleString()} · Customer #{job.customerId} ·{" "}
                        <span className={`status status-${job.status}`}>
                          {job.status.replace("_", " ")}
                        </span>
                      </div>
                      <p>{job.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="admin-panel">
              <h2 className="section-title">Recent Bids</h2>
              {bids.length === 0 ? (
                <p className="card-meta">No bids.</p>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Job ID</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map((bid) => (
                        <tr key={bid.id}>
                          <td>#{bid.jobId}</td>
                          <td>${bid.amount.toLocaleString()}</td>
                          <td>
                            <span className={`status status-${bid.status}`}>{bid.status}</span>
                          </td>
                          <td>{bid.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        );

      default:
        return null;
    }
  }

  return (
    <AppShell
      role="admin"
      subtitle="Admin Console"
      navItems={adminNav}
      activeSection={activeSection}
      onNavigate={setActiveSection}
    >
      <header className="admin-page-header">
        <h1 className="admin-page-title">{meta.title}</h1>
        <p className="admin-page-desc">{meta.description}</p>
      </header>
      {renderContent()}
    </AppShell>
  );
}
