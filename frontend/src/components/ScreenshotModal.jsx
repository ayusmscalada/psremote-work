import { useEffect, useState } from "react";
import { apiFetch } from "../api";

export default function ScreenshotModal({ application, token, onClose, onSaved }) {
  const [screenshotLink, setScreenshotLink] = useState(application.screenshotLink || "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setScreenshotLink(application.screenshotLink || "");
  }, [application]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiFetch(`/worker/applications/${application.id}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ screenshotLink }),
      });
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
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Screenshot</h3>
          <p className="modal-subtitle">{application.jobTitle}</p>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <label>
            Screenshot link
            <input
              type="url"
              value={screenshotLink}
              onChange={(e) => setScreenshotLink(e.target.value)}
              placeholder="https://..."
              required
            />
          </label>
          <p className="field-hint">Paste a public URL to the screenshot image.</p>

          <div className="modal-actions">
            <button type="button" className="btn-action" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Screenshot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
