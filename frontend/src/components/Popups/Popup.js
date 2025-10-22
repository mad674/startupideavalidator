import React, { useState, useEffect, createContext, useContext } from "react";
import "./Popup.css";

// Simple Popup component
export default function Popup({ message, success = true, duration = 2500, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`popup ${success ? "popup-success" : "popup-error"}`}>
      {message}
    </div>
  );
}

// Create Context
const ToastContext = createContext();

// Hook to use context easily
export const useToast = () => useContext(ToastContext);

// Provider Component
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null);

  const showToast = (message, success = false, duration = 2500) => {
    setToast({ message, success, duration });
  };

  const hideToast = () => setToast(null);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Popup
          message={toast.message}
          success={toast.success}
          duration={toast.duration}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
};
