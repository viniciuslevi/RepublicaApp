import React, { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";
import { onSessionExpired } from "../services/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // Restaura a sessão salva (se houver) ao abrir o app
  useEffect(() => {
    let mounted = true;
    authService.getStoredSession().then((session) => {
      if (mounted && session) {
        setUser(session.user);
      }
      if (mounted) setIsBootstrapping(false);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Se o refreshToken também expirar/for revogado, o apiClient avisa por aqui
  useEffect(() => {
    return onSessionExpired(() => {
      setUser(null);
    });
  }, []);

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
    authService.logout();
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isBootstrapping,
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
