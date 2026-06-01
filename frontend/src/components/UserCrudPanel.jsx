import { useState } from "react";
import { apiFetch } from "../api";

const emptyForm = { username: "", password: "" };

export default function UserCrudPanel({ title, role, users, token, onChange, hideTitle }) {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const endpoint = `/admin/${role}s`;

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(endpoint, {
        method: "POST",
        token,
        body: JSON.stringify(form),
      });
      setForm(emptyForm);
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function startEdit(user) {
    setEditingId(user.id);
    setEditForm({ username: user.username, password: "" });
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditForm(emptyForm);
    setError("");
  }

  async function handleUpdate(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiFetch(`${endpoint}/${editingId}`, {
        method: "PUT",
        token,
        body: JSON.stringify(editForm),
      });
      cancelEdit();
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
      if (editingId === user.id) cancelEdit();
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="user-crud">
      {!hideTitle && <h2 className="section-title">{title}</h2>}
      {error && <div className="error-banner">{error}</div>}

      <form className="user-form" onSubmit={handleCreate}>
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
                          onClick={handleUpdate}
                          disabled={submitting}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn-action btn-cancel"
                          onClick={cancelEdit}
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
                          onClick={() => startEdit(user)}
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
