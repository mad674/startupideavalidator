import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./UpdateIdea.css";
import { useToast } from "../../../components/Popups/Popup";
export default function UpdateIdea() {
  const { id } = useParams();
  const navigate = useNavigate();
  const decodedId = atob(id);
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    problem_statement: "",
    solution: "",
    target_market: "",
    team: "",
    business_model: "",
  });
  const [loading, setLoading] = useState(true);
  const sanitizeInput = (str) => {
    if (!str) return '';
    return str.replace(/[+#*\/'\"\\%]/g, '');
  };
  // Fetch current idea details for pre-filling form
  useEffect(() => {
    async function fetchIdea() {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND}/idea/getidea/${decodedId}`);
        const data = await res.json();
        if (data?.idea?.data) {
          setFormData({
            name: data.idea.data.name || "",
            problem_statement: data.idea.data.problem_statement || "",
            solution:data.idea.data.solution || "",
            target_market: data.idea.data.target_market || "",
            team: data.idea.data.team || "",
            business_model: data.idea.data.business_model || "",
          });
        } else {
          showToast("Idea not found");
          navigate("/dashboard");
        }
      } catch (error) {
        showToast("Error fetching idea details");
      } finally {
        setLoading(false);
      }
    }
    fetchIdea();
  }, [decodedId, navigate]);

  // Handle field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: sanitizeInput(value),
    }));
  };

  // Submit update request
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/idea/updateidea/${decodedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ data: formData }),
      });

      const result = await res.json();
      if (result.success) {
        showToast(result.message || "Idea updated successfully",result.success);
        navigate(`/ideas/${id}`);
      } else {
        showToast(result.message || "Failed to update idea");
      }
    } catch (error) {
      showToast("Error updating idea");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="update-idea-container">
      <h2>Update Idea</h2>
      <form onSubmit={handleSubmit} className="update-idea-form">
        <label>
          Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Problem Statement:
          <textarea
            name="problem_statement"
            value={formData.problem_statement}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Solution:
          <textarea
            name="solution"
            value={formData.solution}
            onChange={handleChange}
            required
          />
        </label>
        <label>
          Target Market:
          <textarea
            name="target_market"
            value={formData.target_market}
            onChange={handleChange}
          />
        </label>
        <label>
          Business Model:
          <textarea
            name="business_model"
            value={formData.business_model}
            onChange={handleChange}
          />
        </label>
        <label>
          Team:
          <textarea
            name="team"
            value={formData.team}
            onChange={handleChange}
          />
        </label>
        <button type="submit" className="btn-update">Update Idea</button>
      </form>
    </div>
  );
}
