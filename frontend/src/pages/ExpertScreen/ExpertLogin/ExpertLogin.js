import React, { useState,useEffect } from "react";
import "./ExpertLogin.css";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../components/Popups/Popup";
import { GoogleLogin } from "@react-oauth/google";
// import {jwtDecode} from "jwt-decode";

const ExpertLogin = ({onLogin}) => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
    const {showToast} = useToast();
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ expertId: data.expert.id, token:  `Bearer ${data.token }`});
        showToast(data.message,data.success);
        navigate(`/expert/dashboard`);
      } else {
        showToast(data.message || "Login failed");
      }
    } catch (err) {
      showToast("Login failed");
    }
  };
  useEffect(()=>{
      setReady(true);
      localStorage.removeItem("token");
      localStorage.removeItem("adminSession");
      if(localStorage.getItem("expertSession")){navigate("/expert/dashboard");}
    },[navigate]);

  const handleSuccess = async (credentialResponse) => {
      const token = credentialResponse.credential;
  
      // Optionally decode on frontend
      // const userInfo = jwtDecode(token);
      // console.log("Google user:", userInfo);
  
      // Send token to backend
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
  
      const data = await res.json();
      // console.log("Backend response:", data);
      if (data.success) {
        onLogin({ expertId: data.expert.id, token:  `Bearer ${data.token }`});
        showToast(data.message,data.success);
        navigate(`/expert/dashboard`);
      } else {
        showToast(data.message || "Login failed");
      }
    };
  
  const handleError = () => {
    console.log("Login Failed");
  };
  return (
    <div className="expert-login">
      <h2>Expert Login</h2>
      <form onSubmit={handleSubmit} style={{background:'#fff',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',padding:'18px',marginTop:'12px',display:'flex',flexDirection:'column',gap:'14px'}}>
        <input name="email" placeholder="Email" onChange={handleChange} style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}} />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}}
        />
        <button type="submit" style={{padding:'12px',borderRadius:'8px',border:'none',background:'linear-gradient(90deg,#2196f3,#21cbf3)',color:'#fff',fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 2px 8px rgba(33,150,243,0.12)',transition:'background 0.2s'}}>Login</button>
        {ready &&process.env.REACT_APP_GOOGLE_CLIENT_ID && (
          <div style={{ filter: "hue-rotate(95deg) saturate(1)" }}>
            <GoogleLogin onSuccess={handleSuccess} onError={handleError} />
          </div>
        )}
        </form>
      Don’t have an account? <a href="/expert/register" style={{color:'#2196f3',textDecoration:'none',fontWeight:600}}>Register here</a>
      <br /><a href="/expert/forgot-password" style={{color:'#2196f3',textDecoration:'none',fontWeight:600}}>ForgotPassword </a>
      {message && <p className="msg" style={{marginTop:'10px',color:'#444',textAlign:'center'}}>{message}</p>}
    </div>
  );
};

export default ExpertLogin;
