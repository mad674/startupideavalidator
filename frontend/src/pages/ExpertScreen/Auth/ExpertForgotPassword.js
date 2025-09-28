import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ExpertForgotPassword.css";
import { useToast } from "../../../components/Popups/Popup";

export default function ExpertForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(data.message, true);
        navigate(`/expert/reset-password/${btoa(data.expertId)}`);
      } else {
        showToast(data.message || "Failed to send OTP", false);
      }
    } catch (err) {
      console.error(err);
      showToast("Server error", false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
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
            className="form-control"
            required
          />
          <button 
            type="submit" 
            className="forgot-password-button" 
            disabled={loading}
          >
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}

