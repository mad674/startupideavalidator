import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Popups/Popup";

const AdminExpertDashboard = () => {
  const session = JSON.parse(localStorage.getItem("adminSession"));
  const token = session?.token;
  const adminId = session?.adminId;

  const [experts, setExperts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  useEffect(() => {
    fetchAllExperts();
  }, []);

  // Fetch all experts
  const fetchAllExperts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/admin/allexperts/${adminId}`, {
        headers: { Authorization: token },
      });
      const data = await res.json();
      setExperts(data.experts || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const deleteExpert = async (expert) => {
    if (!window.confirm(`Are you sure you want to delete ${expert.email}?`)) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/admin/deleteExpert/${adminId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: token },
        body: JSON.stringify({ expert_id: expert._id }),
      });
      const data = await res.json();
      if (!data.success) return showToast(data.message);
      showToast("Expert deleted successfully");
      goBack();
      fetchAllExperts();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllExperts = async () => {
    if (!window.confirm("Are you sure you want to delete all experts?")) return;
    try {
      const res=await fetch(`${process.env.REACT_APP_BACKEND}/admin/deleteAllExpert/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      const data=await res.json();
      if(!data.success) return showToast(data.message,data.success);
      showToast("All experts deleted successfully");
      fetchAllExperts();
    } catch (err) {
      console.error(err);
    }
  };

  const Logout = () => {
    localStorage.removeItem("adminSession");
    navigate("/admin");
  };

  const filteredExperts = experts.filter((e) =>
    e.email.toLowerCase().includes(search.toLowerCase())
  );


  // --- Experts List View ---
  return (
    <div style={styles.container}>
      <h2>Admin Experts Dashboard</h2>
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div>
          <button style={styles.deleteAllBtn} onClick={deleteAllExperts}>
            Delete All Experts
          </button>
          <button style={styles.deleteAllBtn} onClick={Logout}>
            Logout
          </button>
        </div>
      </div>

      {loading ? (
        <p>Loading experts...</p>
      ) : (
        <div style={styles.grid}>
          {filteredExperts.map((expert) => (
            <div
              key={expert._id}
              style={styles.userBox}
            >
              <p>{expert.email}</p>
              <button style={styles.deleteUserBtn} onClick={() => deleteExpert(expert)}>Delete Expert</button>
            </div>
          ))}
          {filteredExperts.length === 0 && <p>No experts found.</p>}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  controls: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "20px",
    alignItems: "center",
    flexWrap: "wrap",
  },
  searchInput: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ccc",
    width: "250px",
    marginBottom: "10px",
  },
  deleteAllBtn: {
    padding: "10px 15px",
    marginLeft: "10px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "red",
    color: "#fff",
    cursor: "pointer",
  },
  deleteUserBtn: {
    padding: "8px 12px",
    marginBottom: "20px",
    borderRadius: "5px",
    border: "none",
    backgroundColor: "red",
    color: "#fff",
    cursor: "pointer",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
    gap: "20px",
  },
  userBox: {
    padding: "15px",
    border: "1px solid #ddd",
    borderRadius: "8px",
    cursor: "pointer",
    backgroundColor: "#f9f9f9",
    transition: "all 0.2s",
  },
  ideasGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
    gap: "15px",
  },
  ideaBox: {
    padding: "10px",
    borderRadius: "5px",
    border: "1px solid #ddd",
    backgroundColor: "#f1f1f1",
    cursor: "pointer",
    textAlign: "center",
    transition: "all 0.2s",
  },
};

export default AdminExpertDashboard;
