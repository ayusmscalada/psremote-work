import { useMemo, useState } from "react";
import { usePagination } from "../hooks/usePagination";
import {
  hasActiveFilters,
  matchesAnyText,
  matchesSelect,
} from "../utils/tableUtils";
import { FilterField, TableFilters } from "./TableFilters";
import TablePagination from "./TablePagination";

const jobDefaults = { search: "", status: "all", customerId: "" };
const bidDefaults = { search: "", status: "all", jobId: "" };

export function AdminJobsTable({ jobs }) {
  const [filters, setFilters] = useState(jobDefaults);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (
        !matchesAnyText(
          [job.title, job.description, String(job.customerId), String(job.budget)],
          filters.search
        )
      ) {
        return false;
      }
      if (!matchesSelect(job.status, filters.status)) return false;
      if (filters.customerId.trim()) {
        if (String(job.customerId) !== filters.customerId.trim()) return false;
      }
      return true;
    });
  }, [jobs, filters]);

  const pagination = usePagination(filtered, { resetKey: filters });

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (jobs.length === 0) {
    return <p className="card-meta">No jobs.</p>;
  }

  const statusOptions = [...new Set(jobs.map((j) => j.status))].sort();

  return (
    <>
      <TableFilters
        resultCount={filtered.length}
        totalCount={jobs.length}
        hasActiveFilters={hasActiveFilters(filters, jobDefaults)}
        onClear={() => setFilters(jobDefaults)}
      >
        <FilterField label="Search" className="filter-field--grow">
          <input
            type="search"
            placeholder="Title, description, customer ID…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="all">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Customer ID">
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 10"
            value={filters.customerId}
            onChange={(e) => setFilter("customerId", e.target.value)}
          />
        </FilterField>
      </TableFilters>

      {filtered.length === 0 ? (
        <p className="card-meta">No jobs match the current filters.</p>
      ) : (
        <div className="data-table-wrap data-table-wrap--scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Customer</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((job) => (
                <tr key={job.id}>
                  <td>#{job.id}</td>
                  <td>
                    <div className="table-cell-title">{job.title}</div>
                    <div className="table-cell-desc">{job.description}</div>
                  </td>
                  <td>#{job.customerId}</td>
                  <td>${job.budget?.toLocaleString() ?? "—"}</td>
                  <td>
                    <span className={`status status-${job.status}`}>
                      {job.status.replace("_", " ")}
                    </span>
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

export function AdminBidsTable({ bids }) {
  const [filters, setFilters] = useState(bidDefaults);

  const filtered = useMemo(() => {
    return bids.filter((bid) => {
      if (
        !matchesAnyText(
          [bid.message, String(bid.jobId), String(bid.amount), bid.status],
          filters.search
        )
      ) {
        return false;
      }
      if (!matchesSelect(bid.status, filters.status)) return false;
      if (filters.jobId.trim() && String(bid.jobId) !== filters.jobId.trim()) {
        return false;
      }
      return true;
    });
  }, [bids, filters]);

  const pagination = usePagination(filtered, { resetKey: filters });

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  if (bids.length === 0) {
    return <p className="card-meta">No bids.</p>;
  }

  const statusOptions = [...new Set(bids.map((b) => b.status))].sort();

  return (
    <>
      <TableFilters
        resultCount={filtered.length}
        totalCount={bids.length}
        hasActiveFilters={hasActiveFilters(filters, bidDefaults)}
        onClear={() => setFilters(bidDefaults)}
      >
        <FilterField label="Search" className="filter-field--grow">
          <input
            type="search"
            placeholder="Message, amount, status…"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
          />
        </FilterField>
        <FilterField label="Status">
          <select value={filters.status} onChange={(e) => setFilter("status", e.target.value)}>
            <option value="all">All</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Job ID">
          <input
            type="text"
            inputMode="numeric"
            placeholder="e.g. 5"
            value={filters.jobId}
            onChange={(e) => setFilter("jobId", e.target.value)}
          />
        </FilterField>
      </TableFilters>

      {filtered.length === 0 ? (
        <p className="card-meta">No bids match the current filters.</p>
      ) : (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {pagination.paginatedItems.map((bid) => (
                <tr key={bid.id}>
                  <td>#{bid.jobId}</td>
                  <td>${bid.amount.toLocaleString()}</td>
                  <td>
                    <span className={`status status-${bid.status}`}>{bid.status}</span>
                  </td>
                  <td>{bid.message || "—"}</td>
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
