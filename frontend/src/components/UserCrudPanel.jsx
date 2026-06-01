import { useState } from "react";
import { apiFetch } from "../api";
import CustomerFormModal from "./CustomerFormModal";

const emptyWorkerForm = { username: "", password: "" };

export default function UserCrudPanel({ title, role, users, token, onChange, hideTitle }) {
  const isCustomer = role === "customer";

  const [form, setForm] = useState(emptyWorkerForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyWorkerForm);
  const [customerModal, setCustomerModal] = useState(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const endpoint = `/admin/${role}s`;

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
    </section>
  );
}
