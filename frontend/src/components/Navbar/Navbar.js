import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

export default function Navbar({ onLogout }) {
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);
      const menuLinks = [
        { name: "Dashboard", path: "/dashboard" },
        { name: "Profile", path: "/profile" },
        { name: "Settings", path: "/settings" }
      ];
      const [darkMode, setDarkMode] = useState(false);

      useEffect(() => {
        if (darkMode) {
          document.body.classList.add('dark-mode');
          document.body.style.backgroundColor = '#181818';
        } else {
          document.body.classList.remove('dark-mode');
          document.body.style.backgroundColor = '#fff';
        }
      }, [darkMode]);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Navbar */}
      <nav className={`navbar${darkMode ? ' navbar-dark' : ''}`}>
        <div className="navbar-left">
          <button
            className="hamburger"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <Link to="/dashboard" className="navbar-brand">
            🚀 AI Startup Idea Validator
          </Link>
        </div>

        <div className="navbar-right">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"
            alt="Profile"
            className="profile-avatar"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            aria-haspopup="true"
            aria-expanded={dropdownOpen}
          />
          {dropdownOpen && (
            <div className="profile-dropdown" ref={dropdownRef}>
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

      {/* Sidebar for mobile */}
      {sidebarOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <div
            className={`mobile-sidebar${darkMode ? ' sidebar-dark' : ''}`}
            style={{
              left: 0,
              top: 0,
              position: 'fixed',
              width: '240px',
              height: '100vh',
              background: darkMode ? '#222' : '#fff',
              color: darkMode ? '#f5f5f5' : '#333',
              boxShadow: '2px 0 16px rgba(0,0,0,0.18)',
              zIndex: 200,
              display: 'flex',
              flexDirection: 'column',
              padding: '2rem 1.2rem',
              gap: '1.2rem',
              transition: 'left 0.3s',
            }}
          >
            <div className="sidebar-header">
              <button className="close-sidebar" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" ><span className="sidebar-title">Menu</span></button>
            </div>
            <div className="sidebar-links">
              {menuLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={location.pathname === link.path ? "active" : ""}
                  onClick={() => setSidebarOpen(false)}
                  style={{
                    background: location.pathname === link.path ? '#2563eb' : (darkMode ? '#333' : '#f5f5f5'),
                    color: location.pathname === link.path ? '#fff' : (darkMode ? '#f5f5f5' : '#222'),
                    fontWeight: 600,
                    // width: '48px',
                    // height: '48px',
                    borderRadius: '50%',
                    fontSize: '1rem',
                    marginBottom: '0.5rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    // boxShadow: location.pathname === link.path ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
                    // border: location.pathname === link.path ? '2px solid #2563eb' : '2px solid transparent',
                    transition: 'background 0.2s, color 0.2s',
                  }}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            <button
              className="sidebar-logout"
              onClick={onLogout}
              style={{
                background: '#dc2626',
                color: '#fff',
                borderRadius: '50%',
                // width: '48px',
                // height: '48px',
                fontSize: '1.1rem',
                fontWeight: 700,
                marginTop: '2rem',
                cursor: 'pointer',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(220,38,38,0.15)',
                transition: 'background 0.2s, color 0.2s',
              }}
            > Logout
              <span style={{fontWeight:700}}>⎋</span>
            </button>
          </div>
        </>
      )}
    </>
  );
}
