import React, { useState,useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import { useToast } from "../../../components/Popups/Popup";
export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const { showToast } = useToast();
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (data.success) {
        showToast("🎉 Login successful! ",data.success);
        onLogin(data.token);
        navigate("/dashboard");
      } else {
        showToast(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Error logging in:", error);
      showToast("An error occurred while logging in.");
    }
  };
  useEffect(()=>{
        localStorage.removeItem("adminSession");
        localStorage.removeItem("expertSession");
        if(localStorage.getItem("token")){ navigate("/dashboard");}
  },[navigate]);
  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Welcome Back</h2>
        <p className="login-subtitle">Login to continue to your dashboard</p>

        <form onSubmit={handleSubmit} className="login-form">
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
            placeholder="Enter your password"
          />

          <button type="submit" className="login-btn">Login</button>

          <p className="register-link">
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
          <p className="forgot-link"><Link to="/forgot-password">Forgot Password?</Link></p>
        </form>
      </div>
    </div>
  );
}
