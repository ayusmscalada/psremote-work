import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import { useJobApplicationFilterState } from "../hooks/useJobApplicationFilterState";
import { useServerPagination } from "../hooks/useServerPagination";
import { buildApplicationsQuery } from "../utils/listQuery";
import { setQueryParam, updateSearchParams } from "../utils/urlQuery";
import JobSpreadsheet from "./JobSpreadsheet";
import AutoMatchJobModal from "./AutoMatchJobModal";
import JobModal from "./JobModal";
import ScreenshotModal from "./ScreenshotModal";

const ALL_CUSTOMERS = "all";

export default function WorkerJobsPanel({
  allowedCustomers,
  canAutoMatchUpload = false,
  token,
  onRefreshCounts,
}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const customerFilter = searchParams.get("customerId") || ALL_CUSTOMERS;
  const [applications, setApplications] = useState([]);
  const [workerOptions, setWorkerOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);
  const [screenshotApplication, setScreenshotApplication] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [assigningCustomerId, setAssigningCustomerId] = useState(null);
  const [claimingId, setClaimingId] = useState(null);

  const { filters, setFilter, clearFilters, hasActiveFilters } = useJobApplicationFilterState({
    includeWorker: true,
    syncToUrl: true,
  });
  const pagination = useServerPagination(undefined, { syncToUrl: true });

  const selectedCustomer =
    customerFilter === ALL_CUSTOMERS
      ? null
      : allowedCustomers.find((c) => String(c.id) === customerFilter);

  const loadApplications = useCallback(async () => {
    if (allowedCustomers.length === 0) {
      setApplications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setActionError("");
    try {
      const query = buildApplicationsQuery({
        page: pagination.page,
        pageSize: pagination.pageSize,
        customerId: customerFilter === ALL_CUSTOMERS ? undefined : customerFilter,
        filters,
      });
      const result = await apiFetch(`/worker/applications${query}`, { token });
      setApplications(result.applications || []);
      pagination.applyResponse(result.pagination);
      if (result.filterOptions?.workers) {
        setWorkerOptions(result.filterOptions.workers);
      }
    } catch (err) {
      setActionError(err.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    customerFilter,
    filters,
    pagination.page,
    pagination.pageSize,
    allowedCustomers.length,
    pagination.applyResponse,
  ]);

  function handleSetFilter(key, value) {
    setFilter(key, value);
  }

  function handleClearFilters() {
    clearFilters();
  }

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  function closeModal() {
    setModalMode(null);
    setEditingApplication(null);
    setScreenshotApplication(null);
  }

  async function handleSaved() {
    await loadApplications();
    if (onRefreshCounts) {
      await onRefreshCounts();
    }
    closeModal();
  }

  function openJobDetail(app) {
    const params = new URLSearchParams(searchParams);
    params.set("section", "jobs");
    navigate(
      `/worker/customers/${app.customerId}/jobs/${app.id}?${params.toString()}`,
      { state: { customerUsername: app.customerUsername, section: "jobs" } }
    );
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

  async function handleClaimBid(application) {
    if (
      !window.confirm(
        `Take bid for "${application.jobTitle}"? You will become the assignee and can edit it.`
      )
    ) {
      return;
    }

    setActionError("");
    setClaimingId(application.id);
    try {
      await apiFetch(`/worker/applications/${application.id}/claim-bid`, {
        method: "POST",
        token,
      });
      await handleSaved();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setClaimingId(null);
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

  if (allowedCustomers.length === 0) {
    return (
      <div className="app-panel">
        <p className="card-title">No customer access yet</p>
        <p className="card-meta">Contact your admin to get access before registering jobs.</p>
      </div>
    );
  }

  return (
    <div className="applications-panel worker-jobs-panel">
      {actionError && <div className="error-banner">{actionError}</div>}

      <div className="applications-toolbar applications-toolbar--sheet">
        <label className="worker-jobs-customer-select">
          <span className="filter-label">Customer</span>
          <select
            value={customerFilter}
            onChange={(e) => {
              const value = e.target.value;
              updateSearchParams(setSearchParams, (params) => {
                setQueryParam(
                  params,
                  "customerId",
                  value === ALL_CUSTOMERS ? null : value,
                  ""
                );
                params.delete("page");
              });
            }}
          >
            <option value={ALL_CUSTOMERS}>All customers</option>
            {allowedCustomers.map((customer) => (
              <option key={customer.id} value={String(customer.id)}>
                {customer.username}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn-action btn-primary-sm"
          disabled={!selectedCustomer}
          title={!selectedCustomer ? "Select a customer to add a job" : undefined}
          onClick={() => {
            setEditingApplication(null);
            setModalMode("form");
          }}
        >
          Add New Job
        </button>
        {canAutoMatchUpload && (
          <button
            type="button"
            className="btn-action btn-primary-sm"
            onClick={() => setModalMode("auto-match")}
          >
            Upload &amp; Auto-match
          </button>
        )}
      </div>

      <p className="card-meta worker-jobs-hint">
        {canAutoMatchUpload && (
          <>
            Use <strong>Upload &amp; Auto-match</strong> to let OpenAI match a job to allowed
            customer profiles and create jobs automatically.{" "}
          </>
        )}
        All jobs for your customers are listed here, including those registered by other workers.
        Use <strong>Take Bid</strong> to claim someone else&apos;s job. Use{" "}
        <strong>Customer (assign)</strong> to move your own jobs to another customer.{" "}
        {customerFilter === ALL_CUSTOMERS
          ? "Filter above limits which jobs are listed."
          : `Showing jobs for ${selectedCustomer?.username}.`}
      </p>

      <JobSpreadsheet
        applications={applications}
        showRegisteredBy
        currentWorkerId={user?.id}
        customerAssign
        allowedCustomers={allowedCustomers}
        onCustomerChange={handleCustomerChange}
        assigningCustomerId={assigningCustomerId}
        filters={filters}
        setFilter={handleSetFilter}
        clearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={pagination.total}
        totalCount={pagination.total}
        workerOptions={workerOptions}
        pagination={pagination}
        onPageChange={pagination.setPage}
        onPageSizeChange={pagination.setPageSize}
        loading={loading}
        onRowClick={openJobDetail}
        onEdit={(app) => {
          setEditingApplication(app);
          setModalMode("form");
        }}
        onScreenshot={(app) => {
          setScreenshotApplication(app);
          setModalMode("screenshot");
        }}
        onDelete={handleDelete}
        onClaimBid={handleClaimBid}
        claimingId={claimingId}
        deletingId={deletingId}
      />

      {modalMode === "auto-match" && (
        <AutoMatchJobModal
          token={token}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {modalMode === "form" && selectedCustomer && (
        <JobModal
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.username}
          application={editingApplication}
          token={token}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {modalMode === "form" && editingApplication && !selectedCustomer && (
        <JobModal
          customerId={editingApplication.customerId}
          customerName={editingApplication.customerUsername}
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
    </div>
  );
}
