import React, { useState } from "react";
import "./Settings.css";

export default function Settings() {
  // const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [loading3, setLoading3] = useState(false);


  const token = localStorage.getItem("token");
  const userId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

  // Update user details
  async function handleUpdate() {
    if (!userId) return alert("User not found!");

    if (password && password !== confirmPassword) {
      return alert("Passwords do not match!");
    }
    if(password.length<=0){
      return alert("Password cannot be empty");
    }
    setLoading1(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/user/updateuserdetails/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({password }),
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(data.message || "New password updated successfully");
      } else {
        alert(data.message || "Failed to update user details");
      }
    } catch {
      alert("Error updating user");
    } finally {
      setLoading1(false);
    }
  }

  // Delete user account
  async function handleDeleteAccount() {
    if (!userId) return alert("User not found!");
    if (!window.confirm("Are you sure you want to delete your account?")) return;
    setLoading3(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/user/deleteuser/${userId}`,
        {
          method: "DELETE",
          headers: { "authorization": `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Account deleted successfully");
        localStorage.removeItem("token");
        // setIsAuthenticated(false); // ✅ instantly updates auth state
        // navigate("/login");   
        window.location.href = "/login";     // redirect after logout
      } else {
        setIsAuthenticated(false); // ✅ also handle invalid/expired token case
        alert(data.message || "Failed to delete account");
      }

    } catch {
      alert("Error deleting account");
    } finally {
      setLoading3(false);
    }
  }

  // Delete all user ideas
  async function handleDeleteAllIdeas() {
    if (!userId) return alert("User not found!");
    if (!window.confirm("This will delete ALL your ideas. Continue?")) return;
    setLoading2(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/deletealluserideas/${userId}`,
        {
          method: "DELETE",
          headers: { "authorization": `Bearer ${token}` },
        }
      );
      const data = await res.json();
      if (data.success) {
        alert(data.message || "Ideas deleted successfully");
      } else {
        alert(data.message || "Failed to delete ideas");
      }
    } catch {
      alert("Error deleting ideas");
    } finally {
      setLoading2(false);
    }
  }

  return (
    <div className="settings-page">
      <h2>Settings</h2>
      <div className="card">
        <h3>Update Password</h3>
        <input
          type="password"
          placeholder="New Password "
          value={password}
          required={true}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          required={true}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button onClick={handleUpdate} disabled={loading1}>
          {loading1 ? "Updating..." : "Update Password"}
        </button>

        <hr />

        <h3>Delete All My Ideas</h3>
        <button
          onClick={handleDeleteAllIdeas}
          className="delete-btn"
          disabled={loading2}
        >
          {loading2 ? "Deleting..." : "Delete All Ideas"}
        </button>

        <hr />

        <h3>Delete Account</h3>
        <button
          onClick={handleDeleteAccount}
          className="delete-btn"
          disabled={loading3}
        >
          {loading3 ? "Deleting..." : "Delete My Account"}
        </button>
      </div>
    </div>
  );
}
