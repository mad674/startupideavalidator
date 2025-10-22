import React, { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Register.css";
import { useToast } from "../../../components/Popups/Popup";
export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const {showToast} = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (data.success) {
        showToast(data.message || "Registration successful",data.success);
        onLogin(data.token);
        navigate("/dashboard");
      } else {
        showToast(data.message || "Registration failed",data.success);
      }
    } catch (err) {
      console.error("Registration error:", err);
      showToast("Something went wrong",false);
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{
        localStorage.removeItem("adminSession");
        localStorage.removeItem("expertSession");
        if(localStorage.getItem("token")){ navigate("/dashboard");}
  },[navigate]);
  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Account</h2>
        <p className="register-subtitle">Sign up to access your dashboard</p>

        <form onSubmit={handleSubmit} className="register-form">
          <label>Email<span>*</span></label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="Enter your email"
          />

          <label>Password<span>*</span></label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            placeholder="Create a secure password"
          />

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>

          <p className="login-link">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
