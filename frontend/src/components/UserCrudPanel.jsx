import { useMemo, useState } from "react";
import { apiFetch } from "../api";
import {
  hasActiveFilters,
  matchesAnyText,
  matchesText,
} from "../utils/tableUtils";
import { usePagination } from "../hooks/usePagination";
import { FilterField, TableFilters } from "./TableFilters";
import TablePagination from "./TablePagination";
import CustomerFormModal from "./CustomerFormModal";

const workerFilterDefaults = { search: "" };
const customerFilterDefaults = { search: "", techStack: "" };

const emptyWorkerForm = { username: "", password: "" };

export default function UserCrudPanel({ title, role, users, token, onChange, hideTitle }) {
  const isCustomer = role === "customer";

  const [form, setForm] = useState(emptyWorkerForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyWorkerForm);
  const [customerModal, setCustomerModal] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [workerFilters, setWorkerFilters] = useState(workerFilterDefaults);
  const [customerFilters, setCustomerFilters] = useState(customerFilterDefaults);

  const endpoint = `/admin/${role}s`;

  const filteredWorkers = useMemo(() => {
    return users.filter((user) => matchesText(user.username, workerFilters.search));
  }, [users, workerFilters.search]);

  const filteredCustomers = useMemo(() => {
    return users.filter((user) => {
      if (
        !matchesAnyText(
          [user.username, user.email, user.phone, user.techStack],
          customerFilters.search
        )
      ) {
        return false;
      }
      if (
        customerFilters.techStack.trim() &&
        !matchesText(user.techStack, customerFilters.techStack)
      ) {
        return false;
      }
      return true;
    });
  }, [users, customerFilters]);

  const workerPagination = usePagination(filteredWorkers, { resetKey: workerFilters });
  const customerPagination = usePagination(filteredCustomers, { resetKey: customerFilters });

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
      await onChange();
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
      await onChange();
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
      await onChange();
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
          resultCount={filteredCustomers.length}
          totalCount={users.length}
          hasActiveFilters={hasActiveFilters(customerFilters, customerFilterDefaults)}
          onClear={() => setCustomerFilters(customerFilterDefaults)}
        >
          <FilterField label="Search" className="filter-field--grow">
            <input
              type="search"
              placeholder="Username, email, phone, tech stack…"
              value={customerFilters.search}
              onChange={(e) =>
                setCustomerFilters((f) => ({ ...f, search: e.target.value }))
              }
            />
          </FilterField>
          <FilterField label="Tech stack">
            <input
              type="search"
              placeholder="Filter by tech stack"
              value={customerFilters.techStack}
              onChange={(e) =>
                setCustomerFilters((f) => ({ ...f, techStack: e.target.value }))
              }
            />
          </FilterField>
        </TableFilters>

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
                    No customers yet.
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    No customers match the current filters.
                  </td>
                </tr>
              ) : (
                customerPagination.paginatedItems.map((user) => (
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

        {filteredCustomers.length > 0 && (
          <TablePagination
            page={customerPagination.page}
            totalPages={customerPagination.totalPages}
            totalItems={customerPagination.totalItems}
            rangeStart={customerPagination.rangeStart}
            rangeEnd={customerPagination.rangeEnd}
            pageSize={customerPagination.pageSize}
            onPageChange={customerPagination.setPage}
            onPageSizeChange={customerPagination.setPageSize}
            hasPrev={customerPagination.hasPrev}
            hasNext={customerPagination.hasNext}
          />
        )}

        {customerModal && (
          <CustomerFormModal
            mode={customerModal.mode}
            user={customerModal.user}
            token={token}
            onClose={() => setCustomerModal(null)}
            onSaved={onChange}
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
        resultCount={filteredWorkers.length}
        totalCount={users.length}
        hasActiveFilters={hasActiveFilters(workerFilters, workerFilterDefaults)}
        onClear={() => setWorkerFilters(workerFilterDefaults)}
      >
        <FilterField label="Search" className="filter-field--grow">
          <input
            type="search"
            placeholder="Filter by username"
            value={workerFilters.search}
            onChange={(e) => setWorkerFilters({ search: e.target.value })}
          />
        </FilterField>
      </TableFilters>

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
                  No {title.toLowerCase()} yet.
                </td>
              </tr>
            ) : filteredWorkers.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-cell">
                  No {title.toLowerCase()} match the current filters.
                </td>
              </tr>
            ) : (
              workerPagination.paginatedItems.map((user) => (
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

      {filteredWorkers.length > 0 && (
        <TablePagination
          page={workerPagination.page}
          totalPages={workerPagination.totalPages}
          totalItems={workerPagination.totalItems}
          rangeStart={workerPagination.rangeStart}
          rangeEnd={workerPagination.rangeEnd}
          pageSize={workerPagination.pageSize}
          onPageChange={workerPagination.setPage}
          onPageSizeChange={workerPagination.setPageSize}
          hasPrev={workerPagination.hasPrev}
          hasNext={workerPagination.hasNext}
        />
      )}
    </section>
  );
}
