import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function WorkerAllowancePanel({
  workers,
  customers,
  token,
  onChange,
  hideTitle,
}) {
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const next = {};
    for (const worker of workers) {
      next[worker.id] = [...(worker.allowedCustomerIds || [])];
    }
    setDrafts(next);
  }, [workers]);

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
      await onChange();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  if (workers.length === 0) {
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
        <div className="data-table-wrap data-table-wrap--scroll">
          <table className="data-table allowance-table">
            <thead>
              <tr>
                <th>Worker</th>
                {customers.map((customer) => (
                  <th key={customer.id}>{customer.username}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.id}>
                  <td className="worker-name">{worker.username}</td>
                  {customers.map((customer) => (
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
    </section>
  );
}
