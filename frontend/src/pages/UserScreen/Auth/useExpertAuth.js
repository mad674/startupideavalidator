
import { useState, useEffect } from "react";

export default function useExpertAuth() {
  const [expertSession, setExpertSession] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("expertSession");
    if (stored) {
      setExpertSession(JSON.parse(stored));
    }
  }, []);

  const login = (sessionData) => {
    localStorage.setItem("expertSession", JSON.stringify(sessionData));
    setExpertSession(sessionData);
  };

  const logout = () => {
    localStorage.removeItem("expertSession");
    setExpertSession(null);
  };

  return { expertSession, login, logout };
}
