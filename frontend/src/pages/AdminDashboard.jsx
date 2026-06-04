import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import UserCrudPanel from "../components/UserCrudPanel";
import WorkerAllowancePanel from "../components/WorkerAllowancePanel";
import AdminProfilePanel from "../components/AdminProfilePanel";
import { AdminBidsTable, AdminJobsTable } from "../components/AdminJobsBidsTables";
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
  const [error, setError] = useState("");

  async function loadAll() {
    const overview = await apiFetch("/admin/overview", { token });
    setData(overview);
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

    const { stats } = data;

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
                {stats.workers} workers, {stats.customers} customers, {stats.totalJobs} jobs,{" "}
                {stats.totalBids} bids on the platform.
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
              token={token}
              onChange={loadAll}
              hideTitle
            />
          </div>
        );

      case "access":
        return (
          <div className="admin-panel">
            <WorkerAllowancePanel token={token} onChange={loadAll} hideTitle />
          </div>
        );

      case "jobs":
        return (
          <>
            <div className="admin-panel">
              <h2 className="section-title">All Jobs</h2>
              <AdminJobsTable token={token} />
            </div>
            <div className="admin-panel">
              <h2 className="section-title">Recent Bids</h2>
              <AdminBidsTable token={token} />
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
