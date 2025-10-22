// src/pages/Auth/useAuth.js
import { useState, useEffect } from "react";

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );

  const login = (token) => {
    localStorage.setItem("token", token);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Sync state with localStorage
    setIsAuthenticated(!!localStorage.getItem("token"));
  }, []);

  return { isAuthenticated, login, logout };
}
