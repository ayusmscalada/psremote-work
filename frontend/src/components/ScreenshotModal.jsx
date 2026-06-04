import { useState } from "react";
import { apiUpload } from "../api";

export default function ScreenshotModal({ application, token, onClose, onSaved }) {
  const [screenshotFile, setScreenshotFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(application.screenshotUrl || null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    setScreenshotFile(file || null);
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(file ? URL.createObjectURL(file) : application.screenshotUrl || null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!screenshotFile) {
      setError("Please select a screenshot image to upload");
      return;
    }

    setError("");
    setSubmitting(true);

    const formData = new FormData();
    formData.append("screenshot", screenshotFile);

    try {
      await apiUpload(`/worker/applications/${application.id}/screenshot`, {
        method: "PUT",
        token,
        formData,
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

          {application.screenshotUrl && !screenshotFile && (
            <p className="field-hint">Current screenshot will be replaced when you upload a new file.</p>
          )}

          <label>
            Screenshot image
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required={!application.screenshotUrl}
            />
          </label>
          <p className="field-hint">Image is uploaded to AWS S3 (max 5 MB).</p>

          {previewUrl && (
            <div className="screenshot-upload-preview">
              <img src={previewUrl} alt="Screenshot preview" />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-action" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
              {submitting ? "Uploading..." : "Upload Screenshot"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
