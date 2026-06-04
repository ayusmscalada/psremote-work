import { bidStatusLabel } from "../constants";
import { useJobApplicationFilters } from "../hooks/useJobApplicationFilters";
import { usePagination } from "../hooks/usePagination";
import { formatDateTime } from "../utils/tableUtils";
import JobApplicationFilters from "./JobApplicationFilters";
import TablePagination from "./TablePagination";

export default function JobSpreadsheet({
  applications,
  onRowClick,
  onEdit,
  onScreenshot,
  onDelete,
  deletingId,
}) {
  const { filtered, filters, setFilter, clearFilters, hasActiveFilters } =
    useJobApplicationFilters(applications);
  const pagination = usePagination(filtered, { resetKey: filters });

  if (applications.length === 0) {
    return <div className="spreadsheet-empty">No jobs yet. Click Add New Job to create a row.</div>;
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
      />

      {filtered.length === 0 ? (
        <div className="spreadsheet-empty">No jobs match the current filters.</div>
      ) : (
        <div className="spreadsheet-wrap">
          <table className="spreadsheet">
            <thead>
              <tr>
                <th className="sheet-corner" aria-label="Row index" />
                <th className="col-registered">Registered</th>
                <th className="col-title">Title</th>
                <th className="col-company">Company</th>
                <th className="col-link">Job Link</th>
                <th className="col-status">Bid Status</th>
                <th className="col-screenshot">Screenshot</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((app, index) => {
                const isDeleting = deletingId === app.id;
                const rowNum = (pagination.page - 1) * pagination.pageSize + index + 1;

                return (
                  <tr
                    key={app.id}
                    className={isDeleting ? "sheet-row-active" : undefined}
                    onClick={() => onRowClick(app)}
                  >
                    <td className="row-num">{rowNum}</td>
                    <td className="cell-registered">{formatDateTime(app.createdAt)}</td>
                    <td className="cell-text" title={app.jobTitle}>
                      {app.jobTitle}
                    </td>
                    <td className="cell-text" title={app.companyName}>
                      {app.companyName}
                    </td>
                    <td className="cell-link">
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
                      <span className={`sheet-status sheet-status-${app.bidStatus}`}>
                        {bidStatusLabel(app.bidStatus)}
                      </span>
                    </td>
                    <td className={app.screenshotLink ? "sheet-yes" : "sheet-no"}>
                      {app.screenshotLink ? "Yes" : "—"}
                    </td>
                    <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="sheet-btn"
                        onClick={() => onEdit(app)}
                        disabled={isDeleting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="sheet-btn sheet-btn-primary"
                        onClick={() => onScreenshot(app)}
                        disabled={isDeleting}
                      >
                        Add Screenshot
                      </button>
                      <button
                        type="button"
                        className="sheet-btn sheet-btn-danger"
                        onClick={() => onDelete(app)}
                        disabled={isDeleting}
                      >
                        {isDeleting ? "..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                );
              })}
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
