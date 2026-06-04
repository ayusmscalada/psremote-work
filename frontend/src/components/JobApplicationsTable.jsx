import { bidStatusLabel } from "../constants";
import { useJobApplicationFilters } from "../hooks/useJobApplicationFilters";
import { usePagination } from "../hooks/usePagination";
import { formatDateTime } from "../utils/tableUtils";
import JobApplicationFilters from "./JobApplicationFilters";
import TablePagination from "./TablePagination";

export default function JobApplicationsTable({
  applications,
  onRowClick,
  showWorker = false,
}) {
  const {
    filtered,
    filters,
    setFilter,
    clearFilters,
    hasActiveFilters,
    workerOptions,
  } = useJobApplicationFilters(applications, { includeWorker: showWorker });
  const pagination = usePagination(filtered, { resetKey: filters });

  if (applications.length === 0) {
    return <div className="list-empty">No job applications yet.</div>;
  }

  return (
    <>
      <JobApplicationFilters
        filters={filters}
        setFilter={setFilter}
        clearFilters={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultCount={filtered.length}
        totalCount={applications.length}
        workerOptions={workerOptions}
      />

      {filtered.length === 0 ? (
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
              {pagination.paginatedItems.map((app) => (
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

      {filtered.length > 0 && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
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
