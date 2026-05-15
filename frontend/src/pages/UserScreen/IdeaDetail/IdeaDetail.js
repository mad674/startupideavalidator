
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./IdeaDetail.css";
import { useToast } from "../../../components/Popups/Popup";
export default function IdeaDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    async function fetchIdeaData() {
      try {
        const fetchIdea = await fetch(
          `${process.env.REACT_APP_BACKEND}/idea/getidea/${atob(id)}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
          }
        );
        const data = await fetchIdea.json();
        setIdea(data.idea);
      } catch (err) {
        showToast("Error fetching idea");
      } finally {
        setLoading(false);
      }
    }
    fetchIdeaData();
  }, [id]);

  const generatePDF = async () => {

    try {

      const response = await fetch(
        `${process.env.REACT_APP_BACKEND}/user/pdf_report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            idea_id: atob(id),
            user_id: idea.user_id
          })
        }
      );

      const data = await response.json();

      const jobId = data.jobId;

      // Step 2 → Poll Job Status
      pollJobStatus(jobId);

    } catch (error) {
      console.error(error);
      showToast("Error generating PDF");
    }
  };
  const pollJobStatus = (jobId) => {

    const interval = setInterval(async () => {

      try {

        const response = await fetch(
          `${process.env.REACT_APP_BACKEND}/user/status/${jobId}`
        );

        const data = await response.json();

        console.log(data);

        // PDF Ready
        if (data.state === "completed") {

          clearInterval(interval);

          const fileName =
            data.result.storedFileName;

          const downloadUrl =
            `${process.env.REACT_APP_BACKEND}/user/download/${fileName}`;

          // Download PDF
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.setAttribute("download", "");
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        // Failed
        if (data.state === "failed") {

          clearInterval(interval);

          alert("PDF generation failed");
        }

      } catch (error) {

        clearInterval(interval);

        console.error(error);
      }

    }, 3000);
  };
  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this idea?")) return;
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/deleteidea/${atob(id)}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) {
        showToast("Idea deleted successfully",data.success);
        navigate("/dashboard");
      } else {
        showToast("Failed to delete idea");
      }
    } catch (err) {
      showToast("Error deleting idea");
    }
  }

  if (loading) return <p>Loading...</p>;
  if (!idea) return <p>No idea found.</p>;

  return (
    <div className="card idea-detail">
       <small className="idea-date">created on {new Date(idea.createdAt).toLocaleDateString()}</small>
       <h2>IDEA NAME : {idea.data.name ?? "Not available"}</h2>
      <p>
        <strong>Problem Statement:</strong> {idea.data.problem_statement ?? "Not available"}.<br />
        <strong>solution:</strong>{idea.data.solution?? "Not available"}.<br/>
        <strong>Target Market:</strong> {idea.data.target_market?? "Not available"}.<br/>
        <strong>Business Model:</strong> {idea.data.business_model ?? "Not available"}.<br/>
        <strong>Team:</strong> {idea.data.team ?? "Not available"}.<br/>
      </p>

      
      <div className="meta">
        <h2>AI Score :</h2>
        <strong>Technical Feasibility : </strong>{idea.score?.["Technical Feasibility"]+" / 5" ?? "—"}<br/>
        <strong>Market Size : </strong>{idea.score?.["Market Size"] +" / 5"?? "—"}<br/>
        <strong>Revenue Model : </strong>{idea.score?.["Revenue Model"]+" / 5" ?? "—"}<br/>
        <strong>Uniqueness : </strong>{idea.score?.["Uniqueness"] +" / 5"?? "—"}<br/>
        <strong>Team Strength : </strong>{idea.score?.["Team Strength"]+" / 5" ?? "—"}<br/>
        <strong>Average Score : </strong>{idea.score?.["Average Score"]+" / 5" ?? "—"}<br/>
        <strong>Overall Viability : </strong>{idea.score?.["Overall Viability"] ?? "Not available"}<br/>
      </div>
      
      <div className="idea-actions">
        <button onClick={() => navigate(`/idea/suggestions/${id}`)}>
          AI Suggestions
        </button>
        <button onClick={() => navigate(`/idea/feedback/${id}`)}>
          AI Feedback
        </button>
        <button onClick={() => navigate(`/idea/chatbot/${id}`)}>
          AI Chatbot
        </button>
        <button onClick={() => navigate(`/idea/updateidea/${id}`)}>
          Update Idea
        </button>
        <button onClick={() => navigate(`/ExpertSelection/${id}`)}> 🎉chat with Expert🎉</button>
        <button onClick={handleDelete} className="delete-btn">
          Delete Idea
        </button>
      </div>
      <button onClick={generatePDF}>📥 Download Report</button>
    </div>
  );
}

