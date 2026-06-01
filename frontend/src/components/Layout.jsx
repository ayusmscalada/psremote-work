import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

const roleLabels = {
  admin: "Admin",
  customer: "Customer",
  worker: "Worker",
};

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="layout-brand">
          <span className="brand-icon">◆</span>
          <span>PS Remote Work</span>
        </div>
        <div className="layout-user">
          <span className={`role-badge role-${user.role}`}>
            {roleLabels[user.role]}
          </span>
          <span className="user-name">{user.username}</span>
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <main className="layout-main">{children}</main>
    </div>
  );
}
