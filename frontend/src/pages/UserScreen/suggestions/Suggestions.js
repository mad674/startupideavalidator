import React, { useEffect, useState, } from 'react';
import { Navigate, redirect, useParams, useNavigate } from 'react-router-dom';
import './Suggestions.css';
import { useToast } from "../../../components/Popups/Popup";
export default function Suggestions() {
  const { id } = useParams(); // ID from URL (Base64 decode if needed)
  const [suggestions, setSuggestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();
  const navigate = useNavigate();
  const decodedId = atob(id);
  // 🔹 Fetch existing suggestions on load
  useEffect(() => {
    const fetchExistingSuggestions = async () => {
      try {
        const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/getidea/${decodedId}`,
        {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            // 'authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        }
    );
      const data = await res.json();
      if (!data.success) {
          showToast('Failed to fetch idea');
          navigate('/dashboard');
      }   
        // alert(JSON.stringify(data.idea.suggestions));
        setSuggestions(data.idea.suggestions || null);
      } catch (err) {
        console.error(err);
        setError('Error fetching existing suggestions');
      }
    };

    fetchExistingSuggestions();
  }, [id]);

  // 🔹 Generate suggestions if none exist
  const handleGenerateSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND}/idea/getsuggestions/${decodedId}`,
        {
          method: 'POST', // or 'GET' if only retrieving
          headers: {
            'Content-Type': 'application/json',
            'authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await res.json();
      // console.log(data);
      if (!data.success) {
        setError(data.error || 'Failed to get suggestions');
        return; // stop execution if error
      }

      setSuggestions(data?.suggestions || null);
      showToast('Suggestions generated successfully', data.success);

    } catch (err) {
      console.error(err);
      setError('Error generating suggestions');
    } finally {
      setLoading(false);
    }

  };

  return (
    <div className="suggestions-container">
      <h2>Idea Suggestions</h2>

      {error && <p className="error">{error}</p>}

      {/* If no suggestions yet, show button */}
      {!suggestions ? (
        <button
          className="generate-btn"
          onClick={handleGenerateSuggestions}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Suggestions'}
        </button>
      ) : (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <button
          className="generate-btn"
          onClick={handleGenerateSuggestions}
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Re-Generate Suggestions'}
        </button><br></br>
        <div className="suggestions-list">
          <h3>Improvements</h3>
          <ul>
            {suggestions.improvements?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>

          <h3>Rationale</h3>
          <ul>
            {suggestions.rationale?.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        </div>
      )}
    </div>
  );
}
