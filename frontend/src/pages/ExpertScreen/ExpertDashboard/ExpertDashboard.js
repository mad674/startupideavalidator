
import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "../../../components/Popups/Popup";
import "./ExpertDashboard.css";

const ExpertDashboard = () => {
  const session = JSON.parse(localStorage.getItem("expertSession"));
  const token = `Bearer ${session?.token}`;
  const expertId = session?.expertId;
  const [ideas, setIdeas] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    if (!expertId || !token) {
      navigate("/expert/login");
      return;
    }
    fetchIdeas();
  }, []);

  const fetchIdeas = async () => {
  setLoading(true);
  try {
    // Fetch all ideas for this expert
    const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/getideas/${expertId}`, {
      headers: { Authorization: token },
    });
    const data = await res.json();

    if (!data.success) {
      showToast(data.message || "Failed to fetch ideas");
      setLoading(false);
      return;
    }

    // Fetch expert's own ideas with chat history
    const myIdeas = await getmydata(); // await here!
    // alert(JSON.stringify(myIdeas));
    // Merge chat info
    const updatedIdeas = data.ideas.map((idea) => {
      const myIdea = myIdeas.find((mi) => mi.ideaid === idea._id);
      if (myIdea) {
        // alert(JSON.stringify(myIdea));
        const lastMessage = myIdea.chathistory?.[myIdea.chathistory.length - 1];
        if (lastMessage && lastMessage.sender === "user") {
          idea["received"] = "Got a message!!!";
        }
      }
      return idea;
    });

    setIdeas(updatedIdeas || []);
    console.log(JSON.stringify(updatedIdeas || []));
  } catch (err) {
    console.error(err);
  }
  setLoading(false);
};

const getmydata = async () => {
  try {
    const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/getoneexpert/${expertId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!data.success) {
      showToast(data.message || "Failed to fetch profile");
      return [];
    }
    return data.expert.ideas || [];
  } catch (err) {
    console.error("Error fetching profile:", err);
    return [];
  }
};

  const logoutdashboard = () => {
    localStorage.removeItem("expertSession");
    navigate("/expert/login", { replace: true });
  };

const disconnectIdea = async (ideaId) => {
    if (!window.confirm("Are you sure you want to disconnect this Idea?")) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/expert/disconnect/${ideaId}/${expertId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) return showToast(data.message);

      showToast("Idea disconnected successfully ✅", true);

      window.location.reload();
    } catch (err) {
      console.error("Error disconnecting expert:", err);
      showToast("Something went wrong");
    }
  };
  const deleteExpert = async () => {
    if (!window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/delete/${expertId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      const data = await res.json();
      if (!data.success) return showToast(data.message);
      showToast("Account deleted successfully", true);
      logoutdashboard();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredIdeas = ideas.filter((i) =>
    i.data.name.toLowerCase().includes(search.toLowerCase())
  );

  // --- Selected Idea View ---
  if (selectedIdea) {
    return (
      <div className="expert-dashboard">
        <button className="btn secondary" onClick={() => setSelectedIdea(null)}>
          ← Back to Ideas
        </button>
        <h2>{selectedIdea.data.name}</h2>
        <p><b>Problem:</b> {selectedIdea.data.problem_statement}</p>
        <p><b>Solution:</b> {selectedIdea.data.solution}</p>
        <p><b>Target Market:</b> {selectedIdea.data.target_market}</p>
        <p><b>Business Model:</b> {selectedIdea.data.business_model}</p>
        <p><b>Team:</b> {selectedIdea.data.team}</p>

        <div className="meta">
          <h2>AI Score:</h2>
          <strong>Technical Feasibility: </strong>{selectedIdea.score["Technical Feasibility"] ?? "—"} / 5 <br/>
          <strong>Market Size: </strong>{selectedIdea.score["Market Size"] ?? "—"} / 5 <br/>
          <strong>Revenue Model: </strong>{selectedIdea.score["Revenue Model"] ?? "—"} / 5 <br/>
          <strong>Uniqueness: </strong>{selectedIdea.score["Uniqueness"] ?? "—"} / 5 <br/>
          <strong>Team Strength: </strong>{selectedIdea.score["Team Strength"] ?? "—"} / 5 <br/>
          <strong>Average Score: </strong>{selectedIdea.score["Average Score"] ?? "—"} / 5 <br/>
          <strong>Overall Viability: </strong>{selectedIdea.score["Overall Viability"] ?? "Not available"} <br/>
        </div>

        <div className="idea-actions">
          <Link to={`/expert/chat/${btoa(selectedIdea._id)}`} className="btn primary">
            Chat
          </Link>
          <button className="btn danger" onClick={() => disconnectIdea(selectedIdea._id)}>
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  // --- Ideas List View ---
  return (
    <div className="expert-dashboard">
      <h2>Expert Dashboard</h2>
      <div className="idea-actions">
        <input
          type="text"
          placeholder="Search ideas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="feedback-box"
          style={{ maxWidth: "250px" }}
        />

        <div className="idea-actions">
          <Link to="/expert/profile" className="btn secondary">
            Profile
          </Link>
          <button className="btn danger" onClick={logoutdashboard}>
            Logout
          </button>
          <button className="btn danger" onClick={deleteExpert}>
            Delete Account
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading ideas...</p>
      ) : (
        <ul className="idea-list">
          {filteredIdeas.map((idea) => (
            <li
              key={idea._id}
              className="idea-card"
              onClick={() => setSelectedIdea(idea)}
            >
              {idea["received"]!=undefined && <span className="received-message">Got a message!!!</span>}
              <h3>{idea.data.name}</h3>
              <p>Score: {idea.score["Average Score"]}</p>
            </li>
          ))}
          {filteredIdeas.length === 0 && <p>No ideas found.</p>}
        </ul>
      )}
    </div>
  );
};

export default ExpertDashboard;
