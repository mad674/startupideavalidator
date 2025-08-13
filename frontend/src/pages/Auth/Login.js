  import React, { useState } from "react";
  import { useNavigate } from "react-router-dom";

  export default function Login({ onLogin }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: "", password: "" });

    const handleSubmit = async (e) => {
      e.preventDefault();

      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        const data = await res.json();

        if (data.success) {
          alert(data.message || "Login successful!");
          onLogin(data.token);
          navigate("/dashboard");
        } else {
          alert(data.message || "Login failed.");
        }
      } catch (error) {
        console.error("Error logging in:", error);
        alert("An error occurred while logging in.");
      }
    };

    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <h2>Login</h2>
        <form
          onSubmit={handleSubmit}
          style={{ display: "inline-block", textAlign: "left" }}
        >
          <div>
            <label>Email: </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="Enter your email"
            />
          </div>
          <div style={{ marginTop: "10px" }}>
            <label>Password: </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="Enter your password"
            />
          </div>
          <button type="submit" style={{ marginTop: "20px", width: "100%" }}>
            Login
          </button>
        </form>
      </div>
    );
  }
