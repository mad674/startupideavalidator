import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuLinks = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Profile", path: "/profile" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar">
        <div className="navbar-left">
          <Link to="/dashboard" className="navbar-brand">
            🚀 AI Startup Validator
          </Link>
        </div>

        <div className="navbar-right">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            alt="Profile"
            className="profile-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          />
          {dropdownOpen && (
            <div className="profile-dropdown">
              <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                Profile
              </Link>
              <Link to="/settings" onClick={() => setDropdownOpen(false)}>
                Settings
              </Link>
              <button onClick={onLogout}>Logout</button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
