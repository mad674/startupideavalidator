import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useToast } from "../../components/Popups/Popup";

const AdminIdeaDetail = () => {
  const session = JSON.parse(localStorage.getItem("adminSession"));
  const token =session?.token;
  const adminId = session?.adminId;
  const { ideaId } = useParams();
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const {showToast}=useToast();
  useEffect(() => {
    fetchIdeaDetail();
    // eslint-disable-next-line
  }, [ideaId]);

  const fetchIdeaDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/getidea/${atob(ideaId)}`,
        {
            method: "GET",
            headers: { 
            "Content-Type": "application/json",
            Authorization: token
            }

        }
      );
      const data = await res.json();
      setIdea(data.idea || null);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const deleteIdea = async () => {
    if (!window.confirm("Are you sure you want to delete this idea?")) return;
    try {
      const res=await fetch(
        `${process.env.REACT_APP_BACKEND}/admin/deleteidea/${adminId}`,
        {
            method: "POST",
            headers: { 
            "Content-Type": "application/json",
            Authorization: token 
            },
            body: JSON.stringify({ idea_id: atob(ideaId) }),
        }
      );
      const data = await res.json();
      if (!data.success){
        return showToast(data.message);
      }
      showToast("Idea deleted successfully",true);
      navigate('/admindashboard'); // go back after delete
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading idea details...</p>;
  if (!idea) return <p>No idea found.</p>;

  return (
    <div style={styles.container}>
      <button style={styles.backBtn} onClick={() => navigate(-1)}>
        ← Back
      </button>
      <h2>{idea.data.name}</h2>
      <p><strong>Problem:</strong> {idea.data.problem_statement}</p>
      <p><strong>Solution:</strong> {idea.data.solution}</p>
      <p><strong>Target Market:</strong> {idea.data.target_market}</p>
      <p><strong>Team:</strong> {idea.data.team}</p>
      <p><strong>Business Model:</strong> {idea.data.business_model}</p>
      <p><strong>Created At:</strong> {new Date(idea.createdAt).toLocaleString()}</p>

      {/* Suggestions Section */}
      {idea.suggestions && (
        <div style={styles.section}>
          <h3>💡 Suggestions</h3>
          {idea.suggestions.improvements?.length > 0 && (
            <div>
              <h4 style={styles.subHeading}>Improvements</h4>
              <ul style={styles.list}>
                {idea.suggestions.improvements.map((imp, idx) => (
                  <li key={idx}>{imp}</li>
                ))}
              </ul>
            </div>
          )}
          {idea.suggestions.rationale?.length > 0 && (
            <div>
              <h4 style={styles.subHeading}>Rationale</h4>
              <ul style={styles.list}>
                {idea.suggestions.rationale.map((rat, idx) => (
                  <li key={idx}>{rat}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Feedback Section */}
      {idea.feedback && idea.feedback.feedbacks?.length > 0 && (
        <div style={styles.section}>
          <h3>📝 Feedback</h3>
          <ul style={styles.list}>
            {idea.feedback.feedbacks.map((f, idx) => (
              <li key={idx}>{f}</li>
            ))}
          </ul>
        </div>
      )}

      <button style={styles.deleteBtn} onClick={deleteIdea}>
        Delete Idea
      </button>
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
    lineHeight: "1.6",
  },
  backBtn: {
    padding: "8px 12px",
    marginBottom: "20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "#555",
    color: "#fff",
    cursor: "pointer",
  },
  deleteBtn: {
    marginTop: "20px",
    padding: "10px 15px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "red",
    color: "#fff",
    cursor: "pointer",
  },
  section: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    borderRadius: "8px",
  },
  subHeading: {
    fontSize: "14px",
    fontWeight: "bold",
    marginBottom: "8px",
  },
  list: {
    fontSize: "14px",
    paddingLeft: "20px",
  },
};

export default AdminIdeaDetail;
