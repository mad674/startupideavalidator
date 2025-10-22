
import React, { useEffect, useState } from "react";
import "./ExpertChangeProfile.css";
import { useToast } from "../../../components/Popups/Popup";
import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
const ExpertChangeProfile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    expertise: "",
    bio: "",
  });
  const [loading, setLoading] = useState(false);
  const session = JSON.parse(localStorage.getItem("expertSession"));
  const token = `Bearer ${session?.token}`;
  const expertId = session?.expertId;
  const navigate = useNavigate();
  const { showToast } = useToast();
  if (!expertId || !token) {
    return <Navigate to="/expert/login" replace={true} />;
  }

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/getoneexpert/${expertId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if(!data.success){
          showToast(data.message || "Failed to fetch profile");
          return;
        }
        setProfile({
          name: data.expert.name || "",
          email: data.expert.email || "",
          expertise: data.expert.expertise || "",
          bio: data.expert.bio || "",
        });
        // alert(JSON.stringify(data.expert));
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, [token]);

  // Update profile
  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/updateprofile/${expertId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await res.json();
      // alert(JSON.stringify(data));
      if (data.success) {
        // alert("✅ Profile updated successfully");
        showToast("✅ Profile updated successfully", true);
        navigate("/expert/dashboard");
      } else {
        alert(`❌ Failed: ${data.message || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("❌ Error updating profile");
    }
    setLoading(false);
  };

  return (
    <div className="expert-profile">
      <h2>My Profile</h2>
      <div className="profile-details">
        <label>
          <strong>Name:</strong>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            className="profile-input"
          />
        </label>

        <label>
          <strong>Email:</strong>
          <input
            type="email"
            value={profile.email}
            disabled
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="profile-input disabled"
          />
        </label>

        <label>
          <strong>Expertise:</strong>
          <input
            type="text"
            value={profile.expertise}
            onChange={(e) => setProfile({ ...profile, expertise: e.target.value })}
            className="profile-input"
          />
        </label>

        <label>
          <strong>Bio:</strong>
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
            className="profile-input bio"
          />
        </label>

        <button
          onClick={handleUpdate}
          disabled={loading}
          className="update-btn"
        >
          {loading ? "Updating..." : "Update Profile"}
        </button>
      </div>
    </div>
  );
};

export default ExpertChangeProfile;
