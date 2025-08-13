import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchIdeas() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        alert("User not logged in");
        setLoading(false);
        return;
      }

      let userId;
      try {
        userId = JSON.parse(atob(token.split(".")[1])).id;
      } catch {
        alert("Invalid token");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND}/idea/allideas/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });
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
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
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
                    Average Score: {idea.score['Average Score']==null?0:idea.score['Average Score']}
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
