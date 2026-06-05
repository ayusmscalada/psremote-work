import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./AppShell.css";

const roleLabels = {
  admin: "Admin",
  worker: "Worker",
  customer: "Customer",
};

const SIDEBAR_STORAGE_KEY = "app_sidebar_collapsed";

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div
      className={`app-shell app-shell--${role}${
        sidebarCollapsed ? " app-shell--sidebar-collapsed" : ""
      }`}
    >
      <aside className="app-sidebar">
        <div className="app-sidebar-brand">
          <span className="app-brand-icon" title="PS Remote Work">
            ◆
          </span>
          <div className="app-brand-text">
            <div className="app-brand-title">PS Remote Work</div>
            <div className="app-brand-sub">{subtitle}</div>
          </div>
          <button
            type="button"
            className="app-sidebar-toggle"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? "»" : "«"}
          </button>
        </div>

        <nav className="app-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`app-nav-item${activeSection === item.id ? " active" : ""}`}
              onClick={() => onNavigate(item.id)}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <span className="app-nav-icon">{item.icon}</span>
              <span className="app-nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="app-sidebar-footer">
          <div className="app-user-block">
            <span className="app-user-name" title={user.username}>
              {user.username}
            </span>
            <span className={`role-badge role-${role}`}>{roleLabels[role]}</span>
          </div>
          <button
            type="button"
            className="app-logout-btn"
            onClick={handleLogout}
            title="Log out"
          >
            <span className="app-logout-icon" aria-hidden>
              ⎋
            </span>
            <span className="app-logout-label">Log out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <button
          type="button"
          className="app-sidebar-mobile-toggle"
          onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
          aria-label={sidebarCollapsed ? "Show navigation" : "Hide navigation"}
        >
          ☰
        </button>
        {children}
      </div>
    </div>
  );
}
