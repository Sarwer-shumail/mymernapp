import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "./context/useAuth.js";
import { AuthPage } from "./components/AuthPage.jsx";
import "./App.css";

const API_BASE = `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`}/api`;

const starterProducts = [
  { id: 1, name: "Fresh Milk 1L", sku: "DRK-001", category: "Dairy", price: 220, stock: 24 },
  { id: 2, name: "White Bread", sku: "BAK-001", category: "Bakery", price: 120, stock: 4 },
  { id: 3, name: "Basmati Rice 1kg", sku: "GRC-001", category: "Grocery", price: 350, stock: 32 },
  { id: 4, name: "Cooking Oil 1L", sku: "GRC-002", category: "Grocery", price: 590, stock: 18 },
  { id: 5, name: "Chocolate Bar", sku: "SNK-001", category: "Snacks", price: 150, stock: 3 },
  { id: 6, name: "Mineral Water", sku: "DRK-002", category: "Beverages", price: 80, stock: 45 },
];

const initialCustomers = [
  { id: 1, name: "Walk-in Customer", phone: "—", orders: 12 },
  { id: 2, name: "Ali Ahmed", phone: "0300-1234567", orders: 8 },
  { id: 3, name: "Sara Khan", phone: "0312-7654321", orders: 5 },
];

const initialSuppliers = [
  { id: 1, name: "City Wholesale", category: "Grocery", phone: "0300-1112233" },
  { id: 2, name: "Fresh Foods Supply", category: "Dairy", phone: "0311-2223344" },
];

const initialSales = [
  { id: "S-1004", customer: "Ali Ahmed", date: "Today, 10:42 AM", total: 2450, status: "Completed" },
  { id: "S-1003", customer: "Walk-in Customer", date: "Today, 09:18 AM", total: 870, status: "Completed" },
  { id: "S-1002", customer: "Sara Khan", date: "Yesterday", total: 3200, status: "Completed" },
];

const menu = [
  { title: "OVERVIEW", items: [["Dashboard", "📊"], ["Analytics", "📈"]] },
  { title: "MANAGEMENT", items: [["POS Terminal", "🛒"], ["Products", "📦"], ["Categories", "🏷️"], ["Inventory", "📋"], ["Purchases", "🧺"], ["Sales & Orders", "🧾"], ["Expenses", "💳"], ["Customers", "👥"], ["Suppliers", "🚚"]] },
  { title: "SYSTEM", items: [["Notifications", "🔔"], ["Reports", "📑"], ["Settings", "⚙️"]] },
];

function money(value) {
  const currency = localStorage.getItem("storeCurrency") || "PKR";
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function parseSaleDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  const relativeDay = String(value).toLowerCase().startsWith("yesterday") ? 1 : String(value).toLowerCase().startsWith("today") ? 0 : null;
  if (relativeDay === null) return null;
  const date = new Date();
  date.setDate(date.getDate() - relativeDay);
  const time = String(value).match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (time) {
    let hours = Number(time[1]) % 12;
    if (time[3].toUpperCase() === "PM") hours += 12;
    date.setHours(hours, Number(time[2]), 0, 0);
  }
  return date;
}

// Toast Context
import { createContext, useContext } from "react";

const ToastContext = createContext(null);

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", title) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, title }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, toasts }}>
      {children}
      <div className="toast-container" role="region" aria-live="polite">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type} animate-slide-in-right`} role="alert">
            <div className="toast-icon">
              {toast.type === "success" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>}
              {toast.type === "warning" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}
              {toast.type === "danger" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>}
              {toast.type === "info" && <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
            </div>
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button className="toast-close" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))} aria-label="Dismiss">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}

// StatCard Component
function StatCard({ label, value, detail, icon, tone }) {
  const toneColors = {
    green: "success",
    blue: "primary",
    purple: "purple",
    orange: "orange"
  };

  return (
    <div className={`stat-card tone-${tone} animate-slide-up delay-${["1","2","3","4"].indexOf(tone) > -1 ? toneColors[tone] === "success" ? 1 : toneColors[tone] === "primary" ? 2 : toneColors[tone] === "purple" ? 3 : 4 : 1}`}>
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      <small className="stat-detail">{detail}</small>
    </div>
  );
}

