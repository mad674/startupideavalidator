import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Register({ onLogin }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Registration successful");
        // localStorage.setItem("token", data.token);
        onLogin(data.token); 
        navigate("/dashboard");
      } else {
        alert(data.message || "Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Register</h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: "inline-block", textAlign: "left" }}
      >
        <div style={{ marginTop: "10px" }}>
          <label>Email: </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            placeholder="Enter your email address"
          />
        </div>
        <div style={{ marginTop: "10px" }}>
          <label>Password: </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            placeholder="create a secure password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{ marginTop: "20px", width: "100%" }}
        >
          {loading ? "Registering..." : "Register"}
        </button>
        <Link to="/login" style={{ display: "block", marginTop: "10px" }}>
          Already have an account? Login
        </Link>
      </form>
    </div>
  );
}
