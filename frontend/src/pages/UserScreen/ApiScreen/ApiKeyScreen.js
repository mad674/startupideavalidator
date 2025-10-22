
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

        setStatus(data.success ? "valid" : "missing");
      } catch (err) {
        console.error("API key check failed:", err);
        setStatus("missing");
      }
    };

    if (userId && token) checkKey();
    else setStatus("missing");
  }, [userId, token]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="flex flex-col items-center gap-4">
          {/* Animated Gradient Spinner */}
          <div className="w-12 h-12 rounded-full border-4 border-t-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-gray-700 font-medium text-lg animate-pulse">
            Checking your API key...
          </p>
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
