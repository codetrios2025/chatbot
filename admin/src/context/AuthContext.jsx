import React, { createContext, useContext, useState, useEffect } from "react";
import { adminApi } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("adminUser");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(
    () => localStorage.getItem("adminToken") || null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if session token exists on initial load
    const savedToken = localStorage.getItem("adminToken");
    const savedUser = localStorage.getItem("adminUser");
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await adminApi.login(email, password);
    if (res.success && res.token) {
      localStorage.setItem("adminToken", res.token);
      localStorage.setItem("adminUser", JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res.user;
    }
    throw new Error(res.message || "Authentication failed");
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        login,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
