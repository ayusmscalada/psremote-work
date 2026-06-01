import { useState } from "react";
import { Navigate } from "react-router-dom";
import { loginRequest } from "../api";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

const demoAccounts = [
  { role: "Admin", username: "admin", password: "admin123" },
  { role: "Customer", username: "customer", password: "customer123" },
  { role: "Worker", username: "worker", password: "worker123" },
];

export default function LoginPage() {
  const { user, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const { token, user: loggedInUser } = await loginRequest(username, password);
      login(loggedInUser, token);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo(account) {
    setUsername(account.username);
    setPassword(account.password);
    setError("");
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <span className="login-logo">◆</span>
          <h1>PS Remote Work</h1>
          <p>Sign in to your dashboard</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <label>
            Username
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </label>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="demo-accounts">
          <p className="demo-title">Demo accounts (no registration)</p>
          <div className="demo-list">
            {demoAccounts.map((account) => (
              <button
                key={account.username}
                type="button"
                className="demo-btn"
                onClick={() => fillDemo(account)}
              >
                <span className="demo-role">{account.role}</span>
                <span className="demo-creds">{account.username}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
