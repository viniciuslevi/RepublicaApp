import React, { createContext, useContext, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  async function login(email, password) {
    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }

  async function register(name, email, password, phone = "") {
    setIsLoading(true);
    try {
      const result = await authService.register(name, email, password, phone);
      if (result.success) {
        setUser(result.user);
      }
      return result;
    } finally {
      setIsLoading(false);
    }
  }

  function logout() {
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
