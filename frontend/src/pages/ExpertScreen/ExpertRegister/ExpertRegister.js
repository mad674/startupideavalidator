import React, { useState } from "react";
import "./ExpertRegister.css";
import { useToast } from "../../../components/Popups/Popup";
import { useNavigate } from "react-router-dom";
const ExpertRegister = ({ onLogin }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    expertise: "",
    bio: "",
  });
//   const [message, setMessage] = useState("");
  const {showToast} = useToast();
    const navigate = useNavigate();
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message,data.success);
        onLogin({ expertId: data.expert.id, token:  `Bearer ${data.token }`});
        navigate("/expert/dashboard");
      } else {
        showToast(data.message || "Registration failed");
      }
    } catch (err) {
      showToast("Registration failed");
    }
  };

  return (
    <div className="expert-register">
      <h2>Expert Register</h2>
      <form onSubmit={handleSubmit} style={{background:'#fff',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',padding:'18px',marginTop:'12px',display:'flex',flexDirection:'column',gap:'14px'}}>
        <input name="name" placeholder="Full Name" onChange={handleChange} style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}} />
        <input name="email" placeholder="Email" onChange={handleChange} style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}} />
        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}}
        />
        <input name="expertise" placeholder="Expertise" onChange={handleChange} style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}} />
        <textarea
          name="bio"
          placeholder="Short Bio"
          rows="3"
          onChange={handleChange}
          style={{padding:'12px',borderRadius:'8px',border:'1px solid #bbb',fontSize:'1rem'}}
        />
        <button type="submit" style={{padding:'12px',borderRadius:'8px',border:'none',background:'linear-gradient(90deg,#43a047,#66bb6a)',color:'#fff',fontWeight:600,fontSize:'1rem',cursor:'pointer',boxShadow:'0 2px 8px rgba(67,160,71,0.12)',transition:'background 0.2s'}}>Register</button>
      </form>
      Alredy have an account? <a href="/expert/login" style={{color:'#43a047',textDecoration:'none',fontWeight:600}}>Login here</a>
      {/* {message && <p className="msg" style={{marginTop:'10px',color:'#444',textAlign:'center'}}>{message}</p>} */}
    </div>
  );
};

export default ExpertRegister;
