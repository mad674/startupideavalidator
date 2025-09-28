import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./ResetPassword.css";
import { useToast } from "../../../components/Popups/Popup";
export default function ResetPassword() {
  const { userId } = useParams(); // from route /reset-password/:userId
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {showToast} = useToast();
  const handleReset = async (e) => {
    e.preventDefault();
    if (otp.length !== 4) return showToast("OTP must be 4 digits",false);

    setLoading(true);
    try {
      // console.log(userId, otp, newPassword);
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/user/reset-password-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId:atob(userId), otp, newPassword }),
      });
      const data = await res.json();
      // console.log(data);
      if (data.success) {
        showToast(data.message || "Password reset successfully",data.success);
        navigate("/login");
      } else {
        showToast(data.message || "Failed to reset password",data.false);
      }
    } catch (err) {
      console.error(err);
      showToast("Server error",data.false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleReset} className="reset-password-form">
        <input
          type="text"
          placeholder="Enter 4-digit OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
