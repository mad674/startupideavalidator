
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/admin/adminlogin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username:email, password }),
      });
      const data = await res.json();
      console.log(data);
      if (res.ok) {
        // Save admin session info
        onLogin({ adminId: data.admin_id, token:  `Bearer ${data.token }`});
        navigate("/admindashboard");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error. Try again later.");
    }
  };
  useEffect(()=>{
      localStorage.removeItem("token");
      localStorage.removeItem("expertSession");
      if(localStorage.getItem("adminSession")){ navigate("/admindashboard");}
  },[navigate]);
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Admin Login</h2>
      {error && <div style={styles.error}>{error}</div>}
      <form style={styles.form} onSubmit={handleLogin}>
        <input
          type="text"
          placeholder="USERNAME"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="PASSWORD"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
    </div>
  );
};

const styles = {
  container: { maxWidth: "400px", margin: "50px auto", padding: "20px", border: "1px solid #ccc", borderRadius: "10px", textAlign: "center" },
  title: { marginBottom: "20px", color: "#333" },
  error: { color: "red", marginBottom: "15px" },
  form: { display: "flex", flexDirection: "column", gap: "10px" },
  input: { padding: "10px", fontSize: "16px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "10px", fontSize: "16px", borderRadius: "5px", border: "none", backgroundColor: "#007bff", color: "#fff", cursor: "pointer" },
};

export default AdminLogin;
