import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/dashboard">🚀 AI Startup Validator</Link>
      </div>

      <div className="navbar-links">
        <Link
          to="/dashboard"
          className={location.pathname === "/dashboard" ? "active" : ""}
        >
          Dashboard
        </Link>
        {/* <Link
          to="/settings"
          className={location.pathname === "/settings" ? "active" : ""}
        >
          Settings
        </Link> */}
      </div>

      <div className="navbar-profile">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
          alt="Profile"
          className="profile-avatar"
          style={{backgroundColor: "white"}}
          onClick={() => setDropdownOpen(!dropdownOpen)}
        />
        {dropdownOpen && (
          <div className="profile-dropdown">
            <Link to="/profile" onClick={() => setDropdownOpen(false)}>Profile</Link>
            <Link to="/settings" onClick={() => setDropdownOpen(false)}>Settings</Link>
            <button onClick={onLogout}>Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}
