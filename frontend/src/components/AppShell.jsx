import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppShell.css";

const roleLabels = {
  admin: "Admin",
  worker: "Worker",
  customer: "Customer",
};

export default function AppShell({
  role,
  subtitle,
  navItems,
  activeSection,
  onNavigate,
  children,
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className={`app-shell app-shell--${role}`}>
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <span className="app-brand-icon">◆</span>
          <div>
            <div className="app-brand-title">PS Remote Work</div>
            <div className="app-brand-sub">{subtitle}</div>
          </div>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`app-nav-item${activeSection === item.id ? " active" : ""}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="app-nav-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user-block">
            <span className="app-user-name">{user.username}</span>
            <span className={`role-badge role-${role}`}>{roleLabels[role]}</span>
          </div>
          <button type="button" className="app-logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>

      <div className="app-main">{children}</div>
    </div>
  );
}
