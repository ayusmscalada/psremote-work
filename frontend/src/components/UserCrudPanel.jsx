import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../api";
import { appendPaginationParams } from "../utils/listQuery";
import { useServerPagination } from "../hooks/useServerPagination";
import { useUrlFilterState } from "../hooks/useUrlFilterState";
import { FilterField, TableFilters } from "./TableFilters";
import TablePagination from "./TablePagination";
import CustomerFormModal from "./CustomerFormModal";

const workerFilterDefaults = { search: "" };
const customerFilterDefaults = { search: "", techStack: "" };

const emptyWorkerForm = { username: "", password: "" };

export default function UserCrudPanel({ title, role, token, onChange, hideTitle }) {
  const isCustomer = role === "customer";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyWorkerForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyWorkerForm);
  const [customerModal, setCustomerModal] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const endpoint = `/admin/${role}s`;
  const filterDefaults = useMemo(
    () => (isCustomer ? customerFilterDefaults : workerFilterDefaults),
    [isCustomer]
  );
  const { filters, setFilter, clearFilters, hasActiveFilters } = useUrlFilterState(filterDefaults);
  const pagination = useServerPagination(undefined, { syncToUrl: true });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      appendPaginationParams(params, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });
      if (filters.search) params.set("search", filters.search);
      if (isCustomer && filters.techStack) params.set("techStack", filters.techStack);

      const result = await apiFetch(`${endpoint}?${params.toString()}`, { token });
      setUsers(result.users || []);
      pagination.applyResponse(result.pagination);
    } catch (err) {
      setError(err.message);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [
    endpoint,
    token,
    filters,
    isCustomer,
    pagination.page,
    pagination.pageSize,
    pagination.applyResponse,
  ]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  async function refresh() {
    await loadUsers();
    if (onChange) await onChange();
  }

  function updateFilter(key, value) {
    setFilter(key, value);
  }

  async function handleCreateWorker(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(endpoint, {
        method: "POST",
        token,
        body: JSON.stringify(form),
      });
      setForm(emptyWorkerForm);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEditWorker(user) {
    setEditingId(user.id);
    setEditForm({ username: user.username, password: "" });
    setError("");
  }

  function cancelEditWorker() {
    setEditingId(null);
    setEditForm(emptyWorkerForm);
    setError("");
  }

  async function handleUpdateWorker(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`${endpoint}/${editingId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(editForm),
      });
      cancelEditWorker();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete ${role} "${user.username}"?`)) return;

    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`${endpoint}/${user.id}`, {
        method: "DELETE",
        token,
      });
      if (editingId === user.id) cancelEditWorker();
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (isCustomer) {
    return (
      <section className="user-crud">
        {!hideTitle && <h2 className="section-title">{title}</h2>}
        {error && <div className="error-banner">{error}</div>}

        <div className="applications-toolbar">
          <p className="card-meta">Manage customer accounts and profile details.</p>
          <button
            type="button"
            className="btn-action btn-primary-sm"
            onClick={() => setCustomerModal({ mode: "create" })}
          >
            Add Customer
          </button>
        </div>

        <TableFilters
          resultCount={pagination.total}
          totalCount={pagination.total}
          hasActiveFilters={hasActiveFilters}
          onClear={clearFilters}
        >
          <FilterField label="Search" className="filter-field--grow">
            <input
              type="search"
              placeholder="Username, email, phone, tech stack…"
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
            />
          </FilterField>
          <FilterField label="Tech stack">
            <input
              type="search"
              placeholder="Filter by tech stack"
              value={filters.techStack}
              onChange={(e) => updateFilter("techStack", e.target.value)}
            />
          </FilterField>
        </TableFilters>

        {loading ? (
          <div className="loading-screen">Loading...</div>
        ) : (
        <div className="data-table-wrap data-table-wrap--scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Tech Stack</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No customers match the current filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email || "—"}</td>
                    <td>{user.phone || "—"}</td>
                    <td className="tech-stack-cell" title={user.techStack || ""}>
                      {user.techStack || "—"}
                    </td>
                    <td className="action-cell">
                      <button
                        type="button"
                        className="btn-action btn-edit"
                        onClick={() => setCustomerModal({ mode: "edit", user })}
                        disabled={submitting}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn-action btn-delete"
                        onClick={() => handleDelete(user)}
                        disabled={submitting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
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

        {customerModal && (
          <CustomerFormModal
            mode={customerModal.mode}
            user={customerModal.user}
            token={token}
            onClose={() => setCustomerModal(null)}
            onSaved={refresh}
          />
        )}
      </section>
    );
  }

  return (
    <section className="user-crud">
      {!hideTitle && <h2 className="section-title">{title}</h2>}
      {error && <div className="error-banner">{error}</div>}

      <form className="user-form" onSubmit={handleCreateWorker}>
        <input
          type="text"
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
          Add {title.slice(0, -1)}
        </button>
      </form>

      <TableFilters
        resultCount={pagination.total}
        totalCount={pagination.total}
        hasActiveFilters={hasActiveFilters}
        onClear={clearFilters}
      >
        <FilterField label="Search" className="filter-field--grow">
          <input
            type="search"
            placeholder="Filter by username"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
          />
        </FilterField>
      </TableFilters>

      {loading ? (
        <div className="loading-screen">Loading...</div>
      ) : (
      <div className="data-table-wrap data-table-wrap--scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  No {title.toLowerCase()} match the current filters.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  {editingId === user.id ? (
                    <>
                      <td>
                        <input
                          type="text"
                          value={editForm.username}
                          onChange={(e) =>
                            setEditForm({ ...editForm, username: e.target.value })
                          }
                          required
                        />
                      </td>
                      <td>
                        <input
                          type="password"
                          placeholder="New password (optional)"
                          value={editForm.password}
                          onChange={(e) =>
                            setEditForm({ ...editForm, password: e.target.value })
                          }
                        />
                      </td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="btn-action btn-save"
                          onClick={handleUpdateWorker}
                          disabled={submitting}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-cancel"
                          onClick={cancelEditWorker}
                          disabled={submitting}
                        >
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{user.username}</td>
                      <td className="password-mask">••••••••</td>
                      <td className="action-cell">
                        <button
                          type="button"
                          className="btn-action btn-edit"
                          onClick={() => startEditWorker(user)}
                          disabled={submitting}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(user)}
                          disabled={submitting}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))
            )}
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
    </section>
  );
}
