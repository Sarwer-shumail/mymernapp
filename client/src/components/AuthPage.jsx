import { useState } from "react";
import { useAuth } from "../context/useAuth.js";

export function AuthPage() {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        await register(formData.username, formData.email, formData.password);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFormData({ username: "", email: "", password: "", confirmPassword: "" });
  };

  const fillDemo = (type) => {
    if (type === "admin") {
      setFormData({
        username: "admin",
        email: "admin@pos.com",
        password: "password123",
        confirmPassword: "password123",
      });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-slide-up">
        <div className="auth-header">
          <div className="auth-logo">S</div>
          <h1>SmartStore POS</h1>
          <p className="auth-subtitle">
            {isLogin ? "Welcome back! Please sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="username">Username</label>
              <input
                className="form-input"
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required={!isLogin}
                autoComplete="username"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              className="form-input"
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              className="form-input"
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
              <input
                className="form-input"
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "8px" }} disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </span>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" className="auth-toggle" onClick={toggleMode}>
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>

        <div className="auth-demo">
          <p className="demo-label">Quick Demo Access</p>
          <div className="demo-credentials">
            <code onClick={() => fillDemo("admin")} title="Click to fill">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "8px", verticalAlign: "middle" }}>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
              admin@pos.com / password123
            </code>
          </div>
        </div>
      </div>

      <div className="auth-illustration">
        <div className="illustration-shapes">
          <div className="shape shape-1" aria-hidden="true" />
          <div className="shape shape-2" aria-hidden="true" />
          <div className="shape shape-3" aria-hidden="true" />
        </div>
        <div className="illustration-content">
          <h2>Retail Management<br /><span>Made Simple</span></h2>
          <p>Manage products, track inventory, process sales, and analyze your business performance — all in one beautiful dashboard.</p>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div className="feature-content">
                <h4>Real-time Inventory</h4>
                <p>Track stock levels instantly with low-stock alerts</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="9" cy="21" r="1"></circle>
                  <circle cx="20" cy="21" r="1"></circle>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                </svg>
              </div>
              <div className="feature-content">
                <h4>Fast POS Checkout</h4>
                <p>Process sales in seconds with intuitive interface</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"></line>
                  <line x1="12" y1="20" x2="12" y2="4"></line>
                  <line x1="6" y1="20" x2="6" y2="14"></line>
                </svg>
              </div>
              <div className="feature-content">
                <h4>Sales Analytics</h4>
                <p>Visualize trends and make data-driven decisions</p>
              </div>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <div className="feature-content">
                <h4>Customer Management</h4>
                <p>Build relationships with customer profiles & history</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
