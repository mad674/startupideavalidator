import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ textAlign: "center", marginTop: "100px" }}>
      <h1>Welcome to Startup Idea Validator</h1>
      <p>Please login or register to continue</p>
      <div style={{ marginTop: "20px" }}>
        <Link to="/login">
          <button style={{ marginRight: "10px" }}>Login</button>
        </Link>
        <Link to="/register">
          <button>Register</button>
        </Link>
      </div>
    </div>
  );
}
