import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import { useToast } from "../../../components/Popups/Popup";
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {showToast} = useToast();
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      // console.log(data);
      if (data.success) {
        showToast(data.message,data.success);
        navigate(`/reset-password/${btoa(data.userId)}`); // navigate to reset page with userId
      } else {
        showToast(data.message || "Failed to send OTP",data.success);
      }
    } catch (err) {
      console.error(err);
      showToast("Server error",false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Forgot Password</h2>
      <p className="forgot-subtitle">
          Enter your registered email to receive a one-time password (OTP).
        </p>
      <form onSubmit={handleRequestOTP} className="forgot-password-form">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Sending OTP..." : "Send OTP"}
        </button>
      </form>
    </div>
  );
}
