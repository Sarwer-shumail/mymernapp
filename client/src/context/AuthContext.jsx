import { useState } from "react";
import axios from "axios";
import { AuthContext } from "./AuthContextStore.js";

const API_BASE = `${import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:5000`}/api`;

function readSavedUser() {
  const token = localStorage.getItem("pos_token");
  const savedUser = localStorage.getItem("pos_user");
  if (!token || !savedUser) return null;
  try {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    delete axios.defaults.headers.common["Authorization"];
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSavedUser);
  const loading = false;

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
    const { token, ...userData } = res.data;

    localStorage.setItem("pos_token", token);
    localStorage.setItem("pos_user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);

    return userData;
  };

  const register = async (username, email, password, role = "cashier") => {
    const res = await axios.post(`${API_BASE}/auth/register`, { username, email, password, role });
    const { token, ...userData } = res.data;

    localStorage.setItem("pos_token", token);
    localStorage.setItem("pos_user", JSON.stringify(userData));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(userData);

    return userData;
  };

  const logout = () => {
    localStorage.removeItem("pos_token");
    localStorage.removeItem("pos_user");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
