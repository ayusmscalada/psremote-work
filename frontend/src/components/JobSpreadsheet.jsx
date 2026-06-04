import { bidStatusLabel } from "../constants";
import { formatDateTime } from "../utils/tableUtils";
import JobApplicationFilters from "./JobApplicationFilters";
import TablePagination from "./TablePagination";

export default function JobSpreadsheet({
  applications,
  showCustomer = false,
  customerAssign = false,
  allowedCustomers = [],
  onCustomerChange,
  assigningCustomerId = null,
  filters,
  setFilter,
  clearFilters,
  hasActiveFilters,
  resultCount,
  totalCount,
  workerOptions = [],
  pagination,
  onPageChange,
  onPageSizeChange,
  loading = false,
  onRowClick,
  onEdit,
  onScreenshot,
  onDelete,
  deletingId,
}) {
  const showAssignColumn =
    customerAssign && allowedCustomers.length > 0 && typeof onCustomerChange === "function";

  const showFilters = filters && setFilter && clearFilters;

  if (!loading && applications.length === 0 && !showFilters) {
    return <div className="spreadsheet-empty">No jobs yet. Click Add New Job to create a row.</div>;
  }

  return (
    <>
      {showFilters && (
        <JobApplicationFilters
          filters={filters}
          setFilter={setFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          resultCount={resultCount ?? 0}
          totalCount={totalCount ?? 0}
          workerOptions={workerOptions}
        />
      )}

      {loading ? (
        <div className="loading-screen">Loading jobs...</div>
      ) : applications.length === 0 ? (
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
                {showAssignColumn && (
                  <th className="col-customer-assign">Customer (assign)</th>
                )}
                {showCustomer && !showAssignColumn && (
                  <th className="col-customer">Customer</th>
                )}
                <th className="col-link">Job Link</th>
                <th className="col-status">Bid Status</th>
                <th className="col-screenshot">Screenshot</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app, index) => {
                const isDeleting = deletingId === app.id;
                const isAssigning = assigningCustomerId === app.id;
                const rowNum =
                  (pagination.page - 1) * pagination.pageSize + index + 1;

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
                    {showAssignColumn && (
                      <td
                        className="cell-customer-assign"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          className="sheet-customer-select"
                          value={String(app.customerId)}
                          disabled={isDeleting || isAssigning}
                          aria-label={`Assign customer for ${app.jobTitle}`}
                          onChange={(e) =>
                            onCustomerChange(app, Number(e.target.value))
                          }
                        >
                          {allowedCustomers.map((customer) => (
                            <option key={customer.id} value={String(customer.id)}>
                              {customer.username}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                    {showCustomer && !showAssignColumn && (
                      <td className="cell-text" title={app.customerUsername}>
                        {app.customerUsername || "—"}
                      </td>
                    )}
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
                        disabled={isDeleting || isAssigning}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="sheet-btn sheet-btn-primary"
                        onClick={() => onScreenshot(app)}
                        disabled={isDeleting || isAssigning}
                      >
                        Add Screenshot
                      </button>
                      <button
                        type="button"
                        className="sheet-btn sheet-btn-danger"
                        onClick={() => onDelete(app)}
                        disabled={isDeleting || isAssigning}
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

      {!loading && pagination && pagination.total > 0 && (
        <TablePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          rangeStart={pagination.rangeStart}
          rangeEnd={pagination.rangeEnd}
          pageSize={pagination.pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          hasPrev={pagination.hasPrev}
          hasNext={pagination.hasNext}
        />
      )}
    </>
  );
}
