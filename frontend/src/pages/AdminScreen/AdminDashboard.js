import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "../../components/Popups/Popup";

const AdminUsersPage = ({ onLogout,adminId, token }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); // Selected user
  const [userIdeas, setUserIdeas] = useState([]);
  const [ideaSearch, setIdeaSearch] = useState(""); // Search for ideas
  const navigate = useNavigate();
  const {showToast}=useToast();
  useEffect(() => {
    fetchAllUsers();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/admin/allusers/${adminId}`, {
        headers: { Authorization: token },
      });
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const fetchUserIdeas = async (user) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/admin/alluserideas/${adminId}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          authorization: token 
        },
        body: JSON.stringify({ user_id: user._id }),
      });
      const data = await res.json();
      console.log(data);
      setUserIdeas(data.ideas || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUserClick = (user) => {
    setSelectedUser(user);
    fetchUserIdeas(user);
  };

  const goBack = () => {
    setSelectedUser(null);
    setUserIdeas([]);
    setIdeaSearch("");
  };

  const deleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) return;
    try {
      const res=await fetch(`${process.env.REACT_APP_BACKEND}/admin/deleteuser/${adminId}`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: token },
        body: JSON.stringify({ user_id: user._id }),
      });
      const data=await res.json();
      if(!data.success) return showToast(data.message);
      showToast("User deleted successfully");
      goBack();
      fetchAllUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllUsers = async () => {
    if (!window.confirm("Are you sure you want to delete all users?")) return;
    try {
      await fetch(`${process.env.REACT_APP_BACKEND}/admin/deleteallusers/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      fetchAllUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const deleteAllIdeas = async () => {
    if (!window.confirm("Are you sure you want to delete all ideas?")) return;
    try {
      await fetch(`${process.env.REACT_APP_BACKEND}/admin/deleteallideas/${adminId}`, {
        method: "DELETE",
        headers: { Authorization: token },
      });
      showToast("All ideas deleted successfully",true);
      if (selectedUser) fetchUserIdeas(selectedUser);
    } catch (err) {
      console.error(err);
    }
  };
  const deleteAlluserIdeas = async (selectedUser) => {
    if (!window.confirm("Are you sure you want to delete all ideas?")) return;
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND}/admin/deletealluserideas/${adminId}`, {
        method: "POST",
        headers: { "content-type": "application/json", Authorization: token },
        body: JSON.stringify({ user_id: selectedUser._id }),
      });
      const data = await res.json();
      if (!data.success) return showToast(data.message);
      showToast("All ideas deleted successfully",true);
      if (selectedUser) fetchUserIdeas(selectedUser);
    } catch (err) {
      console.error(err);
    }
  };
  const filteredUsers = users.filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIdeas = userIdeas.filter((i) =>
    i.data.name.toLowerCase().includes(ideaSearch.toLowerCase())
  );

  // --- Selected User View ---
  if (selectedUser) {
    return (
      <div style={styles.container}>
        <button style={styles.backBtn} onClick={goBack}>← Back to Users</button>
        <h2>{selectedUser.email}</h2>
        <button style={styles.deleteUserBtn} onClick={() => deleteUser(selectedUser)}>Delete User</button>
        <button style={styles.deleteUserBtn} onClick={()=>deleteAlluserIdeas(selectedUser)}>Delete All Ideas</button>
        <h3>User Ideas</h3>
        <input
          type="text"
          placeholder="Search ideas..."
          value={ideaSearch}
          onChange={(e) => setIdeaSearch(e.target.value)}
          style={styles.searchInput}
        />

        {filteredIdeas.length === 0 ? (
          <p>No ideas found.</p>
        ) : (
          <div style={styles.ideasGrid}>
            {filteredIdeas.map((idea) => (
              <div
                key={idea._id}
                style={styles.ideaBox}
                onClick={() => navigate(`/adminidea/${btoa(idea._id)}`)}
              >
                <p>{idea.data.name}</p>
                <p>Score:{idea.score?.["Average Score"] || ""}</p>
                <p>viability:{idea.score?.["Overall Viability"] || ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  // --- Users List View ---
  return (
    <div style={styles.container}>
      <h2>Admin Users Dashboard</h2>
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <div>
          <button style={styles.deleteAllBtn} onClick={deleteAllUsers}>Delete All Users</button>
          <button style={styles.deleteAllBtn} onClick={deleteAllIdeas}>Delete All Ideas</button>
          <button style={styles.deleteAllBtn} onClick={()=>onLogout()}>Logout</button>
        </div>
      </div>
      
      {loading ? (
        <p>Loading users...</p>
      ) : (
        <div style={styles.grid}>
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              style={styles.userBox}
              onClick={() => handleUserClick(user)}
            >
              <p>{user.email}</p>
            </div>
          ))}
          {filteredUsers.length === 0 && <p>No users found.</p>}
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

export default AdminUsersPage;
