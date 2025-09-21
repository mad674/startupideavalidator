import React, { useState } from 'react';
import './CreateIdea.css';
import { useNavigate, Navigate } from 'react-router-dom';
import { useToast } from '../../components/Popups/Popup';
export default function CreateIdea() {
  const [form, setForm] = useState({
    name: '',
    problem_statement: '',
    solution: '',
    target_market: '',
    business_model: '',
    team: ''
  });
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  // const [error, setEr/ror] = useState(null);
  const navigate = useNavigate();
  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const sanitizeInput = (str) => {
    if (!str) return '';
    return str.replace(/[+#*\/'\"\\%]/g, '');
  };
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formWithDefaults = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        sanitizeInput(value.trim() === '' ? 'Not available' : value)
      ])
    );
    try {
      const token = localStorage.getItem('token'); // Token contains user_id in JWT
      if (!token) throw new Error('User not logged in');
      const user_id = JSON.parse(atob(token.split('.')[1])).id;
      const submitidea= await fetch(`${process.env.REACT_APP_BACKEND}/idea/submitidea`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({user_id,...formWithDefaults}),
      })
      const res = await submitidea.json();
      if(res.success){
        showToast(res.message || 'Idea submitted successfully',res.success);
        navigate(`/ideas/${btoa(res.idea_id)}`);
      }else{
        showToast(res.message|| 'Idea submission failed');
      }
      
    } catch (err) {
      showToast(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-idea">
      <h2>Create Startup Idea</h2>
      <form className="card form" onSubmit={submit}>
        <label>Name
          <input name="name" value={form.name} onChange={change} required placeholder='Enter startup name' />
        </label>
        <label>Problem Statement
          <textarea name="problem_statement" value={form.problem_statement} onChange={change} rows="3" placeholder="Describe the problem you're solving" />
        </label>
        <label>Solution
          <textarea name="solution" value={form.solution} onChange={change}  rows="3" placeholder='Explain your solution to the problem '/>
        </label>
        <label>Target Market
          <textarea name="target_market" value={form.target_market} onChange={change} placeholder='Enter target market'  />
        </label>
        <label>Business Model
          <textarea name="business_model" value={form.business_model} onChange={change} placeholder='Describe business model'  />
        </label>
        <label>Team
          <textarea name="team" value={form.team} onChange={change}placeholder='Tell us about your team' rows="2" />
        </label>

        <div className="actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Idea'}
          </button>
        </div>
      </form>
    </div>
  );
}
