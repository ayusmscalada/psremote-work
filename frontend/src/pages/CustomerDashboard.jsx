import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import JobList from "../components/JobList";
import CustomerSelfProfilePanel from "../components/CustomerSelfProfilePanel";
import "../components/AppShell.css";
import "./CustomerDashboard.css";

const customerNav = [
  { id: "overview", label: "Dashboard", icon: "▣" },
  { id: "applications", label: "Job Applications", icon: "☰" },
  { id: "profile", label: "Profile", icon: "◎" },
];

const sectionMeta = {
  overview: {
    title: "Dashboard",
    description: "Overview of worker applications and platform activity.",
  },
  applications: {
    title: "Job Applications",
    description: "Jobs registered by workers on your behalf. Click a row for details.",
  },
  profile: {
    title: "Profile",
    description: "View and update your account and profile information.",
  },
};

export default function CustomerDashboard() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(
    location.state?.section || "overview"
  );
  const [overview, setOverview] = useState(null);
  const [applications, setApplications] = useState([]);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    const [overviewData, appsData, meData] = await Promise.all([
      apiFetch("/customer/overview", { token }),
      apiFetch("/customer/applications", { token }),
      apiFetch("/me", { token }),
    ]);
    setOverview(overviewData.stats);
    setApplications(appsData.applications);
    setProfile(meData.user);
  }

  useEffect(() => {
    if (location.state?.section) {
      setActiveSection(location.state.section);
    }
  }, [location.state?.section]);

  useEffect(() => {
    loadAll()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  function handleNavigate(section) {
    setActiveSection(section);
    navigate("/customer", { replace: true, state: { section } });
  }

  const meta = sectionMeta[activeSection];

  function renderContent() {
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (error) return <div className="error-banner">{error}</div>;

    switch (activeSection) {
      case "overview":
        return (
          <>
            <div className="app-stats-grid">
              <div className="app-stat-card">
                <div className="stat-label">Applications</div>
                <div className="stat-value">{overview.applications}</div>
              </div>
              <div className="app-stat-card">
                <div className="stat-label">Workers</div>
                <div className="stat-value">{overview.workersWithAccess}</div>
              </div>
              <div className="app-stat-card">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{overview.completedApplications}</div>
              </div>
              <div className="app-stat-card">
                <div className="stat-label">Platform Bids</div>
                <div className="stat-value">{overview.bids}</div>
              </div>
            </div>
            <div className="app-panel">
              <p className="card-meta">
                {overview.workersWithAccess} worker
                {overview.workersWithAccess !== 1 ? "s have" : " has"} access to your account.
                {" "}{overview.applications} job application
                {overview.applications !== 1 ? "s" : ""} submitted so far.
              </p>
            </div>
          </>
        );

      case "applications":
        return (
          <div className="app-panel">
            {applications.length === 0 ? (
              <div className="list-empty">No job applications yet.</div>
            ) : (
              <JobList
                applications={applications}
                variant="customer"
                onRowClick={(app) => navigate(`/customer/applications/${app.id}`)}
              />
            )}
          </div>
        );

      case "profile":
        return (
          <div className="app-panel profile-card customer-profile-card">
            <CustomerSelfProfilePanel
              profile={profile}
              token={token}
              overview={overview}
              onProfileUpdated={setProfile}
            />
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <AppShell
      role="customer"
      subtitle="Customer Portal"
      navItems={customerNav}
      activeSection={activeSection}
      onNavigate={handleNavigate}
    >
      <header className="app-page-header">
        <h1 className="app-page-title">{meta.title}</h1>
        <p className="app-page-desc">{meta.description}</p>
      </header>
      {renderContent()}
    </AppShell>
  );
}
