import React, { useEffect, useState } from "react";
import "./ExpertSelection.css";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../../components/Popups/Popup";

const ExpertSelection = () => {
  let { ideaid } = useParams();
  ideaid = atob(ideaid);
  const [expertSearch, setExpertSearch] = useState("");
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpert, setSelectedExpert] = useState([]);
  const token = localStorage.getItem("token");
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchExperts();
  }, [token]);

  const fetchExperts = async () => {
    try {
      const connected=await myexperts();

      const res = await fetch(`${process.env.REACT_APP_BACKEND}/expert/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!data.success) {
        showToast(data.message || "Failed to fetch experts");
      }

      const filteredExperts = data.experts.filter(
        (exp) => !connected.some((sel) => sel._id === exp._id)
      );

      setExperts(filteredExperts || []);
    } catch (err) {
      console.error("Error fetching experts:", err);
    } finally {
      setLoading(false);
    }
  };

  const myexperts = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/expert/getexpert/${ideaid}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();

      if (!data.success) {
        showToast(data.message || "Failed to fetch connected expert");
      }
      data.experts.forEach((expert) => {
            expert.ideas.forEach((idea) => {
                if (idea.ideaid.toString() === ideaid.toString()) {
                    const lastMessage = idea.chathistory[idea.chathistory.length - 1];
                    if (lastMessage!=undefined && lastMessage.sender === "expert") {
                        expert["received"] = "Got a message!!!";
                    }
                }
            });
      });
      if (data.experts) {
        setSelectedExpert(data.experts || []);
        return data.experts;
      }
    } catch (err) {
      console.error("Error fetching connected expert:", err);
    }
  };

  const disconnectExpert = async (expertId) => {
    if (!window.confirm("Are you sure you want to disconnect this expert?")) return;

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/expert/disconnect/${ideaid}/${expertId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (!data.success) return showToast(data.message);

      showToast("Expert disconnected successfully ✅", true);

      // Re-fetch updated lists
      window.location.reload();
    } catch (err) {
      console.error("Error disconnecting expert:", err);
      showToast("Something went wrong");
    }
  };
  const filteredExperts = experts.filter((expert) =>
    expert.expertise.toLowerCase().includes(expertSearch.toLowerCase())
    );
  if (loading) return <p>Loading experts...</p>;

  return (
    <div className="expert-selection">
      <h2>Connected Experts</h2>
      {selectedExpert.length === 0 ? (
        <p>No experts connected yet.</p>
      ) : (
        <div className="connected-expert-list">
          {selectedExpert.map((expert) => (
            <div key={expert._id} className="connected-expert-item">
              {expert.received && (
                <span className="received-message">{expert.received}</span>
                )}
              <p><b>Expert Name: </b>{expert.name}<br/>
              <b>Expertise: </b>{expert.expertise}<br/>
              <b>Email:</b>{expert.email}</p>
              <div className="btn-group">
                <button
                  onClick={() =>
                    navigate(`/ExpertChat/${btoa(expert._id)}/${btoa(ideaid)}`)
                  }
                  className="chat-btn"
                >
                  Chat
                </button>
                <button
                  className="disconnect-btn"
                  onClick={() => disconnectExpert(expert._id)}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

        <h2>Available Experts for Connection</h2>
      {/* Search input for expertise */}
    <input
      type="text"
      placeholder="Search by expertise..."
      value={expertSearch}
      onChange={(e) => setExpertSearch(e.target.value)}
      style={{
        padding: "10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        width: "250px",
        marginBottom: "15px",
      }}
    />

    {filteredExperts.length === 0 ? (
      <p>No experts available for connection.</p>
    ) : (
      <div className="expert-list">
        {filteredExperts.map((expert) => (
          <div key={expert._id} className="expert-item">
            <p><b>Name:</b> {expert.name}<br/>
            <b>Expertise:</b> {expert.expertise}</p>
            <button
              className="connect-btn"
              onClick={() =>
                navigate(`/ExpertProfile/${btoa(expert._id)}/${btoa(ideaid)}`)
              }
            >
              Connect my Idea
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
  );
};

export default ExpertSelection;
