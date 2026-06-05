import { useState } from "react";
import { apiFetch } from "../api";

const emptyForm = {
  jobLink: "",
  jobTitle: "",
  jobDescription: "",
  companyName: "",
};

export default function AutoMatchJobModal({ token, onClose, onSaved }) {
  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    setResult(null);

    try {
      const response = await apiFetch("/worker/applications/auto-match", {
        method: "POST",
        token,
        body: JSON.stringify({ ...form, bidStatus: "not_yet" }),
      });
      setResult(response);
      if (response.created?.length > 0) {
        await onSaved();
      }
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
          <h3>Upload &amp; Auto-match Job</h3>
          <p className="modal-subtitle">
            OpenAI checks fit against your allowed customer profiles. Matching jobs are
            created automatically (one per customer).
          </p>
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
              placeholder="Paste the full job description for best matching..."
              rows={5}
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

          {result && (
            <div className="auto-match-result">
              <p className="card-meta">{result.message}</p>
              {result.created?.length > 0 && (
                <ul className="auto-match-list">
                  {result.created.map((item) => (
                    <li key={item.application.id}>
                      <strong>{item.customerUsername}</strong> (score {item.matchScore}) —{" "}
                      {item.matchRationale}
                    </li>
                  ))}
                </ul>
              )}
              {result.skipped?.length > 0 && (
                <>
                  <p className="card-meta">Skipped:</p>
                  <ul className="auto-match-list auto-match-list--muted">
                    {result.skipped.map((item) => (
                      <li key={`skip-${item.customerId}`}>
                        {item.customerUsername}: {item.reason}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {result.matches?.length === 0 && (
                <p className="card-meta">No profiles met the minimum fit score.</p>
              )}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-action" onClick={onClose} disabled={submitting}>
              {result?.created?.length > 0 ? "Close" : "Cancel"}
            </button>
            <button
              type="submit"
              className="btn-action btn-primary-sm"
              disabled={submitting || result?.created?.length > 0}
            >
              {submitting ? "Matching..." : "Match & Allocate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
