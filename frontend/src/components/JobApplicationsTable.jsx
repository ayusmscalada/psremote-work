import { useCallback, useEffect, useState } from "react";
import { bidStatusLabel } from "../constants";
import { apiFetch } from "../api";
import { useJobApplicationFilterState } from "../hooks/useJobApplicationFilterState";
import { useServerPagination } from "../hooks/useServerPagination";
import { buildApplicationsQuery } from "../utils/listQuery";
import { formatDateTime } from "../utils/tableUtils";
import JobApplicationFilters from "./JobApplicationFilters";
import TablePagination from "./TablePagination";

export default function JobApplicationsTable({
  token,
  showWorker = false,
  onRowClick,
}) {
  const [applications, setApplications] = useState([]);
  const [workerOptions, setWorkerOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { filters, setFilter, clearFilters, hasActiveFilters } = useJobApplicationFilterState({
    includeWorker: showWorker,
  });
  const pagination = useServerPagination();

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const query = buildApplicationsQuery({
        page: pagination.page,
        pageSize: pagination.pageSize,
        filters,
      });
      const result = await apiFetch(`/customer/applications${query}`, { token });
      setApplications(result.applications || []);
      pagination.applyResponse(result.pagination);
      if (result.filterOptions?.workers) {
        setWorkerOptions(result.filterOptions.workers);
      }
    } catch (err) {
      setError(err.message);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters, pagination.page, pagination.pageSize, pagination.applyResponse]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  function handleSetFilter(key, value) {
    setFilter(key, value);
    pagination.resetPage();
  }

  function handleClearFilters() {
    clearFilters();
    pagination.resetPage();
  }

  if (!loading && applications.length === 0 && !hasActiveFilters) {
    return <div className="list-empty">No job applications yet.</div>;
  }

  return (
    <>
      {error && <div className="error-banner">{error}</div>}

      <JobApplicationFilters
        filters={filters}
        setFilter={handleSetFilter}
        clearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={pagination.total}
        totalCount={pagination.total}
        workerOptions={workerOptions}
      />

      {loading ? (
        <div className="loading-screen">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="list-empty">No jobs match the current filters.</div>
      ) : (
        <div className="data-table-wrap data-table-wrap--scroll">
          <table className="data-table job-applications-table">
            <thead>
              <tr>
                <th>Registered</th>
                <th>Title</th>
                <th>Company</th>
                {showWorker && <th>Worker</th>}
                <th>Job link</th>
                <th>Bid status</th>
                <th>Screenshot</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr
                  key={app.id}
                  className={onRowClick ? "data-table-row--clickable" : undefined}
                  onClick={onRowClick ? () => onRowClick(app) : undefined}
                >
                  <td className="cell-registered">{formatDateTime(app.createdAt)}</td>
                  <td title={app.jobTitle}>{app.jobTitle}</td>
                  <td title={app.companyName}>{app.companyName}</td>
                  {showWorker && <td>{app.workerUsername || "—"}</td>}
                  <td>
                    <a
                      href={app.jobLink}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open link
                    </a>
                  </td>
                  <td>
                    <span className={`status status-${app.bidStatus}`}>
                      {bidStatusLabel(app.bidStatus)}
                    </span>
                  </td>
                  <td className={app.screenshotLink ? "sheet-yes" : "sheet-no"}>
                    {app.screenshotLink ? "Yes" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && pagination.total > 0 && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          pageSize={pagination.pageSize}
          onPageChange={pagination.setPage}
          onPageSizeChange={pagination.setPageSize}
          hasPrev={pagination.hasPrev}
          hasNext={pagination.hasNext}
        />
      )}
    </>
  );
}
