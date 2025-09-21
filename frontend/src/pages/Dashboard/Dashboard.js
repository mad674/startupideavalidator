import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { useToast } from "../../components/Popups/Popup";
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export default function Dashboard() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const {showToast}=useToast();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  if (!token || isTokenExpired(token)) {
    if (!sessionStorage.getItem("sessionExpired")) {
      showToast("Your session has expired. Please log in again.");
      sessionStorage.setItem("sessionExpired", "true");
    }
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
    return null;
  }

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      let uid;
      try {
        uid = JSON.parse(atob(token.split(".")[1])).id;
        setUserId(uid);
      } catch {
        showToast("Invalid token");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.REACT_APP_BACKEND}/idea/allideas/${uid}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        if (response.ok) setIdeas(data.reverse());
      } catch {
        showToast("Error fetching ideas");
      } finally {
        setLoading(false);
      }
    }

    fetchIdeas();
  }, [token]);

  return (
    <div className="dashboard-container">
      <h1>Dashboard</h1>

      <div className="dashboard-actions">
        <Link to="/create">
          <button className="action-btn">+ Create Idea</button>
        </Link>
      </div>

      <section className="ideas-section">
        <h2>Your Ideas</h2>
        {loading ? (
          <p className="info-text">Loading ideas...</p>
        ) : ideas.length === 0 ? (
          <p className="info-text">No ideas found.</p>
        ) : (
          <div className="ideas-grid">
            {ideas.map((idea) => (
              <Link
                to={`/ideas/${btoa(idea._id)}`}
                key={idea._id}
                className="idea-card"
              >
                <h3>{idea.data.name}</h3>
                <p>
                  Average Score:{" "}
                  {idea.score["Average Score"] == null
                    ? 0
                    : idea.score["Average Score"]+" / 5"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
