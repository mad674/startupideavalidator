import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ApiKeyScreen({ children }) {
  const [status, setStatus] = useState("loading");

  const token = localStorage.getItem("token");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : null;
  const location = useLocation();

  useEffect(() => {
    const checkKey = async () => {
      try {
        const res = await fetch(
          `${process.env.REACT_APP_BACKEND}/user/check_api_key/${userId}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Failed to check API key");
        const data = await res.json();

        if (data.success) {
          setStatus("valid");
        } else {
          setStatus("missing");
        }
      } catch (err) {
        console.error("API key check failed:", err);
        setStatus("missing");
      }
    };

    if (userId && token) {
      checkKey();
    } else {
      setStatus("missing");
    }
  }, [userId, token]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          {/* Spinner */}
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          {/* Text */}
          <p className="text-gray-600 font-medium">Checking API key...</p>
        </div>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <Navigate
        to="/api_key"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