// ProductTable Component
function ProductTable({ products, onEdit, onDelete, onRestock, canManage = true, loading }) {
  if (products.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-state-icon">📦</div>
        <h3 className="empty-state-title">No products found</h3>
        <p className="empty-state-text">Get started by adding your first product to the catalogue.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap animate-fade-in">
      <table>
        <thead>
          <tr>
            <th style={{ width: '30%' }}>PRODUCT</th>
            <th style={{ width: '12%' }}>SKU</th>
            <th style={{ width: '12%' }}>CATEGORY</th>
            <th style={{ width: '10%' }}>PRICE</th>
            <th style={{ width: '8%' }}>STOCK</th>
            <th style={{ width: '12%' }}>STATUS</th>
            <th style={{ width: '16%' }}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} style={{ animationDelay: `${products.indexOf(p) * 30}ms` }} className="animate-slide-in-right">
              <td>
                <div className="product-cell">
                  <div className="avatar avatar-sm avatar-primary">{p.name.slice(0, 1).toUpperCase()}</div>
                  <strong>{p.name}</strong>
                </div>
              </td>
              <td>{p.sku || `SKU-${p.id}`}</td>
              <td><span className="badge badge-info">{p.category}</span></td>
              <td><strong>{money(p.price)}</strong></td>
              <td>{p.stock}</td>
              <td>
                <span className={`badge ${p.stock <= 5 ? "badge-danger" : p.stock <= 10 ? "badge-warning" : "badge-success"}`}>
                  {p.stock === 0 ? "Out of Stock" : p.stock <= 5 ? "Low Stock" : p.stock <= 10 ? "Limited" : "In Stock"}
                </span>
              </td>
              <td className="actions-cell">
                {canManage && onRestock && p.stock <= 10 && <button className="btn btn-secondary btn-sm restock-action" title={`Add stock to ${p.name}`} onClick={() => onRestock(p)} disabled={loading}>＋ Add stock</button>}
                {canManage && <button className="icon-btn" title="Edit" onClick={() => onEdit(p)} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>}
                {canManage && <button className="icon-btn delete" title="Delete" onClick={() => onDelete(p.id)} disabled={loading}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// SalesTable Component
function SalesTable({ sales, customers = [] }) {
  if (sales.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <div className="empty-state-icon">🧾</div>
        <h3 className="empty-state-title">No sales recorded</h3>
        <p className="empty-state-text">Complete your first sale from the POS Terminal.</p>
      </div>
    );
  }

  return (
    <div className="table-wrap animate-fade-in">
      <table>
        <thead>
          <tr>
            <th style={{ width: '15%' }}>ORDER ID</th>
            <th style={{ width: '20%' }}>CUSTOMER</th>
            <th style={{ width: '20%' }}>DATE</th>
            <th style={{ width: '25%' }}>ITEMS</th>
            <th style={{ width: '10%' }}>AMOUNT</th>
            <th style={{ width: '10%' }}>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s, i) => (
            <tr key={s.id} style={{ animationDelay: `${i * 30}ms` }} className="animate-slide-in-right">
              <td><strong>{s.id}</strong></td>
              <td><strong>{s.customer}</strong>{customers.find(customer => customer.name === s.customer)?.phone && <small className="sale-customer-phone">{customers.find(customer => customer.name === s.customer).phone}</small>}</td>
              <td>{s.date ? (Number.isNaN(new Date(s.date).getTime()) ? s.date : new Date(s.date).toLocaleString()) : "—"}</td>
              <td>{s.items?.length ? <ul className="sale-item-list">{s.items.map((item, itemIndex) => (
                <li key={`${item.productId ?? item.name}-${itemIndex}`}><strong>{item.name}</strong><span>{item.qty} × {money(item.price)} = {money(item.qty * item.price)}</span></li>
              ))}</ul> : <span className="text-muted">Item details unavailable</span>}</td>
              <td><strong>{money(s.total)}</strong></td>
              <td><span className="badge badge-success">{s.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main App Component
function AppContent() {
  const { user, logout, isAuthenticated, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // 1. Move all state hooks to the very top
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [accent, setAccent] = useState(() => localStorage.getItem("accent") || "ocean");
  const [customAccent, setCustomAccent] = useState(() => localStorage.getItem("customAccent") || "#0ea5e9");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const quickMenuRef = useRef(null);
  const quickMenuButtonRef = useRef(null);
  const [page, setPage] = useState("Dashboard");
  const [products, setProducts] = useState(starterProducts);
  const [apiStatus, setApiStatus] = useState("Connecting to backend...");
  const [customers, setCustomers] = useState(initialCustomers);
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [sales, setSales] = useState(initialSales);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({ category: "Utilities", description: "", amount: "", paymentMethod: "Cash", date: new Date().toISOString().slice(0, 10) });
  const [editingExpenseId, setEditingExpenseId] = useState(null);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState("");
  const [purchaseLines, setPurchaseLines] = useState([]);
  const [purchaseProductId, setPurchaseProductId] = useState("");
  const [purchaseQty, setPurchaseQty] = useState("1");
  const [purchaseUnitCost, setPurchaseUnitCost] = useState("");
  const [purchaseDiscount, setPurchaseDiscount] = useState("0");
  const [purchasePaid, setPurchasePaid] = useState("0");
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [cart, setCart] = useState([]);
  const [saleCustomer, setSaleCustomer] = useState("Walk-in Customer");
  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockTarget, setRestockTarget] = useState(null);
  const [restockQuantity, setRestockQuantity] = useState("");
  const [restockSupplierId, setRestockSupplierId] = useState("");
  const [productForm, setProductForm] = useState({
    name: "", sku: "", category: "Grocery", price: "", purchasePrice: "", stock: "",
  });
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierCategory, setSupplierCategory] = useState("Grocery");
  const [storeName, setStoreName] = useState(() => localStorage.getItem("storeName") || "SmartStore POS");
  const [storeCurrency, setStoreCurrency] = useState(() => localStorage.getItem("storeCurrency") || "PKR");
  const [loading, setLoading] = useState({});

  // 2. Then all effect hooks
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-accent", accent);
    document.documentElement.style.setProperty("--custom-accent", customAccent);
    document.documentElement.style.setProperty("--custom-accent-light", `color-mix(in srgb, ${customAccent} 17%, transparent)`);
    localStorage.setItem("theme", theme);
    localStorage.setItem("accent", accent);
    localStorage.setItem("customAccent", customAccent);
  }, [theme, accent, customAccent]);

  useEffect(() => {
    const trackPointer = event => {
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
      const hoverCard = event.target.closest(".page-content .card, .page-content .stat-card, .page-content .module-intro, .page-content .report-metric, .page-content .report-panel, .page-content .notification-row, .page-content .customer-record, .page-content .supplier-record, .page-content .category-record, .page-content .purchase-line-row, .page-content .simple-row, .page-content .table-wrap tbody tr, .page-content .inventory-summary > div, .page-content .settings-data-summary > div, .page-content .purchase-total, .page-content .customer-record-metric, .page-content .dashboard-category-row, .page-content .dashboard-top-product, .page-content .mini-month-column, .page-content .report-product-row");
      if (hoverCard) {
        const bounds = hoverCard.getBoundingClientRect();
        hoverCard.style.setProperty("--hover-x", `${event.clientX - bounds.left}px`);
        hoverCard.style.setProperty("--hover-y", `${event.clientY - bounds.top}px`);
      }
      const magnet = event.target.closest(".page-content button:not(:disabled), .topbar button:not(:disabled), .sidebar button:not(:disabled), .sidebar .nav-link");
      if (magnet && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const bounds = magnet.getBoundingClientRect();
        magnet.style.setProperty("--magnetic-x", `${(event.clientX - bounds.left - bounds.width / 2) * 0.09}px`);
        magnet.style.setProperty("--magnetic-y", `${(event.clientY - bounds.top - bounds.height / 2) * 0.09}px`);
      }
    };
    const resetMagnet = event => {
      const magnet = event.target.closest?.(".page-content button, .topbar button, .sidebar button, .sidebar .nav-link");
      if (magnet && !magnet.contains(event.relatedTarget)) {
        magnet.style.setProperty("--magnetic-x", "0px");
        magnet.style.setProperty("--magnetic-y", "0px");
      }
    };
    window.addEventListener("pointermove", trackPointer, { passive: true });
    window.addEventListener("pointerout", resetMagnet, { passive: true });
    return () => {
      window.removeEventListener("pointermove", trackPointer);
      window.removeEventListener("pointerout", resetMagnet);
    };
  }, []);

  useEffect(() => {
    const pageRoot = document.querySelector(".page-content");
    if (!pageRoot) return undefined;
    const revealTargets = pageRoot.querySelectorAll(
      ".page-header, .module-page > section, .reports-page > section, .dashboard-grid > *, .dashboard-insights-grid > *, .settings-grid > *, .relationship-page > section, .page-content > .card, .table-wrap tbody tr"
    );
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach(element => element.classList.add("scroll-revealed"));
      return undefined;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("scroll-revealed");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -36px 0px" });
    revealTargets.forEach(element => {
      element.classList.add("scroll-reveal");
      observer.observe(element);
    });

    let frame = 0;
    const parallax = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty("--scroll-parallax", `${Math.min(window.scrollY * 0.08, 48)}px`);
        frame = 0;
      });
    };
    window.addEventListener("scroll", parallax, { passive: true });
    parallax();
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", parallax);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [page]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    localStorage.setItem("storeName", storeName.trim() || "SmartStore POS");
    localStorage.setItem("storeCurrency", storeCurrency);
  }, [storeName, storeCurrency]);

  useEffect(() => {
    if (!quickMenuOpen) return undefined;
    const closeOnOutsideClick = event => {
      if (!quickMenuRef.current?.contains(event.target)) setQuickMenuOpen(false);
    };
    const closeOnEscape = event => {
      if (event.key === "Escape") {
        setQuickMenuOpen(false);
        quickMenuButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [quickMenuOpen]);

  // Keep hooks unconditional so login/logout never changes their call order.
  // The data-loading effect is placed below fetchAll, after its declaration.

  const setEntityLoading = (entity, isLoading) => {
    setLoading(prev => ({ ...prev, [entity]: isLoading }));
  };

  // Data fetching
  const fetchAll = useCallback(async () => {
    setApiStatus("Loading data...");
    try {
      const canViewManagement = user?.role === "admin" || user?.role === "manager";
      const [productsRes, customersRes, suppliersRes, salesRes, categoriesRes, purchasesRes, expensesRes] = await Promise.all([
        axios.get(`${API_BASE}/products`),
        axios.get(`${API_BASE}/customers`),
        axios.get(`${API_BASE}/suppliers`),
        axios.get(`${API_BASE}/sales`),
        axios.get(`${API_BASE}/categories`),
        canViewManagement ? axios.get(`${API_BASE}/purchases`) : Promise.resolve({ data: [] }),
        canViewManagement ? axios.get(`${API_BASE}/expenses`) : Promise.resolve({ data: [] }),
      ]);

      setProducts(productsRes.data.map(p => ({
        ...p,
        sku: p.sku || `SKU-${p.id}`,
        price: Number(p.price),
        stock: Number(p.stock),
      })));
      setCustomers(customersRes.data);
      setSuppliers(suppliersRes.data);
      setSales(salesRes.data);
      setCategoryRecords(categoriesRes.data);
      setPurchases(purchasesRes.data);
      setExpenses(expensesRes.data);
      setApiStatus("Backend connected — data loaded from database");
      showToast("Data loaded successfully", "success", "Welcome back!");
    } catch (error) {
      console.error("Failed to load data:", error.message);
      setApiStatus("Backend unavailable — using demo data");
      showToast("Failed to load data from server", "danger", "Connection Error");
    }
  }, [showToast, user]);

  useEffect(() => {
    // Loading the authenticated workspace is an intentional effect: it syncs
    // the current login state with the API, then stores the returned records.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isAuthenticated) fetchAll();
  }, [fetchAll, isAuthenticated]);

  const notify = (message, type = "info", title) => showToast(message, type, title);

  const reconnectBackend = async () => {
    if (loading.connection) return;
    setEntityLoading("connection", true);
    setApiStatus("Checking backend...");
    try {
      const health = await axios.get(`${API_BASE}/health`, { timeout: 5000 });
      if (health.data.database !== "connected") throw new Error("Database is not connected");
      await fetchAll();
    } catch (error) {
      const status = error.response?.status === 503
        ? "Backend running — database unavailable"
        : "Backend unavailable — start the server and retry";
      setApiStatus(status);
      notify(status, "danger", "Connection failed");
    } finally {
      setEntityLoading("connection", false);
    }
  };

  // Products
  const addProduct = async (event) => {
    event.preventDefault();
    if (!productForm.name.trim() || Number(productForm.price) <= 0 ||
        productForm.price === "" || productForm.purchasePrice === "" || productForm.stock === "" ||
        !Number.isFinite(Number(productForm.purchasePrice)) || Number(productForm.purchasePrice) < 0 ||
        Number(productForm.stock) < 0 ||
        !Number.isInteger(Number(productForm.stock))) {
      notify("Enter a valid product name, selling price, purchase cost, and stock quantity.", "warning");
      return;
    }

    setEntityLoading("products", true);
    try {
      const res = await axios.post(`${API_BASE}/products`, {
        name: productForm.name.trim(),
        sku: productForm.sku.trim() || undefined,
        category: productForm.category,
        price: Number(productForm.price),
        purchasePrice: Number(productForm.purchasePrice),
        stock: Number(productForm.stock),
      });
      setProducts(old => [...old, res.data.product]);
      setProductForm({ name: "", sku: "", category: "Grocery", price: "", purchasePrice: "", stock: "" });
      setShowProductForm(false);
      notify("Product saved to database", "success", "Product Added");
    } catch (error) {
      console.error("Add product failed:", error);
      notify("Failed to save product. " + (error.response?.data?.message || ""), "danger");
    } finally {
      setEntityLoading("products", false);
    }
  };

  const updateProduct = async (event) => {
    event.preventDefault();
    if (!editingProduct) return;

    if (!productForm.name.trim() || Number(productForm.price) <= 0 ||
        productForm.price === "" || productForm.purchasePrice === "" || productForm.stock === "" ||
        !Number.isFinite(Number(productForm.purchasePrice)) || Number(productForm.purchasePrice) < 0 ||
        Number(productForm.stock) < 0 ||
        !Number.isInteger(Number(productForm.stock))) {
      notify("Enter a valid product name, selling price, purchase cost, and stock quantity.", "warning");
      return;
    }

    setEntityLoading("products", true);
    try {
      const res = await axios.put(`${API_BASE}/products/${editingProduct.id}`, {
        name: productForm.name.trim(),
        sku: productForm.sku.trim() || undefined,
        category: productForm.category,
        price: Number(productForm.price),
        purchasePrice: Number(productForm.purchasePrice),
        stock: Number(productForm.stock),
      });
      setProducts(old => old.map(p => p.id === editingProduct.id ? res.data.product : p));
      setProductForm({ name: "", sku: "", category: "Grocery", price: "", purchasePrice: "", stock: "" });
      setEditingProduct(null);
      notify("Product updated in database", "success", "Product Updated");
    } catch (error) {
      console.error("Update product failed:", error);
      notify("Failed to update product. " + (error.response?.data?.message || ""), "danger");
    } finally {
      setEntityLoading("products", false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product? This action cannot be undone.")) return;
    setEntityLoading("products", true);
    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      setProducts(old => old.filter(p => p.id !== id));
      notify("Product deleted from database", "success", "Product Deleted");
    } catch (error) {
      console.error("Delete product failed:", error);
      notify("Failed to delete product. " + (error.response?.data?.message || ""), "danger");
    } finally {
      setEntityLoading("products", false);
    }
  };

  const submitRestock = async (event) => {
    event.preventDefault();
    const quantity = Number(restockQuantity);
    if (!restockTarget || !Number.isInteger(quantity) || quantity < 1) {
      notify("Enter a whole number of units greater than zero.", "warning", "Invalid quantity");
      return;
    }
    setEntityLoading("products", true);
    try {
      const response = await axios.post(`${API_BASE}/products/${restockTarget.id}/restock`, {
        quantity,
        ...(restockSupplierId ? { supplierId: Number(restockSupplierId) } : {}),
      });
      setProducts(old => old.map(product => product.id === restockTarget.id ? response.data.product : product));
      notify(`${restockTarget.name} stock increased by ${quantity} units.`, "success", "Stock updated");
      setRestockTarget(null);
      setRestockQuantity("");
      setRestockSupplierId("");
    } catch (error) {
      console.error("Restock failed:", error);
      notify(error.response?.data?.message || "Could not update product stock.", "danger", "Restock failed");
    } finally {
      setEntityLoading("products", false);
    }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      sku: product.sku || "",
      category: product.category,
      price: String(product.price),
      purchasePrice: product.purchasePrice == null ? "" : String(product.purchasePrice),
      stock: String(product.stock),
    });
    setShowProductForm(true);
  };

  const cancelProductForm = () => {
    setProductForm({ name: "", sku: "", category: "Grocery", price: "", purchasePrice: "", stock: "" });
    setEditingProduct(null);
    setShowProductForm(false);
  };

  // Cart / POS
  const addToCart = (product) => {
    const quantityInCart = cart.find(p => p.id === product.id)?.qty || 0;
    if (quantityInCart >= product.stock) {
      notify("Not enough stock available.", "warning");
      return;
    }

    setCart(old => {
      const found = old.find(p => p.id === product.id);
      return found
        ? old.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p)
        : [...old, { ...product, qty: 1 }];
    });
    notify(`Added ${product.name} to cart`, "success");
  };

  const changeQuantity = (id, change) => {
    const product = products.find(p => p.id === id);
    setCart(old => old.flatMap(item => {
      if (item.id !== id) return [item];
      const qty = item.qty + change;
      if (qty <= 0) return [];
      if (qty > product.stock) {
        notify("Quantity exceeds available stock.", "warning");
        return [item];
      }
      return [{ ...item, qty }];
    }));
  };

  const checkout = async () => {
    if (!cart.length) {
      notify("Add a product to the bill first.", "warning");
      return;
    }

    const items = cart.map(p => ({
      productId: p.id,
      name: p.name,
      price: p.price,
      qty: p.qty,
    }));

    setEntityLoading("sales", true);
    try {
      const res = await axios.post(`${API_BASE}/sales`, {
        customer: saleCustomer,
        customerId: saleCustomerId || undefined,
        items,
      });
      setSales(old => [res.data.sale, ...old]);
      setCart([]);
      setSaleCustomer("Walk-in Customer");
      setSaleCustomerId("");
      notify(`Sale completed! Total: ${money(res.data.sale.total)}`, "success", "Sale Complete");

      // Update stock immediately; a failed refresh must not make a completed
      // sale look retryable and risk charging the customer twice.
      setProducts(old => old.map(product => {
        const soldItem = items.find(item => item.productId === product.id);
        return soldItem ? { ...product, stock: product.stock - soldItem.qty } : product;
      }));
      try {
        const productsRes = await axios.get(`${API_BASE}/products`);
        setProducts(productsRes.data.map(p => ({
          ...p,
          sku: p.sku || `SKU-${p.id}`,
          price: Number(p.price),
          stock: Number(p.stock),
        })));
      } catch (refreshError) {
        console.error("Sale completed, but stock refresh failed:", refreshError);
        notify("Sale completed, but stock could not be refreshed. Reload to sync inventory.", "warning");
      }
    } catch (error) {
      console.error("Checkout failed:", error);
      notify("Checkout failed. " + (error.response?.data?.message || ""), "danger");
    } finally {
      setEntityLoading("sales", false);
    }
  };

  // Customers
  const addCustomer = async (event) => {
    event.preventDefault();
    if (!customerName.trim()) return;
    if (!/^0\d{10}$/.test(customerPhone.trim())) {
      notify("Enter a valid 11-digit contact number starting with 0.", "warning", "Invalid Contact");
      return;
    }
    setEntityLoading("customers", true);
    try {
      const res = await axios.post(`${API_BASE}/customers`, {
        name: customerName.trim(),
        phone: customerPhone.trim(),
      });
      setCustomers(old => [...old, res.data.customer || res.data]);
      setCustomerName("");
      setCustomerPhone("");
      notify("Customer saved to database", "success", "Customer Added");
    } catch (error) {
      console.error("Add customer failed:", error);
      notify("Failed to save customer.", "danger");
    } finally {
      setEntityLoading("customers", false);
    }
  };

  const deleteCustomer = async (id) => {
    if (!window.confirm("Delete this customer?")) return;
    setEntityLoading("customers", true);
    try {
      await axios.delete(`${API_BASE}/customers/${id}`);
      setCustomers(old => old.filter(c => c.id !== id));
      if (String(saleCustomerId) === String(id)) {
        setSaleCustomerId("");
        setSaleCustomer("Walk-in Customer");
      }
      notify("Customer deleted from database", "success", "Customer Deleted");
    } catch (error) {
      console.error("Delete customer failed:", error);
      notify("Failed to delete customer.", "danger");
    } finally {
      setEntityLoading("customers", false);
    }
  };

  // Suppliers
  const addSupplier = async (event) => {
    event.preventDefault();
    if (!supplierName.trim() || !supplierCategory.trim()) return;
    if (!/^0\d{10}$/.test(supplierPhone.trim())) {
      notify("Enter a valid 11-digit contact number starting with 0.", "warning", "Invalid Contact");
      return;
    }
    setEntityLoading("suppliers", true);
    try {
      const res = await axios.post(`${API_BASE}/suppliers`, {
        name: supplierName.trim(),
        category: supplierCategory.trim(),
        phone: supplierPhone.trim(),
      });
      setSuppliers(old => [...old, res.data.supplier || res.data]);
      setSupplierName("");
      setSupplierPhone("");
      setSupplierCategory("Grocery");
      notify("Supplier saved to database", "success", "Supplier Added");
    } catch (error) {
      console.error("Add supplier failed:", error);
      notify("Failed to save supplier.", "danger");
    } finally {
      setEntityLoading("suppliers", false);
    }
  };

  const deleteSupplier = async (id) => {
    if (!window.confirm("Delete this supplier?")) return;
    setEntityLoading("suppliers", true);
    try {
      await axios.delete(`${API_BASE}/suppliers/${id}`);
      setSuppliers(old => old.filter(s => s.id !== id));
      if (String(restockSupplierId) === String(id)) setRestockSupplierId("");
      notify("Supplier deleted from database", "success", "Supplier Deleted");
    } catch (error) {
      console.error("Delete supplier failed:", error);
      notify("Failed to delete supplier.", "danger");
    } finally {
      setEntityLoading("suppliers", false);
    }
  };

  const saveCategory = async event => {
    event.preventDefault();
    if (!categoryForm.name.trim()) return notify("Enter a category name.", "warning");
    setEntityLoading("categories", true);
    try {
      const response = editingCategoryId
        ? await axios.put(`${API_BASE}/categories/${editingCategoryId}`, categoryForm)
        : await axios.post(`${API_BASE}/categories`, categoryForm);
      setCategoryRecords(old => editingCategoryId ? old.map(item => item.id === editingCategoryId ? response.data : item) : [...old, response.data]);
      if (editingCategoryId) setProducts(old => old.map(product => product.category === categoryForm.previousName ? { ...product, category: response.data.name } : product));
      setCategoryForm({ name: "", description: "" }); setEditingCategoryId(null);
      notify("Category saved.", "success", "Categories updated");
    } catch (error) {
      notify(error.response?.data?.message || "Could not save category.", "danger");
    } finally { setEntityLoading("categories", false); }
  };

  const startEditCategory = item => {
    setEditingCategoryId(item.id);
    setCategoryForm({ name: item.name, description: item.description || "", previousName: item.name });
  };

  const deleteCategory = async id => {
    const item = categoryRecords.find(category => category.id === id);
    if (!item || !window.confirm(`Delete category “${item.name}”?`)) return;
    try {
      await axios.delete(`${API_BASE}/categories/${id}`);
      setCategoryRecords(old => old.filter(category => category.id !== id));
      notify("Category deleted.", "success");
    } catch (error) { notify(error.response?.data?.message || "Could not delete category.", "danger"); }
  };

  const saveExpense = async event => {
    event.preventDefault();
    if (!expenseForm.description.trim() || Number(expenseForm.amount) <= 0) return notify("Enter a description and a valid amount.", "warning");
    setEntityLoading("expenses", true);
    try {
      const response = editingExpenseId
        ? await axios.put(`${API_BASE}/expenses/${editingExpenseId}`, expenseForm)
        : await axios.post(`${API_BASE}/expenses`, expenseForm);
      setExpenses(old => editingExpenseId ? old.map(item => item.id === editingExpenseId ? response.data : item) : [response.data, ...old]);
      setExpenseForm({ category: "Utilities", description: "", amount: "", paymentMethod: "Cash", date: new Date().toISOString().slice(0, 10) });
      setEditingExpenseId(null); notify("Expense saved.", "success", "Expenses updated");
    } catch (error) { notify(error.response?.data?.message || "Could not save expense.", "danger"); }
    finally { setEntityLoading("expenses", false); }
  };

  const deleteExpense = async id => {
    if (!window.confirm("Delete this expense record?")) return;
    try { await axios.delete(`${API_BASE}/expenses/${id}`); setExpenses(old => old.filter(item => item.id !== id)); notify("Expense deleted.", "success"); }
    catch (error) { notify(error.response?.data?.message || "Could not delete expense.", "danger"); }
  };

  const addPurchaseLine = () => {
    const product = products.find(item => String(item.id) === purchaseProductId);
    const qty = Number(purchaseQty); const unitCost = Number(purchaseUnitCost);
    if (!product || !Number.isInteger(qty) || qty < 1 || !Number.isFinite(unitCost) || unitCost < 0) return notify("Choose a product and enter a valid quantity and cost.", "warning");
    setPurchaseLines(old => {
      const existing = old.find(item => item.productId === product.id);
      return existing
        ? old.map(item => item.productId === product.id ? { ...item, qty: item.qty + qty, unitCost } : item)
        : [...old, { productId: product.id, name: product.name, qty, unitCost }];
    });
    setPurchaseProductId(""); setPurchaseQty("1"); setPurchaseUnitCost("");
  };

  const submitPurchase = async event => {
    event.preventDefault();
    if (!purchaseSupplierId || !purchaseLines.length) return notify("Choose a supplier and add at least one product.", "warning");
    setEntityLoading("purchases", true);
    try {
      const response = await axios.post(`${API_BASE}/purchases`, { supplierId: Number(purchaseSupplierId), items: purchaseLines, discount: Number(purchaseDiscount), amountPaid: Number(purchasePaid) });
      setPurchases(old => [response.data, ...old]);
      setPurchaseLines([]); setPurchaseDiscount("0"); setPurchasePaid("0");
      const productsResponse = await axios.get(`${API_BASE}/products`);
      setProducts(productsResponse.data.map(product => ({ ...product, sku: product.sku || `SKU-${product.id}`, price: Number(product.price), stock: Number(product.stock) })));
      notify(`Purchase ${response.data.id} recorded and inventory updated.`, "success", "Purchase saved");
    } catch (error) { notify(error.response?.data?.message || "Could not record purchase.", "danger"); }
    finally { setEntityLoading("purchases", false); }
  };

  const recordPurchasePayment = async purchase => {
    const balance = Number(purchase.total) - Number(purchase.amountPaid || 0);
    const input = window.prompt(`Remaining balance: ${money(balance)}. Enter payment amount:`);
    if (input === null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0 || amount > balance) return notify("Enter a valid payment up to the remaining balance.", "warning");
    try {
      const response = await axios.post(`${API_BASE}/purchases/${purchase.id}/payment`, { amount });
      setPurchases(old => old.map(item => item.id === purchase.id ? response.data : item));
      notify("Supplier payment recorded.", "success");
    } catch (error) { notify(error.response?.data?.message || "Could not record payment.", "danger"); }
  };

  // Export
  const exportProducts = () => {
    const csv = [
      ["Name", "SKU", "Category", "Price", "Stock"],
      ...products.map(p => [p.name, p.sku, p.category, p.price, p.stock]),
    ].map(row => row.map(v => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "pos-products.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Product CSV exported", "success", "Export Complete");
  };

  const exportSales = () => {
    const rows = [["Order ID", "Customer", "Date", "Status", "Product", "Quantity", "Unit Price", "Line Total", "Order Total"]];
    sales.forEach(sale => {
      const date = sale.date && !Number.isNaN(new Date(sale.date).getTime())
        ? new Date(sale.date).toISOString()
        : sale.date || "";
      if (sale.items?.length) {
        sale.items.forEach(item => rows.push([sale.id, sale.customer, date, sale.status, item.name, item.qty, item.price, item.qty * item.price, sale.total]));
      } else {
        rows.push([sale.id, sale.customer, date, sale.status, "", "", "", "", sale.total]);
      }
    });
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartstore-sales-report.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Sales report exported", "success", "Export Complete");
  };

  const exportCustomers = () => {
    const rows = [
      ["Customer ID", "Name", "Phone", "Recorded Orders", "Recorded Spend"],
      ...customers.map(customer => {
        const customerSales = sales.filter(sale => Number(sale.customerId) === Number(customer.id) || (sale.customerId == null && sale.customer === customer.name));
        return [customer.id, customer.name, customer.phone, customerSales.length, customerSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0)];
      }),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartstore-customers.csv";
    link.click();
    URL.revokeObjectURL(url);
    notify("Customer directory exported", "success", "Export Complete");
  };

  const exportAllData = () => {
    const snapshot = {
      exportedAt: new Date().toISOString(),
      store: { name: storeName, currency: storeCurrency },
      products,
      categories: categoryRecords,
      customers,
      suppliers,
      sales,
      purchases,
      expenses,
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartstore-data.json";
    link.click();
    URL.revokeObjectURL(url);
    notify("Store data exported", "success", "Export Complete");
  };

  // Derived state
  const filteredProducts = useMemo(() => products.filter(p => {
    const matchesQuery = `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (category === "All" || p.category === category);
  }), [products, query, category]);

  const stockUnits = products.reduce((sum, p) => sum + p.stock, 0);
  const lowStock = products.filter(p => p.stock <= 5);
  const outOfStock = products.filter(p => p.stock === 0).length;
  const notifications = [
    ...lowStock.map(product => ({ id: `stock-${product.id}`, tone: product.stock === 0 ? "danger" : "warning", title: product.stock === 0 ? "Product out of stock" : "Product running low", detail: `${product.name} · ${product.stock} units remaining`, page: "Inventory", action: "Review inventory" })),
    ...purchases.filter(purchase => purchase.paymentStatus !== "Paid").map(purchase => ({ id: `payment-${purchase.id}`, tone: "info", title: "Supplier payment due", detail: `${purchase.supplierName} · ${money(Math.max(0, Number(purchase.total) - Number(purchase.amountPaid)))}`, page: "Purchases", action: "Review purchase" })),
  ];
  const revenue = sales.reduce((sum, s) => sum + s.total, 0);
  const today = new Date();
  const salesToday = sales.filter(sale => { const date = parseSaleDate(sale.date); return date && date.toDateString() === today.toDateString(); });
  const salesThisMonth = sales.filter(sale => { const date = parseSaleDate(sale.date); return date && date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth(); });
  const revenueToday = salesToday.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const revenueThisMonth = salesThisMonth.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
  const inventoryValue = products.reduce((sum, product) => sum + Number(product.price || 0) * Number(product.stock || 0), 0);
  const bestSellers = useMemo(() => {
    const totals = new Map();
    sales.forEach(sale => (sale.items || []).forEach(item => {
      const existing = totals.get(item.name) || { name: item.name, units: 0, revenue: 0 };
      existing.units += Number(item.qty) || 0;
      existing.revenue += (Number(item.qty) || 0) * (Number(item.price) || 0);
      totals.set(item.name, existing);
    }));
    return [...totals.values()].sort((a, b) => b.units - a.units).slice(0, 5);
  }, [sales]);
  const weeklySalesActual = useMemo(() => Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(); day.setDate(day.getDate() - (6 - offset));
    const amount = sales.reduce((sum, sale) => {
      const date = parseSaleDate(sale.date);
      return date && date.toDateString() === day.toDateString() ? sum + Number(sale.total || 0) : sum;
    }, 0);
    return { day: day.toLocaleDateString(undefined, { weekday: "short" }), amount };
  }), [sales]);
  const monthlyRevenue = useMemo(() => Array.from({ length: 12 }, (_, month) => ({
    month: new Date(new Date().getFullYear(), month, 1).toLocaleDateString(undefined, { month: "short" }),
    amount: sales.reduce((sum, sale) => {
      const date = parseSaleDate(sale.date);
      return date && date.getFullYear() === new Date().getFullYear() && date.getMonth() === month ? sum + Number(sale.total || 0) : sum;
    }, 0),
  })), [sales]);
  const categoryRevenue = useMemo(() => {
    const categoryByProduct = new Map(products.map(product => [product.id, product.category]));
    const totals = new Map();
    sales.forEach(sale => (sale.items || []).forEach(item => {
      const label = categoryByProduct.get(item.productId) || "Uncategorized";
      totals.set(label, (totals.get(label) || 0) + Number(item.qty || 0) * Number(item.price || 0));
    }));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sales, products]);
  const filteredCustomers = customers.filter(customer => `${customer.name} ${customer.phone}`.toLowerCase().includes(query.toLowerCase()));
  const cartTotal = cart.reduce((sum, p) => sum + p.price * p.qty, 0);
  const purchaseSubtotal = purchaseLines.reduce((sum, item) => sum + item.qty * item.unitCost, 0);
  const purchaseTotal = Math.max(0, purchaseSubtotal - Number(purchaseDiscount || 0));
  const categoryNames = [...new Set([["Grocery", "Dairy", "Bakery", "Beverages", "Snacks", "Household", "Other"], ...categoryRecords.map(item => item.name), ...products.map(p => p.category)].flat())];
  const categories = ["All", ...categoryNames];
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const profitDataComplete = sales.length > 0 && sales.every(sale => sale.items?.length && sale.items.every(item => item.unitCost !== undefined && item.unitCost !== null && item.unitCost !== "" && Number.isFinite(Number(item.unitCost))));
  const totalProfit = profitDataComplete
    ? sales.reduce((sum, sale) => sum + Number(sale.total || 0) - sale.items.reduce((cost, item) => cost + Number(item.unitCost || 0) * Number(item.qty || 0), 0), 0) - totalExpenses
    : null;

  const userInitials = user?.username
    ? user.username.slice(0, 2).toUpperCase()
    : "AD";
  const canManage = user?.role === "admin" || user?.role === "manager";
  const managementOnlyPages = new Set(["Categories", "Purchases", "Expenses", "Suppliers"]);
  const visibleMenu = menu.map(group => ({
    ...group,
    items: group.items.filter(([label]) => canManage || !managementOnlyPages.has(label)),
  })).filter(group => group.items.length > 0);

  const handleNavClick = (label) => {
    setPage(label);
    setQuery("");
    setCategory("All");
    setSidebarOpen(false);
    setQuickMenuOpen(false);
  };

  if (authLoading) {
    return (
      <div className="pos-app loading-screen">
        <div className="loader">
          <div className="loader-ring" />
          <p className="loader-text">Loading SmartStore POS...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }
  return (
    <div className="pos-app">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="brand-row">
            <div className="brand-icon">S</div>
            <div className="brand-text">
              <strong>{storeName}</strong>
              <small>RETAIL MANAGEMENT</small>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {visibleMenu.map((group) => (
            <div key={group.title} className="nav-group">
              <p className="nav-heading">{group.title}</p>
              {group.items.map(([label, icon]) => (
                <button
                  key={label}
                  className={`nav-link ${page === label ? "selected" : ""}`}
                  onClick={() => handleNavClick(label)}
                  aria-current={page === label ? "page" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">{icon}</span>
                  <span>{label}</span>
                  {label === "Inventory" && lowStock.length > 0 &&
                    <span className="nav-badge" aria-label={`${lowStock.length} products low stock`}>{lowStock.length}</span>}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="avatar avatar-md user-avatar">{userInitials}</div>
            <div className="user-details">
              <strong>{user?.username || "Store Admin"}</strong>
              <small>{user?.role === "admin" ? "Administrator" : user?.role === "manager" ? "Manager" : "Cashier"}</small>
            </div>
          </div>
          <button className="logout-btn" onClick={logout} title="Sign out">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Workspace */}
      <main className="workspace">
        {/* Topbar */}
        <header className="topbar" role="banner">
          <div className="breadcrumb">
            Workspace <span aria-hidden="true">/</span> <strong>{page}</strong>
          </div>
          <div className="top-actions">
            <button
              type="button"
              className={`live-status connection-button ${apiStatus.toLowerCase().includes("connected") ? "" : apiStatus.toLowerCase().includes("checking") || apiStatus.toLowerCase().includes("connecting") || apiStatus.toLowerCase().includes("loading") ? "status-pending" : "status-offline"}`}
              onClick={reconnectBackend}
              disabled={loading.connection}
              title={apiStatus.toLowerCase().includes("connected") ? "Click to check the backend and reload store data" : "Click to retry the backend and database connection"}
              aria-label={`Backend status: ${apiStatus}. Click to retry connection.`}
            >
              <i aria-hidden="true"></i>
              <span>{apiStatus.toLowerCase().includes("checking") || apiStatus.toLowerCase().includes("connecting") || apiStatus.toLowerCase().includes("loading") ? "Checking…" : apiStatus.toLowerCase().includes("connected") ? "Backend connected" : "Retry connection"}</span>
              <span className="connection-state-icon" aria-hidden="true">
                {apiStatus.toLowerCase().includes("connected") ? (
                  <svg viewBox="0 0 16 16" fill="none"><path d="m3.5 8.2 2.8 2.8 6.2-6.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                ) : (
                  <svg viewBox="0 0 16 16" fill="none"><path d="M13.3 5.6A5.8 5.8 0 0 0 3 5L2 6.1M2 6.1V3.7M2 6.1h2.5M2.7 10.4A5.8 5.8 0 0 0 13 11l1-1.1m0 0v2.4m0-2.4h-2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                )}
              </span>
            </button>
            <button
              className="topbar-icon-btn"
              onClick={() => handleNavClick("Notifications")}
              title="Notifications"
              aria-label={`Notifications: ${notifications.length} alerts`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </button>
            <button
              className="topbar-icon-btn"
              onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              title="Toggle theme"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              )}
            </button>
            <div className="quick-menu-wrap" ref={quickMenuRef}>
              <button ref={quickMenuButtonRef} className="topbar-icon-btn quick-menu-toggle" type="button" onClick={() => setQuickMenuOpen(open => !open)} aria-label="Open quick navigation" aria-expanded={quickMenuOpen} aria-controls="quick-navigation">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              {quickMenuOpen && <nav className="quick-menu-panel" id="quick-navigation" aria-label="Quick navigation">
                <div className="quick-menu-heading"><strong>Quick menu</strong><small>Go to a workspace</small></div>
                <button type="button" onClick={() => handleNavClick("POS Terminal")}><span>🛒</span> Point of Sale</button>
                <button type="button" onClick={() => handleNavClick("Products")}><span>📦</span> Products</button>
                {canManage && <button type="button" onClick={() => handleNavClick("Categories")}><span>🏷️</span> Categories</button>}
                <button type="button" onClick={() => handleNavClick("Inventory")}><span>📋</span> Inventory</button>
                {canManage && <button type="button" onClick={() => handleNavClick("Purchases")}><span>🧺</span> Purchases</button>}
                <button type="button" onClick={() => handleNavClick("Sales & Orders")}><span>🧾</span> Sales & Orders</button>
                {canManage && <button type="button" onClick={() => handleNavClick("Expenses")}><span>💳</span> Expenses</button>}
                <button type="button" onClick={() => handleNavClick("Customers")}><span>👥</span> Customers</button>
                {canManage && <button type="button" onClick={() => handleNavClick("Suppliers")}><span>🚚</span> Suppliers</button>}
                <button type="button" onClick={() => handleNavClick("Notifications")}><span>🔔</span> Notifications <small>{notifications.length}</small></button>
                <button type="button" onClick={() => handleNavClick("Reports")}><span>📑</span> Reports</button>
                <div className="quick-menu-divider" />
                <button type="button" onClick={() => { setTheme(current => current === "light" ? "dark" : "light"); setQuickMenuOpen(false); }}><span>{theme === "light" ? "🌙" : "☀️"}</span> Switch to {theme === "light" ? "dark" : "light"} theme</button>
                <button type="button" onClick={() => handleNavClick("Notifications")}><span>🔔</span> Notifications <small>{notifications.length}</small></button>
                <button type="button" onClick={logout}><span>↪</span> Sign out</button>
              </nav>}
            </div>
            <div className="avatar avatar-sm top-avatar user-avatar">{userInitials}</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <div className="page-header">
            <div className="page-title">
              <h1>{page === "POS Terminal" ? "Point of Sale" : page}</h1>
              <p>
                {page === "Dashboard" ? "Here's what's happening in your store today." :
                 page === "Notifications" ? "Review stock warnings and supplier payment reminders." :
                 page === "POS Terminal" ? "Create a bill and complete a customer sale." :
                 page === "Products" ? "Manage your product catalogue and pricing." :
                 page === "Categories" ? "Organize products into searchable catalogue groups." :
                 page === "Inventory" ? "Monitor stock levels and identify products to restock." :
                 page === "Purchases" ? "Record supplier orders, payments, and incoming stock." :
                 page === "Expenses" ? "Track operating costs and review business outgoings." :
                 page === "Sales & Orders" ? "Review your recent transactions." :
                 page === "Customers" ? "Manage your customer database." :
                 page === "Suppliers" ? "Track your suppliers and purchase orders." :
                 page === "Analytics" ? "View business insights and trends." :
                 page === "Reports" ? "Generate and export business reports." :
                 `Manage your store's ${page.toLowerCase()} information.`}
              </p>
            </div>
            <div className="page-actions">
              {page === "Products" && canManage &&
                <button className="btn btn-primary" onClick={() => { cancelProductForm(); setShowProductForm(true); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  Add Product
                </button>}
              {page === "Dashboard" &&
                <button className="btn btn-primary" onClick={() => handleNavClick("POS Terminal")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
                  New Sale
                </button>}
              {page === "Customers" &&
                <button className="btn btn-secondary" onClick={exportCustomers}>Export Customers</button>}
              {page === "Settings" &&
                <button className="btn btn-secondary" onClick={exportAllData}>Download Backup</button>}
            </div>
          </div>

          {page === "Notifications" && (
            <section className="card notifications-page animate-fade-in">
              <div className="module-section-heading"><div><h2>Store alerts</h2><p>{notifications.length} items need review</p></div><span className="badge badge-warning">{notifications.length} active</span></div>
              {notifications.length ? <div className="notification-list">{notifications.map(item => <article className={`notification-row notification-${item.tone}`} key={item.id}><span className="notification-mark" aria-hidden="true">{item.tone === "danger" ? "!" : item.tone === "warning" ? "⌁" : "₨"}</span><div className="notification-copy"><strong>{item.title}</strong><small>{item.detail}</small></div><button className="btn btn-secondary btn-sm" onClick={() => handleNavClick(item.page)}>{item.action}</button></article>)}</div> : <div className="relationship-empty"><div>✓</div><strong>All clear</strong><span>No low stock products or outstanding supplier payments need attention.</span></div>}
            </section>
          )}

          {/* Dashboard */}
          {page === "Dashboard" && (
            <>
              <section className="stat-grid dashboard-stat-grid" aria-label="Key metrics">
                <StatCard label="SALES TODAY" value={money(revenueToday)} detail={`${salesToday.length} completed orders`} icon="☀️" tone="green" />
                <StatCard label="SALES THIS MONTH" value={money(revenueThisMonth)} detail={`${salesThisMonth.length} completed orders`} icon="🗓️" tone="blue" />
                <StatCard label="TOTAL REVENUE" value={money(revenue)} detail="From completed sales" icon="📈" tone="green" />
                <StatCard label="NET PROFIT" value={totalProfit === null ? "—" : money(totalProfit)} detail={totalProfit === null ? "Record product costs for accurate profit" : "Revenue less product costs and expenses"} icon="💹" tone="purple" />
                <StatCard label="TOTAL EXPENSES" value={money(totalExpenses)} detail={`${expenses.length} recorded expenses`} icon="💳" tone="orange" />
                <StatCard label="PRODUCTS" value={products.length} detail={`${categories.length - 1} categories`} icon="📦" tone="purple" />
                <StatCard label="LOW STOCK" value={lowStock.length} detail={`${outOfStock} out of stock`} icon="⚠️" tone="orange" />
                <StatCard label="CUSTOMERS" value={customers.length} detail="Registered customers" icon="👥" tone="blue" />
                <StatCard label="SUPPLIERS" value={suppliers.length} detail="Registered suppliers" icon="🚚" tone="green" />
              </section>

              <section className="dashboard-grid">
                <div className="card">
                  <div className="card-header">
                    <div className="card-header-content">
                      <h2>Sales Overview</h2>
                      <p>Weekly sales trend • PKR</p>
                    </div>
                    <span className="badge badge-info">Last 7 days</span>
                  </div>
                  <div className="card-body">
                    <div className="chart-total">{money(weeklySalesActual.reduce((sum, d) => sum + d.amount, 0))}</div>
                    <div className="bar-chart" role="img" aria-label="Weekly sales chart">
                      {weeklySalesActual.map((d) => (
                        <div key={d.day} className="bar-column" title={`${d.day}: ${money(d.amount)}`}>
                          <div className="bar-track">
                            <div className="bar" style={{ height: `${d.amount ? Math.max(5, d.amount / Math.max(...weeklySalesActual.map(item => item.amount), 1) * 100) : 0}%` }} />
                          </div>
                          <span>{d.day}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-header-content">
                      <h2>Stock Alerts</h2>
                      <p>Products requiring attention</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleNavClick("Inventory")}>View all</button>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    {lowStock.length > 0 ? (
                      lowStock.slice(0, 5).map((p) => (
                        <div key={p.id} className="alert-row">
                          <div className="product-avatar-sm">{p.name.slice(0, 1).toUpperCase()}</div>
                          <div className="grow">
                            <strong>{p.name}</strong>
                            <small>{p.sku || `SKU-${p.id}`} • {p.category}</small>
                          </div>
                          <span className={`stock-badge ${p.stock === 0 ? "critical" : "low"}`}>
                            {p.stock === 0 ? "Out of Stock" : `${p.stock} left`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state" style={{ padding: "32px 24px" }}>
                        <div className="empty-state-icon">✅</div>
                        <h3 className="empty-state-title">All products well stocked</h3>
                        <p className="empty-state-text">No inventory alerts at the moment.</p>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              <section className="dashboard-insights-grid">
                <article className="card dashboard-insight-panel"><div className="card-header"><div className="card-header-content"><h2>Monthly revenue</h2><p>Recorded sales this calendar year</p></div></div><div className="mini-month-chart">{monthlyRevenue.map(item => <div className="mini-month-column" key={item.month} title={`${item.month}: ${money(item.amount)}`}><div className="mini-month-track"><i style={{ height: `${item.amount ? Math.max(4, item.amount / Math.max(...monthlyRevenue.map(month => month.amount), 1) * 100) : 0}%` }} /></div><small>{item.month}</small></div>)}</div></article>
                <article className="card dashboard-insight-panel"><div className="card-header"><div className="card-header-content"><h2>Sales by category</h2><p>Based on recorded sale items</p></div></div><div className="dashboard-category-list">{categoryRevenue.length ? categoryRevenue.map(([name, amount]) => <div className="dashboard-category-row" key={name}><div><strong>{name}</strong><span>{money(amount)}</span></div><div className="category-progress"><i style={{ width: `${amount / Math.max(...categoryRevenue.map(([, total]) => total), 1) * 100}%` }} /></div></div>) : <p className="report-empty">Category sales appear after product-level sales are recorded.</p>}</div></article>
                <article className="card dashboard-insight-panel"><div className="card-header"><div className="card-header-content"><h2>Top-selling products</h2><p>Ranked by units sold</p></div></div><div className="dashboard-top-products">{bestSellers.length ? bestSellers.slice(0, 4).map((item, index) => <div className="dashboard-top-product" key={item.name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong><small>{item.units} sold</small></div>) : <p className="report-empty">Product sales will appear here after checkout.</p>}</div></article>
              </section>

              <section className="card animate-fade-in">
                <div className="card-header">
                  <div className="card-header-content">
                    <h2>Recent Transactions</h2>
                    <p>Your latest sales activity</p>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleNavClick("Sales & Orders")}>View all</button>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                  <SalesTable sales={sales.slice(0, 5)} customers={customers} />
                </div>
              </section>
            </>
          )}

          {/* Products */}
          {page === "Products" && (
            <section className="card animate-fade-in">
              {(showProductForm || editingProduct) && (
                <form className="entry-form" onSubmit={editingProduct ? updateProduct : addProduct}>
                  <label>
                    <span className="form-label">Product Name</span>
                    <input className="form-input" required value={productForm.name}
                      onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Enter product name" />
                  </label>
                  <label>
                    <span className="form-label">SKU / Code</span>
                    <input className="form-input" value={productForm.sku}
                      onChange={e => setProductForm({ ...productForm, sku: e.target.value })}
                      placeholder="Auto-generated if empty" />
                  </label>
                  <label>
                    <span className="form-label">Category</span>
                    <select className="form-select" value={productForm.category}
                      onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                      {categoryNames.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="form-label">Price (Rs.)</span>
                    <input className="form-input" required type="number" min="0.01" step="0.01" value={productForm.price}
                      onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="0.00" />
                  </label>
                  <label>
                    <span className="form-label">Purchase Cost per Unit</span>
                    <input className="form-input" required type="number" min="0" step="0.01" value={productForm.purchasePrice}
                      onChange={e => setProductForm({ ...productForm, purchasePrice: e.target.value })} placeholder="0.00" />
                  </label>
                  <label>
                    <span className="form-label">Stock Quantity</span>
                    <input className="form-input" required type="number" min="0" step="1" value={productForm.stock}
                      onChange={e => setProductForm({ ...productForm, stock: e.target.value })}
                      placeholder="0" />
                  </label>
                  <label className="full-width">
                    <span className="form-label">Description (Optional)</span>
                    <textarea className="form-textarea" rows={3} placeholder="Add a brief description..." />
                  </label>
                  <div className="form-actions">
                    <button type="button" className="btn btn-secondary" onClick={cancelProductForm} disabled={loading.products}>
                      Cancel
                    </button>
                    <button className="btn btn-primary" type="submit" disabled={loading.products}>
                      {loading.products ? <span className="btn-loading"><span className="spinner spinner-sm" /></span> : editingProduct ? "Save Changes" : "Save Product"}
                    </button>
                  </div>
                </form>
              )}
              <div className="toolbar">
                <input className="search-box" placeholder="Search by product, SKU or category..."
                  value={query} onChange={e => setQuery(e.target.value)} aria-label="Search products" />
                <select className="filter-select" value={category} onChange={e => setCategory(e.target.value)} aria-label="Filter by category">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
                <button className="btn btn-secondary" onClick={exportProducts}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Export CSV
                </button>
              </div>
              <p className="table-caption">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""} found</p>
              <ProductTable products={filteredProducts} onEdit={startEditProduct} onDelete={deleteProduct} onRestock={product => { setRestockTarget(product); setRestockQuantity(""); setRestockSupplierId(""); }} canManage={canManage} loading={loading.products} />
            </section>
          )}

          {/* Inventory */}
          {page === "Categories" && (
            <div className="module-page animate-fade-in">
              <section className="module-intro"><span className="module-intro-icon">🏷️</span><div><h2>Product categories</h2><p>Categories organize the catalogue and connect supplier stock to the right products.</p></div></section>
              <section className="card module-form-card"><form className="module-inline-form" onSubmit={saveCategory}><label className="form-group"><span className="form-label">Category name</span><input className="form-input" required maxLength={48} value={categoryForm.name} onChange={event => setCategoryForm(old => ({ ...old, name: event.target.value }))} placeholder="e.g. Household" /></label><label className="form-group"><span className="form-label">Description</span><input className="form-input" value={categoryForm.description} onChange={event => setCategoryForm(old => ({ ...old, description: event.target.value }))} placeholder="What products belong here?" /></label><button className="btn btn-primary" disabled={loading.categories}>{loading.categories ? "Saving…" : editingCategoryId ? "Save category" : "+ Add category"}</button>{editingCategoryId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingCategoryId(null); setCategoryForm({ name: "", description: "" }); }}>Cancel</button>}</form></section>
              <section className="category-card-grid">{categoryRecords.filter(item => `${item.name} ${item.description}`.toLowerCase().includes(query.toLowerCase())).map(item => <article className="card category-record" key={item.id}><div className={`category-record-icon color-${item.color || "blue"}`}>{item.name.slice(0, 1).toUpperCase()}</div><div className="category-record-info"><strong>{item.name}</strong><small>{item.description || "No description added"}</small></div><span className="category-product-count">{item.productCount || 0} products</span><div className="category-record-actions"><button className="icon-btn" title="Edit category" onClick={() => startEditCategory(item)}>✎</button><button className="icon-btn delete" title="Delete category" onClick={() => deleteCategory(item.id)}>×</button></div></article>)}{categoryRecords.length === 0 && <div className="card relationship-empty"><div>🏷️</div><strong>No saved categories yet</strong><span>Existing product categories remain available. Add a category here to manage new catalogue sections.</span></div>}</section>
            </div>
          )}

          {/* Inventory */}
          {page === "Inventory" && (
            <section className="card animate-fade-in">
              <div className="inventory-summary" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
                <div style={{ padding: "20px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)" }}>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Total Stock Units</span>
                  <strong style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>{stockUnits.toLocaleString()}</strong>
                </div>
                <div style={{ padding: "20px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)" }}>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Low Stock Products</span>
                  <strong style={{ fontSize: "28px", fontWeight: 800, color: "var(--warning)" }}>{lowStock.length}</strong>
                </div>
                <div style={{ padding: "20px", background: "var(--bg-secondary)", border: "1px solid var(--border-light)", borderRadius: "var(--radius-lg)" }}>
                  <span style={{ display: "block", color: "var(--text-muted)", fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px" }}>Out of Stock</span>
                  <strong style={{ fontSize: "28px", fontWeight: 800, color: "var(--danger)" }}>{outOfStock}</strong>
                </div>
              </div>
              <ProductTable products={[...products].sort((a, b) => a.stock - b.stock)} onEdit={startEditProduct} onDelete={deleteProduct} onRestock={product => { setRestockTarget(product); setRestockQuantity(""); setRestockSupplierId(""); }} canManage={canManage} loading={loading.products} />
              <p className="helper-text" style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)" }}>Low stock means 5 units or fewer. Changes persist to database.</p>
            </section>
          )}

          {/* POS Terminal */}
          {page === "POS Terminal" && (
            <section className="pos-layout animate-fade-in">
              <div className="card">
                <div className="card-header">
                  <div className="card-header-content">
                    <h2>Select Products</h2>
                    <p>Choose items to add to the current bill</p>
                  </div>
                </div>
                <div className="card-body" style={{ padding: "20px 24px 0" }}>
                  <input className="search-box wide-search" placeholder="Search products..."
                    value={query} onChange={e => setQuery(e.target.value)} aria-label="Search products" />
                </div>
                <div className="card-body">
                  <div className="pos-products" role="list">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        className="pos-product"
                        disabled={p.stock === 0}
                        onClick={() => addToCart(p)}
                        role="listitem"
                        aria-label={`${p.name} - ${money(p.price)} - ${p.stock} in stock`}
                      >
                        <span className="product-icon" aria-hidden="true">📦</span>
                        <strong>{p.name}</strong>
                        <small>{p.stock} in stock • {p.category}</small>
                        <b>{money(p.price)}</b>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="empty-state" style={{ gridColumn: "1 / -1", padding: "48px 24px" }}>
                        <div className="empty-state-icon">🔍</div>
                        <h3 className="empty-state-title">No products found</h3>
                        <p className="empty-state-text">Try adjusting your search or add new products.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card cart-card">
                <div className="cart-header">
                  <div>
                    <h2 className="cart-title">Current Bill</h2>
                    <label className="cart-customer-select-label" htmlFor="sale-customer">Customer</label>
                    <select id="sale-customer" className="form-select cart-customer-select" value={saleCustomerId} onChange={e => { const selectedId = e.target.value; setSaleCustomerId(selectedId); setSaleCustomer(customers.find(customer => String(customer.id) === selectedId)?.name || "Walk-in Customer"); }}>
                      <option value="">Walk-in Customer</option>
                      {customers.filter(customer => customer.name !== "Walk-in Customer").map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
                    </select>
                  </div>
                </div>
                {cart.length === 0 ? (
                  <div className="cart-empty">
                    <div className="cart-empty-icon">🛒</div>
                    <h3 className="empty-state-title">Your cart is empty</h3>
                    <p className="empty-state-text">Select products from the left to begin a sale.</p>
                  </div>
                ) : (
                  <>
                    {cart.map((p) => (
                      <div key={p.id} className="cart-item">
                        <div className="cart-item-info">
                          <p className="cart-item-name">{p.name}</p>
                          <p className="cart-item-price">{money(p.price)} each</p>
                        </div>
                        <div className="cart-item-qty">
                          <button className="qty-btn" onClick={() => changeQuantity(p.id, -1)} aria-label="Decrease quantity">−</button>
                          <span>{p.qty}</span>
                          <button className="qty-btn" onClick={() => changeQuantity(p.id, 1)} aria-label="Increase quantity">+</button>
                        </div>
                        <strong className="cart-item-total">{money(p.price * p.qty)}</strong>
                      </div>
                    ))}
                    <div className="checkout-panel">
                      <div className="bill-total">
                        <span className="bill-total-label">Total</span>
                        <strong className="bill-total-amount">{money(cartTotal)}</strong>
                      </div>
                      <button className="btn btn-primary checkout-btn" disabled={!cart.length || loading.sales} onClick={checkout}>
                        {loading.sales ? "Processing..." : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                            Complete Sale
                          </>
                        )}
                      </button>
                      <p className="helper-text checkout-hint">Checkout saves to database and updates stock automatically.</p>
                    </div>
                  </>
                )}
              </div>
            </section>
          )}

          {/* Sales & Orders */}
          {page === "Purchases" && (
            <div className="module-page animate-fade-in">
              <section className="module-intro purchase-intro"><span className="module-intro-icon">🧺</span><div><h2>Purchases & supplier payments</h2><p>Record stock received from a supplier. The purchase adds quantities to existing product records.</p></div></section>
              <section className="card purchase-composer"><div className="module-section-heading"><div><h2>New purchase order</h2><p>Purchase costs update product cost and stock for profit reporting.</p></div></div><form onSubmit={submitPurchase}>
                <label className="form-group"><span className="form-label">Supplier</span><select className="form-select" required value={purchaseSupplierId} onChange={event => setPurchaseSupplierId(event.target.value)}><option value="">Select a supplier</option>{suppliers.map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name} · {supplier.category}</option>)}</select></label>
                <div className="purchase-line-entry"><label className="form-group"><span className="form-label">Product</span><select className="form-select" value={purchaseProductId} onChange={event => { setPurchaseProductId(event.target.value); const item = products.find(product => String(product.id) === event.target.value); if (item) setPurchaseUnitCost(String(item.purchasePrice || 0)); }}><option value="">Select a product</option>{products.map(product => <option key={product.id} value={product.id}>{product.name} · {product.stock} in stock</option>)}</select></label><label className="form-group"><span className="form-label">Quantity</span><input className="form-input" type="number" min="1" step="1" value={purchaseQty} onChange={event => setPurchaseQty(event.target.value)} /></label><label className="form-group"><span className="form-label">Cost / unit</span><input className="form-input" type="number" min="0" step="0.01" value={purchaseUnitCost} onChange={event => setPurchaseUnitCost(event.target.value)} /></label><button type="button" className="btn btn-secondary" onClick={addPurchaseLine}>Add item</button></div>
                {purchaseLines.length > 0 && <div className="purchase-lines">{purchaseLines.map(line => <div className="purchase-line-row" key={line.productId}><div><strong>{line.name}</strong><small>{line.qty} × {money(line.unitCost)}</small></div><strong>{money(line.qty * line.unitCost)}</strong><button type="button" className="icon-btn delete" title={`Remove ${line.name}`} onClick={() => setPurchaseLines(old => old.filter(item => item.productId !== line.productId))}>×</button></div>)}</div>}
                <div className="purchase-totals"><label className="form-group"><span className="form-label">Discount</span><input className="form-input" type="number" min="0" max={purchaseSubtotal} step="0.01" value={purchaseDiscount} onChange={event => setPurchaseDiscount(event.target.value)} /></label><label className="form-group"><span className="form-label">Amount paid</span><input className="form-input" type="number" min="0" max={purchaseTotal} step="0.01" value={purchasePaid} onChange={event => setPurchasePaid(event.target.value)} /></label><div className="purchase-total"><small>Purchase total</small><strong>{money(purchaseTotal)}</strong></div><button className="btn btn-primary" disabled={loading.purchases || !purchaseLines.length}>{loading.purchases ? "Recording…" : "Save purchase & update stock"}</button></div>
              </form></section>
              <section className="card module-table-card"><div className="module-section-heading"><div><h2>Purchase history</h2><p>Outstanding payments can be added to an order.</p></div><strong>{purchases.length} recorded</strong></div><div className="table-wrap"><table><thead><tr><th style={{ width: '15%' }}>INVOICE</th><th style={{ width: '20%' }}>SUPPLIER</th><th style={{ width: '12%' }}>DATE</th><th style={{ width: '12%' }}>TOTAL</th><th style={{ width: '15%' }}>PAID</th><th style={{ width: '12%' }}>STATUS</th><th style={{ width: '14%' }}>ACTION</th></tr></thead><tbody>{purchases.map(purchase => <tr key={purchase.id}><td><strong>{purchase.id}</strong></td><td>{purchase.supplierName}</td><td>{new Date(purchase.date).toLocaleDateString()}</td><td>{money(purchase.total)}</td><td>{money(purchase.amountPaid)} / {money(purchase.total)}</td><td><span className={`badge ${purchase.paymentStatus === "Paid" ? "badge-success" : purchase.paymentStatus === "Partially Paid" ? "badge-warning" : "badge-danger"}`}>{purchase.paymentStatus}</span></td><td>{purchase.paymentStatus !== "Paid" && <button className="btn btn-secondary btn-sm" onClick={() => recordPurchasePayment(purchase)}>Record payment</button>}</td></tr>)}</tbody></table>{purchases.length === 0 && <div className="relationship-empty"><div>🧺</div><strong>No purchases recorded</strong><span>Completed purchase orders appear here and increase inventory.</span></div>}</div></section>
            </div>
          )}

          {/* Sales & Orders */}
          {page === "Sales & Orders" && (
            <section className="card animate-fade-in">
              <div className="toolbar">
                <input className="search-box" placeholder="Search customer or sale ID..."
                  value={query} onChange={e => setQuery(e.target.value)} aria-label="Search sales" />
              </div>
              <SalesTable sales={sales.filter(s => `${s.id} ${s.customer} ${(s.items || []).map(item => item.name).join(" ")}`.toLowerCase().includes(query.toLowerCase()))} customers={customers} />
            </section>
          )}

          {/* Customers */}
          {page === "Customers" && (
            <div className="relationship-page animate-fade-in">
              <section className="relationship-intro customer-intro"><div className="relationship-intro-icon">♙</div><div><h2>Customer directory</h2><p>Save customer contacts, select them at checkout, and review their sales history.</p></div><div className="relationship-intro-stat"><strong>{customers.length}</strong><span>registered</span></div></section>
              <section className="card relationship-form-card"><div className="relationship-section-heading"><div><h2>Add a customer</h2><p>New customers become available in the POS checkout selector.</p></div></div>
                <form className="relationship-form" onSubmit={addCustomer}>
                  <label className="form-group"><span className="form-label">Customer name</span><input className="form-input" required placeholder="e.g. Ayesha Malik" value={customerName} onChange={e => setCustomerName(e.target.value)} /></label>
                  <label className="form-group"><span className="form-label">Contact number</span><input className="form-input" type="tel" inputMode="numeric" pattern="0[0-9]{10}" maxLength={11} required title="Enter 11 digits starting with 0" placeholder="e.g. 03001234567" value={customerPhone} onChange={e => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} /></label>
                  <button className="btn btn-primary" type="submit" disabled={loading.customers}>{loading.customers ? "Saving…" : "+ Add customer"}</button>
                </form>
              </section>
              <section className="card relationship-list-card"><div className="relationship-section-heading relationship-list-heading"><div><h2>Customer activity</h2><p>Order totals are calculated from recorded sales.</p></div><label className="relationship-search"><span className="sr-only">Search customers</span><input className="form-input" placeholder="Search customers…" value={query} onChange={e => setQuery(e.target.value)} /></label></div>
                <div className="customer-record-list">
                  {filteredCustomers.map(c => {
                    const customerSales = sales.filter(sale => Number(sale.customerId) === Number(c.id) || (sale.customerId == null && sale.customer === c.name));
                    const orderCount = customerSales.length || Number(c.orders) || 0;
                    const lifetimeSpend = customerSales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
                    return <article key={c.id} className="customer-record"><div className={`avatar avatar-md customer-avatar customer-avatar-${Math.abs(String(c.id).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 5}`} aria-hidden="true">{c.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}</div><div className="customer-record-main"><strong>{c.name}</strong><a href={`tel:${c.phone}`}><small>{c.phone || "Contact not provided"}</small></a></div><div className="customer-record-metric"><strong>{orderCount}</strong><small>orders</small></div><div className="customer-record-metric"><strong>{money(lifetimeSpend)}</strong><small>recorded spend</small></div><button className="btn btn-ghost btn-sm" onClick={() => { handleNavClick("Sales & Orders"); setQuery(c.name); }}>View orders</button><button className="icon-btn delete" title="Delete customer" onClick={() => deleteCustomer(c.id)} aria-label={`Delete ${c.name}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></article>;
                  })}
                  {filteredCustomers.length === 0 && <div className="relationship-empty"><div>♙</div><strong>{customers.length === 0 ? "No customers yet" : "No matching customers"}</strong><span>{customers.length === 0 ? "Add customers here to select them during checkout and track their recorded orders." : "Try another name or contact number."}</span></div>}
                </div>
              </section>
            </div>
          )}

          {/* Suppliers */}
          {page === "Suppliers" && (
            <div className="relationship-page animate-fade-in">
              <section className="relationship-intro supplier-intro"><div className="relationship-intro-icon">⇄</div><div><h2>Supplier directory</h2><p>Supplier categories connect to matching products and make low-stock items easier to replenish.</p></div><div className="relationship-intro-stat"><strong>{suppliers.length}</strong><span>suppliers</span></div></section>
              <section className="card relationship-form-card"><div className="relationship-section-heading"><div><h2>Add a supplier</h2><p>Choose the product category this supplier usually provides.</p></div></div>
                <form className="relationship-form supplier-form" onSubmit={addSupplier}>
                  <label className="form-group"><span className="form-label">Supplier name</span><input className="form-input" required placeholder="e.g. Fresh Foods Supply" value={supplierName} onChange={e => setSupplierName(e.target.value)} /></label>
                  <label className="form-group"><span className="form-label">Product category</span><select className="form-select" value={supplierCategory} onChange={e => setSupplierCategory(e.target.value)}>{categoryNames.map(c => <option key={c}>{c}</option>)}</select></label>
                  <label className="form-group"><span className="form-label">Contact number</span><input className="form-input" type="tel" inputMode="numeric" pattern="0[0-9]{10}" maxLength={11} required title="Enter 11 digits starting with 0" placeholder="e.g. 03001234567" value={supplierPhone} onChange={e => setSupplierPhone(e.target.value.replace(/\D/g, "").slice(0, 11))} /></label>
                  <button className="btn btn-primary" type="submit" disabled={loading.suppliers}>{loading.suppliers ? "Saving…" : "+ Add supplier"}</button>
                </form>
              </section>
              <section className="supplier-directory"><div className="relationship-section-heading"><div><h2>Suppliers & matching stock</h2><p>Category matches are based on the product catalogue.</p></div></div>
                {suppliers.length ? <div className="supplier-card-grid">{suppliers.map(s => {
                  const matchingProducts = products.filter(product => product.category === s.category || Number(product.supplierId) === Number(s.id)).sort((a, b) => a.stock - b.stock);
                  return <article className="card supplier-record" key={s.id}><div className="supplier-record-head"><div className="avatar avatar-md supplier-avatar">{s.name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase()}</div><div className="supplier-record-main"><strong>{s.name}</strong><a href={`tel:${s.phone}`}><small>{s.phone || "Contact not provided"}</small></a></div><button className="icon-btn delete" title="Delete supplier" onClick={() => deleteSupplier(s.id)} aria-label={`Delete ${s.name}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button></div><div className="supplier-record-category"><span className="badge badge-purple">{s.category}</span><span>{matchingProducts.length} matching product{matchingProducts.length === 1 ? "" : "s"}</span></div><div className="supplier-product-list">{matchingProducts.length ? matchingProducts.slice(0, 4).map(product => <div className="supplier-product-row" key={product.id}><div><strong>{product.name}</strong><small>{product.stock} in stock · {Number(product.supplierId) === Number(s.id) ? "linked supplier" : "category match"}</small></div>{product.stock <= 10 ? <button className="btn btn-secondary btn-sm" onClick={() => { setRestockTarget(product); setRestockQuantity(""); setRestockSupplierId(String(s.id)); }}>Restock</button> : <span className="supplier-stock-ok">In stock</span>}</div>) : <p className="supplier-no-match">No products in this category yet. Add matching products in Products to link them here.</p>}</div></article>;
                })}</div> : <div className="card relationship-empty"><div>⇄</div><strong>No suppliers yet</strong><span>Add suppliers to keep category-specific product contacts and restock actions together.</span></div>}
              </section>
            </div>
          )}

          {/* Analytics */}
          {page === "Analytics" && (
            <>
              <section className="stat-grid" aria-label="Analytics metrics">
                <StatCard label="RECORDED REVENUE" value={money(revenue)} detail="From completed sales" icon="💰" tone="green" />
                <StatCard label="AVERAGE SALE" value={money(sales.length ? revenue / sales.length : 0)} detail="Revenue divided by sales" icon="📊" tone="blue" />
                <StatCard label="CUSTOMERS" value={customers.length} detail="Registered customers" icon="👥" tone="purple" />
                <StatCard label="PRODUCTS" value={products.length} detail="In catalogue" icon="📦" tone="orange" />
              </section>
              <section className="card animate-fade-in">
                <div className="card-header">
                  <div className="card-header-content">
                    <h2>Weekly Sales Trend</h2>
                    <p>Based on actual sales data</p>
                  </div>
                </div>
                <div className="card-body">
                  <div className="bar-chart large-chart" role="img" aria-label="Weekly sales chart">
                    {weeklySalesActual.map((d) => (
                      <div key={d.day} className="bar-column" title={`${d.day}: ${money(d.amount)}`}>
                        <div className="bar-track">
                          <div className="bar" style={{ height: `${d.amount ? Math.max(5, d.amount / Math.max(...weeklySalesActual.map(item => item.amount), 1) * 100) : 0}%` }} />
                        </div>
                        <span>{d.day}</span>
                        <small>{money(d.amount)}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* Reports */}
          {page === "Reports" && (
            <div className="reports-page animate-fade-in">
              <section className="reports-hero">
                <div><span className="reports-eyebrow">BUSINESS SNAPSHOT</span><h2>Reports & performance</h2><p>A clear view of recorded sales and current stock.</p></div>
                <div className={`reports-source ${apiStatus.toLowerCase().includes("unavailable") ? "offline" : ""}`}><i />{apiStatus.toLowerCase().includes("unavailable") ? "Demo data" : apiStatus.toLowerCase().includes("connected") ? "Live database" : "Updating data"}</div>
              </section>

              <section className="reports-metrics" aria-label="Report summary">
                <article className="report-metric"><span className="report-metric-label">RECORDED REVENUE</span><strong>{money(revenue)}</strong><small>Across {sales.length} recorded {sales.length === 1 ? "order" : "orders"}</small><span className="report-metric-icon">↗</span></article>
                <article className="report-metric"><span className="report-metric-label">AVERAGE ORDER</span><strong>{money(sales.length ? revenue / sales.length : 0)}</strong><small>Average value per recorded order</small><span className="report-metric-icon">◉</span></article>
                <article className="report-metric"><span className="report-metric-label">INVENTORY VALUE</span><strong>{money(inventoryValue)}</strong><small>Current stock at listed prices</small><span className="report-metric-icon">▦</span></article>
                <article className="report-metric"><span className="report-metric-label">RESTOCK WATCH</span><strong>{lowStock.length}</strong><small>{outOfStock} out of stock · {stockUnits.toLocaleString()} units on hand</small><span className="report-metric-icon">!</span></article>
              </section>

              <section className="reports-grid">
                <article className="card report-panel">
                  <div className="report-panel-header"><div><h2>Recent sales</h2><p>Latest recorded transactions</p></div><button className="btn btn-ghost btn-sm" onClick={() => handleNavClick("Sales & Orders")}>View all</button></div>
                  {sales.length ? <div className="table-wrap"><table className="report-table"><thead><tr><th style={{ width: '20%' }}>ORDER</th><th style={{ width: '30%' }}>CUSTOMER</th><th style={{ width: '20%' }}>DATE</th><th style={{ width: '30%' }}>TOTAL</th></tr></thead><tbody>{sales.slice(0, 5).map(sale => <tr key={sale.id}><td><strong>{sale.id}</strong></td><td>{sale.customer}</td><td>{sale.date && !Number.isNaN(new Date(sale.date).getTime()) ? new Date(sale.date).toLocaleDateString() : sale.date || "—"}</td><td><strong>{money(sale.total)}</strong></td></tr>)}</tbody></table></div> : <div className="report-empty">No sales have been recorded yet.</div>}
                </article>

                <article className="card report-panel">
                  <div className="report-panel-header"><div><h2>Inventory health</h2><p>Products with the lowest stock</p></div><button className="btn btn-ghost btn-sm" onClick={() => handleNavClick("Inventory")}>Open inventory</button></div>
                  {products.length ? <div className="report-product-list">{[...products].sort((a, b) => a.stock - b.stock).slice(0, 5).map(product => <div className="report-product-row" key={product.id}><div className="report-product-initial">{product.name.slice(0, 1).toUpperCase()}</div><div className="report-product-copy"><strong>{product.name}</strong><small>{product.category} · {product.sku || `SKU-${product.id}`}</small></div><span className={`report-stock ${product.stock === 0 ? "empty" : product.stock <= 5 ? "low" : "healthy"}`}>{product.stock} left</span></div>)}</div> : <div className="report-empty">No inventory records are available.</div>}
                </article>

                <article className="card report-panel">
                  <div className="report-panel-header"><div><h2>Top-selling products</h2><p>Ranked by units in recorded sales</p></div></div>
                  {bestSellers.length ? <div className="report-product-list">{bestSellers.map((product, index) => <div className="report-product-row" key={product.name}><div className="report-rank">{String(index + 1).padStart(2, "0")}</div><div className="report-product-copy"><strong>{product.name}</strong><small>{money(product.revenue)} in recorded sales</small></div><span className="report-stock healthy">{product.units} sold</span></div>)}</div> : <div className="report-empty">Product-level sales are not available yet. Complete a sale from the POS to build this report.</div>}
                </article>

                <article className="card report-panel report-export-panel">
                  <div className="report-panel-header"><div><h2>Export reports</h2><p>Download records for offline review.</p></div></div>
                  <div className="report-export-option"><div><strong>Sales detail</strong><small>Orders, customers, items, quantities, and totals.</small></div><button className="btn btn-primary" onClick={exportSales}>Export CSV</button></div>
                  <div className="report-export-option"><div><strong>Product inventory</strong><small>SKUs, categories, prices, and stock counts.</small></div><button className="btn btn-secondary" onClick={exportProducts}>Export CSV</button></div>
                </article>
              </section>
            </div>
          )}

          {/* Settings */}
          {page === "Expenses" && (
            <div className="module-page animate-fade-in">
              <section className="module-intro expense-intro"><span className="module-intro-icon">💳</span><div><h2>Business expenses</h2><p>Record operating costs to include them in the business profit and loss summary.</p></div><div className="relationship-intro-stat"><strong>{money(totalExpenses)}</strong><span>recorded expenses</span></div></section>
              <section className="card module-form-card"><div className="module-section-heading"><div><h2>{editingExpenseId ? "Edit expense" : "Add an expense"}</h2><p>Track utilities, rent, payroll, transport, and other costs.</p></div></div><form className="module-inline-form expense-form" onSubmit={saveExpense}><label className="form-group"><span className="form-label">Category</span><select className="form-select" value={expenseForm.category} onChange={event => setExpenseForm(old => ({ ...old, category: event.target.value }))}>{["Utilities", "Rent", "Salaries", "Transportation", "Maintenance", "Supplies", "Other"].map(item => <option key={item}>{item}</option>)}</select></label><label className="form-group"><span className="form-label">Description</span><input className="form-input" required value={expenseForm.description} onChange={event => setExpenseForm(old => ({ ...old, description: event.target.value }))} placeholder="e.g. November electricity bill" /></label><label className="form-group"><span className="form-label">Amount</span><input className="form-input" type="number" min="0.01" step="0.01" required value={expenseForm.amount} onChange={event => setExpenseForm(old => ({ ...old, amount: event.target.value }))} /></label><label className="form-group"><span className="form-label">Date</span><input className="form-input" type="date" required value={expenseForm.date} onChange={event => setExpenseForm(old => ({ ...old, date: event.target.value }))} /></label><label className="form-group"><span className="form-label">Payment method</span><select className="form-select" value={expenseForm.paymentMethod} onChange={event => setExpenseForm(old => ({ ...old, paymentMethod: event.target.value }))}>{["Cash", "Card", "Digital", "Bank transfer"].map(item => <option key={item}>{item}</option>)}</select></label><button className="btn btn-primary" disabled={loading.expenses}>{loading.expenses ? "Saving…" : editingExpenseId ? "Save changes" : "Add expense"}</button>{editingExpenseId && <button type="button" className="btn btn-secondary" onClick={() => { setEditingExpenseId(null); setExpenseForm({ category: "Utilities", description: "", amount: "", paymentMethod: "Cash", date: new Date().toISOString().slice(0, 10) }); }}>Cancel</button>}</form></section>
              <section className="card module-table-card"><div className="module-section-heading"><div><h2>Expense history</h2><p>Search and maintain recorded outgoings.</p></div><label className="relationship-search"><span className="sr-only">Search expenses</span><input className="form-input" placeholder="Search expenses…" value={query} onChange={event => setQuery(event.target.value)} /></label></div><div className="table-wrap"><table><thead><tr><th style={{ width: '12%' }}>DATE</th><th style={{ width: '12%' }}>CATEGORY</th><th style={{ width: '30%' }}>DESCRIPTION</th><th style={{ width: '12%' }}>METHOD</th><th style={{ width: '14%' }}>AMOUNT</th><th style={{ width: '20%' }}>ACTIONS</th></tr></thead><tbody>{expenses.filter(expense => `${expense.category} ${expense.description} ${expense.paymentMethod}`.toLowerCase().includes(query.toLowerCase())).map(expense => <tr key={expense.id}><td>{new Date(expense.date).toLocaleDateString()}</td><td>{expense.category}</td><td>{expense.description}</td><td>{expense.paymentMethod}</td><td><strong>{money(expense.amount)}</strong></td><td className="actions-cell"><button className="icon-btn" title="Edit expense" onClick={() => { setEditingExpenseId(expense.id); setExpenseForm({ category: expense.category, description: expense.description, amount: String(expense.amount), paymentMethod: expense.paymentMethod, date: new Date(expense.date).toISOString().slice(0, 10) }); }}>✎</button><button className="icon-btn delete" title="Delete expense" onClick={() => deleteExpense(expense.id)}>×</button></td></tr>)}</tbody></table>{expenses.length === 0 && <div className="relationship-empty"><div>💳</div><strong>No expenses recorded</strong><span>Add expenses to include operating costs in reports.</span></div>}</div></section>
            </div>
          )}

          {/* Settings */}
          {page === "Settings" && (
            <div className="settings-page animate-fade-in">
              <section className="settings-hero">
                <div className="settings-hero-mark" aria-hidden="true">⚙</div>
                <div>
                  <span className="settings-eyebrow">WORKSPACE PREFERENCES</span>
                  <h2>Make SmartStore yours</h2>
                  <p>Manage your store profile, display preferences, and account.</p>
                </div>
              </section>

              <div className="settings-grid">
                <section className="card settings-panel">
                  <div className="settings-panel-heading"><div className="settings-panel-icon">🏪</div><div><h2>Store profile</h2><p>Set the details shown across your workspace.</p></div></div>
                  <div className="settings-fields">
                    <label className="settings-field"><span>Store name</span><input className="form-input" value={storeName} maxLength={48} onChange={e => setStoreName(e.target.value)} placeholder="Enter your store name" /><small>Appears in the navigation and store documents.</small></label>
                    <label className="settings-field"><span>Display currency</span><select className="form-select" value={storeCurrency} onChange={e => setStoreCurrency(e.target.value)}><option value="PKR">PKR · Pakistani rupee</option><option value="USD">USD · US dollar</option><option value="EUR">EUR · Euro</option><option value="GBP">GBP · British pound</option></select><small>Used for prices throughout the app.</small></label>
                  </div>
                </section>

                <section className="card settings-panel">
                  <div className="settings-panel-heading"><div className="settings-panel-icon">🎨</div><div><h2>Appearance</h2><p>Choose a comfortable workspace theme.</p></div></div>
                  <div className="settings-choice-row"><div className="settings-choice-copy"><strong>Dark theme</strong><span>Reduce brightness across the workspace.</span></div><label className="toggle"><input type="checkbox" checked={theme === "dark"} onChange={() => setTheme(current => current === "light" ? "dark" : "light")} aria-label="Enable dark theme" /><span className="toggle-slider" /></label></div>
                  <div className="settings-theme-preview" aria-label="Choose workspace theme"><button type="button" className={`theme-preview theme-preview-light ${theme === "light" ? "active" : ""}`} onClick={() => setTheme("light")} aria-label="Use light theme" aria-pressed={theme === "light"}><i /><i /><i /></button><button type="button" className={`theme-preview theme-preview-dark ${theme === "dark" ? "active" : ""}`} onClick={() => setTheme("dark")} aria-label="Use dark theme" aria-pressed={theme === "dark"}><i /><i /><i /></button></div>
                  <div className="accent-picker"><strong>Interface color</strong><span>Choose an accent for buttons, highlights, and data details.</span><div>{[["ocean", "Ocean"], ["jade", "Jade"], ["violet", "Violet"], ["rose", "Rose"], ["amber", "Amber"]].map(([key, label]) => <button key={key} type="button" className={`accent-swatch accent-${key} ${accent === key ? "selected" : ""}`} onClick={() => setAccent(key)} aria-label={`${label} interface color`} aria-pressed={accent === key}><i />{label}</button>)}</div><strong className="custom-color-label">Custom color</strong><span>Pick a shade from the color grid or choose an exact color.</span><div className="custom-color-controls"><div className="color-grid" role="group" aria-label="Choose a custom interface color">{[0, 15, 30, 45, 60, 75, 90, 120, 150, 180, 210, 240, 270, 300, 330].flatMap(hue => [35, 50, 65, 80].map(light => { const color = `hsl(${hue} 78% ${light}%)`; return <button key={`${hue}-${light}`} type="button" style={{ backgroundColor: color }} className={accent === "custom" && customAccent === color ? "selected" : ""} aria-label={`Choose ${color}`} title={color} onClick={() => { setCustomAccent(color); setAccent("custom"); }} />; }))}</div><label className="custom-color-input"><input type="color" value={customAccent.startsWith("#") ? customAccent : "#0ea5e9"} onChange={event => { setCustomAccent(event.target.value); setAccent("custom"); }} /><span>Choose any color</span></label></div></div>
                </section>

                <section className="card settings-panel">
                  <div className="settings-panel-heading"><div className="settings-panel-icon">🗂️</div><div><h2>Data & exports</h2><p>Take a local snapshot of the data currently loaded in this workspace.</p></div></div>
                  <div className="settings-data-summary"><div><strong>{products.length}</strong><span>Products</span></div><div><strong>{customers.length}</strong><span>Customers</span></div><div><strong>{suppliers.length}</strong><span>Suppliers</span></div><div><strong>{sales.length}</strong><span>Orders</span></div></div>
                  <div className="settings-export-row"><div><strong>Export store data</strong><small>Downloads products, customers, suppliers, and sales as JSON.</small></div><button className="btn btn-secondary" onClick={exportAllData}>Export JSON</button></div>
                </section>

                <section className="card settings-panel">
                  <div className="settings-panel-heading"><div className="settings-panel-icon">👤</div><div><h2>Account</h2><p>Signed-in workspace profile.</p></div></div>
                  <div className="settings-account"><div className="avatar avatar-lg user-avatar">{userInitials}</div><div className="settings-account-copy"><strong>{user?.username || "Store Admin"}</strong><span>{user?.email || ""}</span><small>{user?.role === "admin" ? "Administrator" : user?.role === "manager" ? "Manager" : "Cashier"}</small></div></div>
                  <button className="btn btn-danger settings-signout" onClick={logout}>Sign out</button>
                </section>

                <section className="settings-about"><span>SMARTSTORE POS</span><span>Version 2.0.0</span><span className="settings-about-status"><i /> {apiStatus}</span></section>
              </div>
            </div>
          )}
        </div>
      </main>

      {restockTarget && (
        <div className="modal-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !loading.products) setRestockTarget(null); }}>
          <section className="restock-dialog" role="dialog" aria-modal="true" aria-labelledby="restock-title">
            <div className="restock-dialog-heading"><div className="relationship-intro-icon">＋</div><button type="button" className="icon-btn" aria-label="Close restock dialog" onClick={() => setRestockTarget(null)} disabled={loading.products}>×</button></div>
            <h2 id="restock-title">Restock existing product</h2>
            <p className="restock-product-name">{restockTarget.name} <span>· {restockTarget.category}</span></p>
            <div className="restock-current"><span>Current stock</span><strong>{restockTarget.stock} units</strong></div>
            <form onSubmit={submitRestock}>
              <label className="settings-field"><span>Units to add</span><input autoFocus className="form-input" type="number" min="1" step="1" required value={restockQuantity} onChange={event => setRestockQuantity(event.target.value)} placeholder="Enter quantity" /><small>This updates the stock on this product record; it will not create a duplicate product.</small></label>
              <label className="settings-field restock-supplier-field"><span>Supplier</span><select className="form-select" value={restockSupplierId} onChange={event => setRestockSupplierId(event.target.value)}><option value="">Keep current supplier link</option>{suppliers.filter(supplier => supplier.category === restockTarget.category).map(supplier => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><small>Choose who supplied this restock to link the product to that supplier.</small></label>
              <div className="restock-dialog-actions"><button type="button" className="btn btn-secondary" onClick={() => setRestockTarget(null)} disabled={loading.products}>Cancel</button><button type="submit" className="btn btn-primary" disabled={loading.products}>{loading.products ? "Updating…" : "Update stock"}</button></div>
            </form>
          </section>
        </div>
      )}

      {/* Mobile Menu Button */}
      <button
        className="mobile-menu-btn"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
        style={{ display: "none" }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
    </div>
  );
}

// Wrap with providers
export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
