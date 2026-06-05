import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { bidStatusLabel } from "../constants";
import { formatDateTime } from "../utils/tableUtils";
import AppShell from "../components/AppShell";
import JobDescriptionSection from "../components/JobDescriptionSection";
import "../components/AppShell.css";
import "./WorkerJobDetailPage.css";

const customerNav = [
  { id: "overview", label: "Dashboard", icon: "▣" },
  { id: "applications", label: "Job Applications", icon: "☰" },
  { id: "profile", label: "Profile", icon: "◎" },
];

export default function CustomerApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/customer/applications/${id}`, { token })
      .then((result) => setApplication(result.application))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  function handleNav(section) {
    navigate("/customer", { state: { section } });
  }

  const content = (() => {
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (error) return <div className="error-banner">{error}</div>;
    if (!application) return <div className="error-banner">Application not found</div>;

    return (
      <>
        <Link to="/customer" state={{ section: "applications" }} className="back-link">
          ← Back to applications
        </Link>

        <div className="job-detail-header">
          <div>
            <h1 className="app-page-title">{application.jobTitle}</h1>
            <p className="app-page-desc">
              {application.companyName} · Registered by: {application.workerUsername}
            </p>
          </div>
        </div>

        <div className="card job-detail-card">
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Job link</span>
              <a href={application.jobLink} target="_blank" rel="noreferrer">
                {application.jobLink}
              </a>
            </div>
            <div className="detail-item">
              <span className="detail-label">Company</span>
              <span>{application.companyName}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Registered by</span>
              <span>{application.registeredByUsername || application.workerUsername}</span>
            </div>
            {application.assigneeUsername && (
              <div className="detail-item">
                <span className="detail-label">Assigned to</span>
                <span>{application.assigneeUsername}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="detail-label">Bid status</span>
              <span className={`status status-${application.bidStatus}`}>
                {bidStatusLabel(application.bidStatus)}
              </span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Registered</span>
              <span>{formatDateTime(application.createdAt)}</span>
            </div>
          </div>

          <JobDescriptionSection description={application.jobDescription} />

          <section className="detail-screenshot-section">
            <span className="detail-section-label">Screenshot</span>
            {application.screenshotLink ? (
              <a
                href={application.screenshotLink}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={application.screenshotLink}
                  alt="Bid screenshot"
                  className="screenshot-detail"
                />
              </a>
            ) : (
              <span className="detail-empty">Not provided</span>
            )}
          </section>
        </div>
      </>
    );
  })();

  return (
    <AppShell
      role="customer"
      subtitle="Customer Portal"
      navItems={customerNav}
      activeSection="applications"
      onNavigate={handleNav}
    >
      {content}
    </AppShell>
  );
}
