import React from "react";
import { Link } from "react-router-dom";

export default function Navbar({ onLogout }) {
  return (
    <nav style={{ background: "#333", padding: "10px", color: "#fff" }}>
      <Link to="/dashboard" style={{ color: "#fff", marginRight: "10px" }}>
        Dashboard
      </Link>
      <Link to="/settings" style={{ color: "#fff", marginRight: "10px" }}>
        Settings
      </Link>
      <button onClick={onLogout} style={{ background: "red", color: "#fff" }}>
        Logout
      </button>
    </nav>
  );
}
