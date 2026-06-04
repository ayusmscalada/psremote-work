import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api";
import { hasActiveFilters } from "../utils/tableUtils";
import { appendPaginationParams } from "../utils/listQuery";
import { useServerPagination } from "../hooks/useServerPagination";
import { FilterField, TableFilters } from "./TableFilters";
import TablePagination from "./TablePagination";

const allowanceDefaults = { workerSearch: "", customerSearch: "" };

export default function WorkerAllowancePanel({ token, onChange, hideTitle }) {
  const [customers, setCustomers] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [filters, setFilters] = useState(allowanceDefaults);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const pagination = useServerPagination();

  const visibleCustomers = customers.filter((c) =>
    !filters.customerSearch ||
    c.username.toLowerCase().includes(filters.customerSearch.trim().toLowerCase())
  );

  const loadCustomers = useCallback(async () => {
    const params = new URLSearchParams();
    appendPaginationParams(params, { page: 1, pageSize: 100 });
    const result = await apiFetch(`/admin/customers?${params.toString()}`, { token });
    setCustomers(result.users || []);
  }, [token]);

  const loadWorkers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      appendPaginationParams(params, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (filters.workerSearch) params.set("search", filters.workerSearch);

      const result = await apiFetch(`/admin/workers?${params.toString()}`, { token });
      const list = result.users || [];
      setWorkers(list);
      pagination.applyResponse(result.pagination);

      const next = {};
      for (const worker of list) {
        next[worker.id] = [...(worker.allowedCustomerIds || [])];
      }
      setDrafts(next);
    } catch (err) {
      setError(err.message);
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, [token, filters.workerSearch, pagination.page, pagination.pageSize, pagination.applyResponse]);

  useEffect(() => {
    loadCustomers().then(() => loadWorkers());
  }, [loadCustomers, loadWorkers]);

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }));
    if (key === "workerSearch") pagination.resetPage();
  }

  function toggleCustomer(workerId, customerId) {
    setDrafts((prev) => {
      const current = prev[workerId] || [];
      const exists = current.includes(customerId);
      return {
        ...prev,
        [workerId]: exists
          ? current.filter((id) => id !== customerId)
          : [...current, customerId],
      };
    });
  }

  function hasChanges(worker) {
    const draft = drafts[worker.id] || [];
    const original = worker.allowedCustomerIds || [];
    if (draft.length !== original.length) return true;
    return draft.some((id) => !original.includes(id));
  }

  async function saveAllowances(worker) {
    setError("");
    setSavingId(worker.id);
    try {
      await apiFetch(`/admin/workers/${worker.id}/allowances`, {
        method: "PUT",
        token,
        body: JSON.stringify({ customerIds: drafts[worker.id] || [] }),
      });
      if (onChange) await onChange();
      await loadWorkers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (!loading && workers.length === 0 && !filters.workerSearch) {
    return null;
  }

  return (
    <section className="allowance-panel">
      {!hideTitle && <h2 className="section-title">Worker Customer Access</h2>}
      <p className="allowance-help">
        Choose which customers each worker can access. Workers only see jobs from allowed
        customers.
      </p>
      {error && <div className="error-banner">{error}</div>}

      {customers.length === 0 ? (
        <p className="card-meta">Add customers before setting worker access.</p>
      ) : (
        <>
          <TableFilters
            resultCount={pagination.total}
            totalCount={pagination.total}
            hasActiveFilters={hasActiveFilters(filters, allowanceDefaults)}
            onClear={() => setFilters(allowanceDefaults)}
          >
            <FilterField label="Worker" className="filter-field--grow">
              <input
                type="search"
                placeholder="Filter workers by name"
                value={filters.workerSearch}
                onChange={(e) => updateFilter("workerSearch", e.target.value)}
              />
            </FilterField>
            <FilterField label="Customer columns" className="filter-field--grow">
              <input
                type="search"
                placeholder="Show customers matching name"
                value={filters.customerSearch}
                onChange={(e) => updateFilter("customerSearch", e.target.value)}
              />
            </FilterField>
          </TableFilters>

          {loading ? (
            <p className="card-meta">Loading workers...</p>
          ) : workers.length === 0 || visibleCustomers.length === 0 ? (
            <p className="card-meta">No rows match the current filters.</p>
          ) : (
            <div className="data-table-wrap data-table-wrap--scroll">
              <table className="data-table allowance-table">
                <thead>
                  <tr>
                    <th>Worker</th>
                    {visibleCustomers.map((customer) => (
                      <th key={customer.id}>{customer.username}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map((worker) => (
                    <tr key={worker.id}>
                      <td className="worker-name">{worker.username}</td>
                      {visibleCustomers.map((customer) => (
                        <td key={customer.id} className="checkbox-cell">
                          <input
                            type="checkbox"
                            checked={(drafts[worker.id] || []).includes(customer.id)}
                            onChange={() => toggleCustomer(worker.id, customer.id)}
                            aria-label={`${worker.username} access to ${customer.username}`}
                          />
                        </td>
                      ))}
                      <td className="action-cell">
                        <button
                          type="button"
                          className="btn-action btn-primary-sm"
                          onClick={() => saveAllowances(worker)}
                          disabled={savingId === worker.id || !hasChanges(worker)}
                        >
                          {savingId === worker.id ? "Saving..." : "Save"}
                        </button>
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
      )}
    </section>
  );
}
