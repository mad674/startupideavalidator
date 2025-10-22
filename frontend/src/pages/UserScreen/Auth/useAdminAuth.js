
import { useState, useEffect } from "react";

export default function useAdminAuth() {
  const [adminSession, setAdminSession] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("adminSession");
    if (stored) {
      setAdminSession(JSON.parse(stored));
    }
  }, []);

  const login = (sessionData) => {
    localStorage.setItem("adminSession", JSON.stringify(sessionData));
    setAdminSession(sessionData);
  };

  const logout = () => {
    localStorage.removeItem("adminSession");
    setAdminSession(null);
  };

  return { adminSession, login, logout };
}
