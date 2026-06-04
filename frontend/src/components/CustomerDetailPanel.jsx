import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useJobApplicationFilterState } from "../hooks/useJobApplicationFilterState";
import { useServerPagination } from "../hooks/useServerPagination";
import { buildApplicationsQuery } from "../utils/listQuery";
import JobSpreadsheet from "./JobSpreadsheet";
import JobModal from "./JobModal";
import ScreenshotModal from "./ScreenshotModal";
import CustomerProfileView from "./CustomerProfileView";

export default function CustomerDetailPanel({
  customer,
  profile,
  allowedCustomers = [],
  token,
  onRefresh,
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [applications, setApplications] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [modalMode, setModalMode] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [screenshotApplication, setScreenshotApplication] = useState(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [assigningCustomerId, setAssigningCustomerId] = useState(null);

  const { filters, setFilter, clearFilters, hasActiveFilters } = useJobApplicationFilterState();
  const pagination = useServerPagination();

  const loadApplications = useCallback(async () => {
    setJobsLoading(true);
    setActionError("");
    try {
      const query = buildApplicationsQuery({
        page: pagination.page,
        pageSize: pagination.pageSize,
        filters,
      });
      const result = await apiFetch(`/worker/customers/${customer.id}${query}`, { token });
      setApplications(result.applications || []);
      pagination.applyResponse(result.pagination);
    } catch (err) {
      setActionError(err.message);
      setApplications([]);
    } finally {
      setJobsLoading(false);
    }
  }, [
    customer.id,
    token,
    filters,
    pagination.page,
    pagination.pageSize,
    pagination.applyResponse,
  ]);

  useEffect(() => {
    if (activeTab === "jobs") {
      loadApplications();
    }
  }, [activeTab, loadApplications]);

  function handleSetFilter(key, value) {
    setFilter(key, value);
    pagination.resetPage();
  }

  function handleClearFilters() {
    clearFilters();
    pagination.resetPage();
  }

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

  async function handleSaved() {
    await loadApplications();
    await onRefresh();
    closeModal();
  }

  function openJobDetail(app) {
    navigate(`/worker/customers/${customer.id}/jobs/${app.id}`, {
      state: { customerUsername: customer.username },
    });
  }

  async function handleCustomerChange(application, newCustomerId) {
    if (newCustomerId === application.customerId) return;

    setActionError("");
    setAssigningCustomerId(application.id);
    try {
      await apiFetch(`/worker/applications/${application.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ customerId: newCustomerId }),
      });
      await handleSaved();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setAssigningCustomerId(null);
    }
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
      await handleSaved();
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
        <div className="card profile-card customer-profile-card">
          <CustomerProfileView
            profile={profile}
            extraRows={[
              { label: "Username", value: profile.username },
              { label: "Role", value: <span className="role-badge role-customer">Customer</span> },
              { label: "Job applications", value: profile.applicationCount },
            ]}
          />
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
            customerAssign={allowedCustomers.length > 1}
            allowedCustomers={allowedCustomers}
            onCustomerChange={handleCustomerChange}
            assigningCustomerId={assigningCustomerId}
            filters={filters}
            setFilter={handleSetFilter}
            clearFilters={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
            resultCount={pagination.total}
            totalCount={pagination.total}
            pagination={pagination}
            onPageChange={pagination.setPage}
            onPageSizeChange={pagination.setPageSize}
            loading={jobsLoading}
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
          onSaved={handleSaved}
        />
      )}

      {modalMode === "screenshot" && screenshotApplication && (
        <ScreenshotModal
          application={screenshotApplication}
          token={token}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}
    </section>
  );
}
