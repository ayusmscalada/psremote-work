import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { hasActiveFilters } from "../utils/tableUtils";
import { appendPaginationParams } from "../utils/listQuery";
import { useServerPagination } from "../hooks/useServerPagination";
import { FilterField, TableFilters } from "./TableFilters";
import TablePagination from "./TablePagination";

const jobDefaults = { search: "", status: "all", customerId: "" };
const bidDefaults = { search: "", status: "all", jobId: "" };

export function AdminJobsTable({ token }) {
  const [filters, setFilters] = useState(jobDefaults);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const pagination = useServerPagination();

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      appendPaginationParams(params, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.customerId) params.set("customerId", filters.customerId);

      const result = await apiFetch(`/admin/platform-jobs?${params.toString()}`, { token });
      setJobs(result.jobs || []);
      pagination.applyResponse(result.pagination);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters, pagination.page, pagination.pageSize, pagination.applyResponse]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.resetPage();
  }

  return (
    <>
      <TableFilters
        resultCount={pagination.total}
        totalCount={pagination.total}
        hasActiveFilters={hasActiveFilters(filters, jobDefaults)}
        onClear={() => {
          setFilters(jobDefaults);
          pagination.resetPage();
        }}
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
            <option value="open">open</option>
            <option value="in_progress">in progress</option>
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

      {loading ? (
        <p className="card-meta">Loading jobs...</p>
      ) : jobs.length === 0 ? (
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
              {jobs.map((job) => (
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

export function AdminBidsTable({ token }) {
  const [filters, setFilters] = useState(bidDefaults);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const pagination = useServerPagination();

  const loadBids = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      appendPaginationParams(params, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (filters.search) params.set("search", filters.search);
      if (filters.status !== "all") params.set("status", filters.status);
      if (filters.jobId) params.set("jobId", filters.jobId);

      const result = await apiFetch(`/admin/platform-bids?${params.toString()}`, { token });
      setBids(result.bids || []);
      pagination.applyResponse(result.pagination);
    } catch {
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters, pagination.page, pagination.pageSize, pagination.applyResponse]);

  useEffect(() => {
    loadBids();
  }, [loadBids]);

  function setFilter(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    pagination.resetPage();
  }

  return (
    <>
      <TableFilters
        resultCount={pagination.total}
        totalCount={pagination.total}
        hasActiveFilters={hasActiveFilters(filters, bidDefaults)}
        onClear={() => {
          setFilters(bidDefaults);
          pagination.resetPage();
        }}
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
            <option value="pending">pending</option>
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

      {loading ? (
        <p className="card-meta">Loading bids...</p>
      ) : bids.length === 0 ? (
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
              {bids.map((bid) => (
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
