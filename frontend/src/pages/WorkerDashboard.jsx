import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import CustomerDetailPanel from "../components/CustomerDetailPanel";
import "../components/AppShell.css";
import "./WorkerDashboard.css";

const workerNav = [
  { id: "overview", label: "Dashboard", icon: "▣" },
  { id: "customers", label: "Customers", icon: "◎" },
];

const sectionMeta = {
  overview: {
    title: "Dashboard",
    description: "Summary of your customers and job applications.",
  },
  customers: {
    title: "Customers",
    description: "Select a customer to manage profile and jobs.",
  },
};

export default function WorkerDashboard() {
  const { token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(
    location.state?.section || "overview"
  );
  const [allowedCustomers, setAllowedCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerDetail, setCustomerDetail] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCustomers = useCallback(async () => {
    const result = await apiFetch("/worker/jobs", { token });
    setAllowedCustomers(result.allowedCustomers || []);
    return result.allowedCustomers || [];
  }, [token]);

  const loadCustomerDetail = useCallback(
    async (customerId) => {
      const result = await apiFetch(`/worker/customers/${customerId}`, { token });
      setCustomerDetail(result);
    },
    [token]
  );

  useEffect(() => {
    loadCustomers()
      .then((customers) => {
        const fromNav = location.state?.selectedCustomerId;
        if (fromNav) {
          setSelectedCustomerId(fromNav);
          setActiveSection("customers");
        } else if (customers.length === 1) {
          setSelectedCustomerId(customers[0].id);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadCustomers, location.state]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setCustomerDetail(null);
      return;
    }
    loadCustomerDetail(selectedCustomerId).catch((err) => setError(err.message));
  }, [selectedCustomerId, loadCustomerDetail]);

  async function handleRefresh() {
    await loadCustomers();
    if (selectedCustomerId) {
      await loadCustomerDetail(selectedCustomerId);
    }
  }

  function handleNavigate(section) {
    setActiveSection(section);
    if (section === "overview") {
      navigate("/worker", { replace: true, state: { section } });
    }
  }

  const meta = sectionMeta[activeSection];
  const selectedCustomer = allowedCustomers.find((c) => c.id === selectedCustomerId);
  const totalApplications = allowedCustomers.reduce(
    (sum, c) => sum + (c.applicationCount || 0),
    0
  );

  function renderContent() {
    if (loading) return <div className="loading-screen">Loading...</div>;
    if (error && allowedCustomers.length === 0) {
      return <div className="error-banner">{error}</div>;
    }

    if (activeSection === "overview") {
      return (
        <>
          {error && <div className="error-banner">{error}</div>}
          <div className="app-stats-grid">
            <div className="app-stat-card">
              <div className="stat-label">Customers</div>
              <div className="stat-value">{allowedCustomers.length}</div>
            </div>
            <div className="app-stat-card">
              <div className="stat-label">Applications</div>
              <div className="stat-value">{totalApplications}</div>
            </div>
          </div>
          <div className="app-panel">
            <p className="card-meta">
              You have access to {allowedCustomers.length} customer
              {allowedCustomers.length !== 1 ? "s" : ""} with {totalApplications} registered
              job application{totalApplications !== 1 ? "s" : ""}.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        {error && <div className="error-banner">{error}</div>}
        {allowedCustomers.length === 0 ? (
          <div className="app-panel">
            <p className="card-title">No customer access yet</p>
            <p className="card-meta">Contact your admin to get access to customers.</p>
          </div>
        ) : (
          <>
            <div className="customer-cards">
              {allowedCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  className={`customer-card${
                    selectedCustomerId === customer.id ? " customer-card-selected" : ""
                  }`}
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <span className="customer-card-icon">◆</span>
                  <span className="customer-card-name">{customer.username}</span>
                  <span className="customer-card-stats">
                    {customer.applicationCount} application
                    {customer.applicationCount !== 1 ? "s" : ""}
                  </span>
                </button>
              ))}
            </div>
            {selectedCustomer && customerDetail && (
              <CustomerDetailPanel
                customer={selectedCustomer}
                profile={customerDetail.profile}
                applications={customerDetail.applications}
                token={token}
                onRefresh={handleRefresh}
              />
            )}
          </>
        )}
      </>
    );
  }

  return (
    <AppShell
      role="worker"
      subtitle="Worker Portal"
      navItems={workerNav}
      activeSection={activeSection}
      onNavigate={handleNavigate}
    >
      <header className="app-page-header">
        <h1 className="app-page-title">{meta.title}</h1>
        <p className="app-page-desc">{meta.description}</p>
      </header>
      {renderContent()}
    </AppShell>
  );
}
