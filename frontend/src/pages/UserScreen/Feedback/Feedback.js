import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./Feedback.css";
import { useToast } from "../../../components/Popups/Popup";
export default function Feedback() {
  const { id } = useParams();
  const decodedId = atob(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/getidea/${decodedId}`
      );
      const data = await res.json();

      if (!data) {
        showToast("Failed to fetch idea");
        navigate("/dashboard");
        return;
      }
      setFeedback(data.idea.feedback || null);
    } catch (err) {
      console.error("Error fetching feedback:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateFeedback = async () => {
    setGenerating(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/getfeedback/${decodedId}`,
        { method: "POST",
         headers: {
            "Content-Type": "application/json",
            "authorization": `Bearer ${localStorage.getItem("token")}`, 
         },
         }
      );
      const result = await res.json();

      if (result?.success && result?.feedback) {
        setFeedback(result.feedback);
        showToast("Feedback generated successfully", result.success);
      } else {
        showToast(result?.error || "Failed to generate feedback");
      }
    } catch (err) {
      console.error("Error generating feedback:", err);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="feedback-container">
      <h2>Feedback</h2>

      {!feedback ? (
    <button
        className="generate-btn"
        onClick={generateFeedback}
        disabled={generating}
    >
        {generating ? "Generating..." : "Generate Feedback"}
    </button>
    ) : (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <button
        className="generate-btn"
        onClick={generateFeedback}
        disabled={generating}
    >
        {generating ? "Generating..." : "Re-Generate Feedback"}
    </button><br></br>
      <div className="feedback-section">
          {/* <h3>Feedback:</h3> */}
          <ul>
          {feedback.feedbacks && feedback.feedbacks.map((f, i) => (
              <li key={i} className="feedback-item">{f}</li>
          ))}
          </ul>

      </div>
    </div>
    )}

    </div>
  );
}
