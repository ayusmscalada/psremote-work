import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import JobSpreadsheet from "./JobSpreadsheet";
import JobModal from "./JobModal";
import ScreenshotModal from "./ScreenshotModal";

export default function CustomerDetailPanel({
  customer,
  profile,
  applications,
  token,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [modalMode, setModalMode] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [screenshotApplication, setScreenshotApplication] = useState(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  function openCreateModal() {
    setEditingApplication(null);
    setModalMode("form");
    setActionError("");
  }

  function openEditModal(application) {
    setEditingApplication(application);
    setModalMode("form");
    setActionError("");
  }

  function openScreenshotModal(application) {
    setScreenshotApplication(application);
    setModalMode("screenshot");
    setActionError("");
  }

  function closeModal() {
    setModalMode(null);
    setEditingApplication(null);
    setScreenshotApplication(null);
  }

  function openJobDetail(app) {
    navigate(`/worker/customers/${customer.id}/jobs/${app.id}`, {
      state: { customerUsername: customer.username },
    });
  }

  async function handleDelete(application) {
    if (!window.confirm(`Delete job "${application.jobTitle}"?`)) return;

    setActionError("");
    setDeletingId(application.id);
    try {
      await apiFetch(`/worker/applications/${application.id}`, {
        method: "DELETE",
        token,
      });
      await onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="customer-detail">
      <div className="customer-detail-header">
        <h2 className="section-title">{customer.username}</h2>
      </div>

      <div className="tabs">
        <button
          type="button"
          className={`tab${activeTab === "profile" ? " tab-active" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile Detail
        </button>
        <button
          type="button"
          className={`tab${activeTab === "jobs" ? " tab-active" : ""}`}
          onClick={() => setActiveTab("jobs")}
        >
          Jobs
        </button>
      </div>

      {activeTab === "profile" && profile && (
        <div className="card profile-card">
          <div className="profile-row">
            <span className="profile-label">Username</span>
            <span>{profile.username}</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Role</span>
            <span className="role-badge role-customer">Customer</span>
          </div>
          <div className="profile-row">
            <span className="profile-label">Job applications</span>
            <span>{profile.applicationCount}</span>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div className="applications-panel">
          {actionError && <div className="error-banner">{actionError}</div>}

          <div className="applications-toolbar applications-toolbar--sheet">
            <p className="card-meta">Click a row to open details. Use action buttons in the last column.</p>
            <button type="button" className="btn-action btn-primary-sm" onClick={openCreateModal}>
              Add New Job
            </button>
          </div>

          <JobSpreadsheet
            applications={applications}
            onRowClick={openJobDetail}
            onEdit={openEditModal}
            onScreenshot={openScreenshotModal}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        </div>
      )}

      {modalMode === "form" && (
        <JobModal
          customerId={customer.id}
          customerName={customer.username}
          application={editingApplication}
          token={token}
          onClose={closeModal}
          onSaved={onRefresh}
        />
      )}

      {modalMode === "screenshot" && screenshotApplication && (
        <ScreenshotModal
          application={screenshotApplication}
          token={token}
          onClose={closeModal}
          onSaved={onRefresh}
        />
      )}
    </section>
  );
}
