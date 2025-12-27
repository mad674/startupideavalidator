
import React, { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./Profile.css";
import { useToast } from "../../../components/Popups/Popup";
export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const {showToast}=useToast();
  // Fetch user data immediately without useEffect
  if (loading) {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/dashboard");
    } else {
      const id = JSON.parse(atob(token.split(".")[1])).id;
      fetch(`${process.env.REACT_APP_BACKEND}/user/getuserdetails/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .then((data) => {
            // console.log(data);
          setUser(data);
          setLoading(false);
        })
        .catch(() => {
          showToast("Error fetching user details");
          navigate("/dashboard");
        });
    }
  }

  if (loading) return <p className="loading-text">Loading profile...</p>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-image">
          <img
            src={user?.profilePicture || "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png"}
            alt="Profile"
          />
        </div>
        <div className="profile-details">
          {/* <h2>Name: {user.user.email.split("@")[0]}</h2> */}
          <p>
            <strong>Email:</strong> {user.user.email}
          </p>
        </div>
      </div>
    </div>
  );
}
