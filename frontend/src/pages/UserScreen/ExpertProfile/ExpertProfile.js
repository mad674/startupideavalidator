import React, { useState } from "react";
import "./ExpertProfile.css";
import { useParams } from "react-router-dom";
import { useToast } from "../../../components/Popups/Popup";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
const ExpertProfile = () => {
    let {expertid,ideaid} = useParams();
    expertid = atob(expertid);
    ideaid = atob(ideaid);
    const token = localStorage.getItem("token");
    const [expert, setExpert] = useState({});
    const { showToast } = useToast();
    const navigate = useNavigate();
    useEffect(() => {
        fetchExpert();
      }, [token, expertid]);
    
    const fetchExpert = async () => {
          try {
            const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/getoneexpert/${expertid}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if(!res.ok){
                 throw new Error("Network response was not ok");
            }
            const data = await res.json();  
            if(!data.success){
                showToast(data.message || "Failed to fetch expert details");
            }
            // alert(JSON.stringify(data));
            setExpert(data.expert || {});
            } catch (err) {
                console.error("Error fetching expert details:", err);
            }
        };
    const onConnect = async () => {
       try {
          if(!window.confirm(`Are you sure want to share your idea with ${expert.name}`)) return ;
           const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/connect/${expertid}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ ideaId: ideaid}),
              });
              const data = await res.json();
            if (!data.success) {
              showToast(data.message || "Failed to connect expert.");
              return;
            } 
            showToast("Expert connected successfully", true);
            navigate(`/ExpertSelection/${btoa(ideaid)}`);
       }catch(err){
           showToast("Error connecting to expert");
       }
    };
  return (
    <div className="expert-profile">
      <h2>Expert Profile</h2>
      <p><b>Name:</b> {expert.name}</p>
      <p><b>Email:</b> {expert.email}</p>
      <p><b>Expertise:</b> {expert.expertise}</p>
      <p><b>Bio:</b> {expert.bio}</p>
      <button className="connect-btn" onClick={() => onConnect(expert)}>
        Tap to Connect ...
      </button>
    </div>
  );
};

export default ExpertProfile;
