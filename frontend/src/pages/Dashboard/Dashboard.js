import React, { useEffect, useState } from "react";
import { Link, redirect, useNavigate } from "react-router-dom";

function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Compare exp (in seconds) with current time (in seconds)
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // invalid token
  }
}

export default function Dashboard() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    if (!sessionStorage.getItem("sessionExpired")) {
      alert("Your session has expired. Please log in again.");
      sessionStorage.setItem("sessionExpired", "true");
    }
    localStorage.removeItem("token");
    logout();
    navigate("/login", { replace: true });
    return null; // 🚫 Don't render Dashboard
  }
  useEffect(() => {
  async function fetchIdeas() {
    setLoading(true);

    let uid;
    try {
      uid = JSON.parse(atob(token.split(".")[1])).id;
      setUserId(uid);
    } catch {
      alert("Invalid token");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/allideas/${uid}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        setIdeas(data);
      }
    } catch (error) {
      alert("Error fetching ideas");
    } finally {
      setLoading(false);
    }
  }

  fetchIdeas();
}, [navigate]);


  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <div style={{ position: "absolute", top: "5px", right: "20px" }}>
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png" // Place your icon in public folder
          alt="Profile"
          style={{ width: "40px", height: "40px", borderRadius: "50%", cursor: "pointer",backgroundColor:"white" }}
          onClick={() => navigate(`/profile`)}
        />
      </div>

      <h1>Dashboard</h1>
      <p>Choose an action:</p>
      <div style={{ marginTop: "20px" }}>
        <Link to="/create">
          <button style={{ marginRight: "10px" }}>Create Idea</button>
        </Link>
      </div>

      <h2 style={{ marginTop: "40px" }}>Your Ideas</h2>

      {loading ? (
        <p>Loading ideas...</p>
      ) : ideas.length === 0 ? (
        <p>No ideas found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {ideas.map((idea) => (
            <li key={idea._id} style={{ marginBottom: "15px" }}>
              <Link to={`/ideas/${btoa(idea._id)}`} style={{ textDecoration: "none" }}>
                <div
                  style={{
                    border: "1px solid #ccc",
                    padding: "10px",
                    borderRadius: "5px",
                    cursor: "pointer",
                    maxWidth: "400px",
                    margin: "0 auto",
                    textAlign: "left",
                  }}
                >
                  <h3>{idea.data.name}</h3>
                  <p>
                    Average Score:{" "}
                    {idea.score["Average Score"] == null ? 0 : idea.score["Average Score"]}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
