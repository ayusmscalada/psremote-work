import { useState } from "react";
import { apiFetch } from "../api";
import CustomerProfileFields from "./CustomerProfileFields";
import {
  customerProfileFromUser,
  emptyCustomerProfile,
} from "../constants/customerProfile";

export default function CustomerFormModal({
  mode,
  user,
  token,
  onClose,
  onSaved,
}) {
  const isEdit = mode === "edit";
  const [username, setUsername] = useState(user?.username || "");
  const [password, setPassword] = useState("");
  const [profile, setProfile] = useState(() =>
    isEdit ? customerProfileFromUser(user) : emptyCustomerProfile()
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const body = { username: username.trim(), ...profile };
    if (password) body.password = password;

    try {
      if (isEdit) {
        await apiFetch(`/admin/customers/${user.id}`, {
          method: "PUT",
          token,
          body: JSON.stringify(body),
        });
      } else {
        if (!password) {
          throw new Error("Password is required for new customers");
        }
        body.password = password;
        await apiFetch("/admin/customers", {
          method: "POST",
          token,
          body: JSON.stringify(body),
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
      <div className="modal modal-customer" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? "Edit Customer" : "Add Customer"}</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form className="modal-form customer-modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner">{error}</div>}

          <div className="customer-account-fields">
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEdit ? "Leave blank to keep current" : ""}
                required={!isEdit}
              />
            </label>
          </div>

          <h4 className="customer-form-section-title">Profile details</h4>
          <CustomerProfileFields values={profile} onChange={setProfile} />

          <div className="modal-actions">
            <button type="button" className="btn-action" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
              {submitting ? "Saving..." : isEdit ? "Save changes" : "Add customer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
