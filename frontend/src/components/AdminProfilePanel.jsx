import { useEffect, useState } from "react";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";

export default function AdminProfilePanel({ token }) {
  const { user, updateSession } = useAuth();
  const [username, setUsername] = useState(user?.username || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
  }, [user?.username]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword && !currentPassword) {
      setError("Enter your current password to change it");
      return;
    }

    setSubmitting(true);
    try {
      const body = { username: username.trim() };
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
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Profile updated successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="admin-profile-panel">
      <form className="admin-profile-form" onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        {success && <div className="success-banner">{success}</div>}

        <div className="profile-field">
          <label htmlFor="admin-username">Username</label>
          <input
            id="admin-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="profile-field">
          <label htmlFor="admin-current-password">Current password</label>
          <input
            id="admin-current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Required only when changing password"
            autoComplete="current-password"
          />
        </div>

        <div className="profile-field">
          <label htmlFor="admin-new-password">New password</label>
          <input
            id="admin-new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
            autoComplete="new-password"
          />
        </div>

        <div className="profile-field">
          <label htmlFor="admin-confirm-password">Confirm new password</label>
          <input
            id="admin-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat new password"
            autoComplete="new-password"
          />
        </div>

        <button type="submit" className="btn-action btn-primary-sm" disabled={submitting}>
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}
