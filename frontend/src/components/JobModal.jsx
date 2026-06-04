import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { BID_STATUSES } from "../constants";

const emptyForm = {
  jobLink: "",
  jobTitle: "",
  jobDescription: "",
  companyName: "",
  bidStatus: "not_yet",
};

function toForm(application) {
  if (!application) return { ...emptyForm };
  return {
    jobLink: application.jobLink,
    jobTitle: application.jobTitle,
    jobDescription: application.jobDescription,
    companyName: application.companyName,
    bidStatus: application.bidStatus || "not_yet",
  };
}

export default function JobModal({
  customerId,
  customerName,
  application,
  token,
  onClose,
  onSaved,
}) {
  const isEdit = Boolean(application);
  const [form, setForm] = useState(() => toForm(application));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setForm(toForm(application));
  }, [application]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const payload = {
      jobLink: form.jobLink,
      jobTitle: form.jobTitle,
      jobDescription: form.jobDescription,
      companyName: form.companyName,
      bidStatus: form.bidStatus,
    };

    try {
      if (isEdit) {
        await apiFetch(`/worker/applications/${application.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(payload),
        });
      } else {
        if (form.bidStatus === "completed") {
          throw new Error(
            "Set bid status to Completed after uploading a screenshot via Add Screenshot"
          );
        }

        await apiFetch(`/worker/customers/${customerId}/applications`, {
          method: "POST",
          token,
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Job" : "Add New Job"}</h3>
          <p className="modal-subtitle">For customer: {customerName}</p>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <label>
            Job link
            <input
              type="url"
              value={form.jobLink}
              onChange={(e) => updateField("jobLink", e.target.value)}
              placeholder="https://..."
              required
            />
            <span className="field-hint">
              The same job cannot be added twice for this customer. Query parameters (?…) are
              ignored when comparing links.
            </span>
          </label>

          <label>
            Job title
            <input
              type="text"
              value={form.jobTitle}
              onChange={(e) => updateField("jobTitle", e.target.value)}
              placeholder="e.g. Software Engineer"
              required
            />
          </label>

          <label>
            Job description
            <textarea
              value={form.jobDescription}
              onChange={(e) => updateField("jobDescription", e.target.value)}
              placeholder="Describe the role..."
              rows={4}
              required
            />
          </label>

          <label>
            Company name
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </label>

          <label>
            Bid status
            <select
              value={form.bidStatus}
              onChange={(e) => updateField("bidStatus", e.target.value)}
            >
              {BID_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

          {form.bidStatus === "completed" && !application?.screenshotLink && (
            <p className="field-hint">
              Use Add Screenshot in the jobs table to upload a screenshot before setting
              status to Completed.
            </p>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-action" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
