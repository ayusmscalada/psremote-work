import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { bidStatusLabel } from "../constants";
import { formatDateTime } from "../utils/tableUtils";
import AppShell from "../components/AppShell";
import JobModal from "../components/JobModal";
import JobDescriptionSection from "../components/JobDescriptionSection";
import "../components/AppShell.css";
import "./WorkerJobDetailPage.css";
import "./WorkerDashboard.css";

const workerNav = [
  { id: "overview", label: "Dashboard", icon: "▣" },
  { id: "jobs", label: "Jobs", icon: "☰" },
  { id: "customers", label: "Customers", icon: "◎" },
];

export default function WorkerJobDetailPage() {
  const { customerId, jobId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const customerUsername =
    location.state?.customerUsername || `Customer #${customerId}`;
  const backSection = location.state?.section || "customers";

  async function loadJob() {
    const result = await apiFetch(`/worker/applications/${jobId}`, { token });
    setApplication(result.application);
  }

  useEffect(() => {
    loadJob()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [jobId, token]);

  async function handleDelete() {
    if (!window.confirm(`Delete job "${application.jobTitle}"?`)) return;

    setDeleting(true);
    setError("");
    try {
      await apiFetch(`/worker/applications/${jobId}`, {
        method: "DELETE",
        token,
      });
      navigate("/worker", {
        state: { selectedCustomerId: Number(customerId), section: "customers" },
      });
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  }

  function handleNav(section) {
    navigate("/worker", { state: { section } });
  }

  const content = (() => {
    if (loading) return <div className="loading-screen">Loading job...</div>;
    if (error && !application) return <div className="error-banner">{error}</div>;
    if (!application) return <div className="error-banner">Job not found</div>;

    return (
      <>
        <Link
          to="/worker"
          state={{
            selectedCustomerId: Number(customerId),
            section: backSection,
          }}
          className="back-link"
        >
          ← Back to {backSection === "jobs" ? "Jobs" : customerUsername}
        </Link>

        <div className="job-detail-header">
          <div>
            <h1 className="app-page-title">{application.jobTitle}</h1>
            <p className="app-page-desc">{application.companyName}</p>
          </div>
          <div className="job-detail-actions">
            <button
              type="button"
              className="btn-action btn-edit"
              onClick={() => setShowEditModal(true)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn-action btn-delete"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {error && <div className="error-banner">{error}</div>}

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

        {showEditModal && (
          <JobModal
            customerId={Number(customerId)}
            customerName={customerUsername}
            application={application}
            token={token}
            onClose={() => setShowEditModal(false)}
            onSaved={async () => {
              await loadJob();
              setShowEditModal(false);
            }}
          />
        )}
      </>
    );
  })();

  return (
    <AppShell
      role="worker"
      subtitle="Worker Portal"
      navItems={workerNav}
      activeSection={backSection}
      onNavigate={handleNav}
    >
      {content}
    </AppShell>
  );
}
