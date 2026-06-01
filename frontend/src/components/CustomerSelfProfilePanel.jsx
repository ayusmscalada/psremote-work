import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import CustomerProfileFields from "./CustomerProfileFields";
import CustomerProfileView from "./CustomerProfileView";
import {
  customerProfileFromUser,
  emptyCustomerProfile,
} from "../constants/customerProfile";

export default function CustomerSelfProfilePanel({
  profile,
  token,
  overview,
  onProfileUpdated,
}) {
  const { updateSession } = useAuth();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(profile?.username || "");
  const [profileFields, setProfileFields] = useState(() =>
    customerProfileFromUser(profile)
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUsername(profile?.username || "");
    setProfileFields(customerProfileFromUser(profile));
  }, [profile]);

  function startEdit() {
    setUsername(profile?.username || "");
    setProfileFields(customerProfileFromUser(profile));
    setCurrentPassword("");
    setNewPassword("");
    setError("");
    setSuccess("");
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setError("");
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    try {
      const body = { username: username.trim(), ...profileFields };
      if (newPassword) {
        body.password = newPassword;
        body.currentPassword = currentPassword;
      }

      const result = await apiFetch("/me", {
        method: "PUT",
        token,
        body: JSON.stringify(body),
      });

      updateSession(result.user, result.token);
      onProfileUpdated(result.user);
      setEditing(false);
      setCurrentPassword("");
      setNewPassword("");
      setSuccess("Profile saved successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const extraRows = [
    { label: "Username", value: profile?.username },
    { label: "Role", value: <span className="role-badge role-customer">Customer</span> },
    { label: "Job applications", value: overview?.applications ?? 0 },
    { label: "Assigned workers", value: overview?.workersWithAccess ?? 0 },
  ];

  if (!editing) {
    return (
      <div className="customer-self-profile">
        <div className="profile-toolbar">
          <p className="card-meta">View and update your account and profile details.</p>
          <button type="button" className="btn-action btn-primary-sm" onClick={startEdit}>
            Edit profile
          </button>
        </div>
        {success && <div className="success-banner">{success}</div>}
        <CustomerProfileView profile={profile} extraRows={extraRows} />
      </div>
    );
  }

  return (
    <div className="customer-self-profile">
      <form className="customer-self-profile-form" onSubmit={handleSave}>
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
            Current password
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Required only when changing password"
              autoComplete="current-password"
            />
          </label>
          <label>
            New password
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Leave blank to keep current"
              autoComplete="new-password"
            />
          </label>
        </div>

        <h4 className="customer-form-section-title">Profile details</h4>
        <CustomerProfileFields values={profileFields} onChange={setProfileFields} />

        <div className="profile-form-actions">
          <button type="button" className="btn-action" onClick={cancelEdit} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
            {submitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
