import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./pages/Auth/useAuth";

import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/Home/Home";
import Dashboard from "./pages/Dashboard/Dashboard";
import CreateIdea from "./pages/CreateIdea/CreateIdea";
// import IdeaList from "./pages/IdeaList/IdeaList";
import IdeaDetail from "./pages/IdeaDetail/IdeaDetail";
import UpdateIdea from "./pages/Updateidea/UpdateIdea";
import Settings from "./pages/Settings/Settings";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Suggestions from "./pages/suggestions/Suggestions";
import Feedback from "./pages/Feedback/Feedback";
import Profile from "./pages/Profile/Profile";  


export default function App() {
  const { isAuthenticated, login, logout } = useAuth();

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" replace />;
  };

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar onLogout={logout} />}
      <main className="container">
        <Routes>
          <Route
            path="/*"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Home />
            }
          />
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login onLogin={login} />
            }
          />
          <Route
            path="/register"
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register onLogin={login} />
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ideas/:id"
            element={
              <ProtectedRoute>
                <IdeaDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/updateidea/:id"
            element={
              <ProtectedRoute>
                <UpdateIdea />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/suggestions/:id"
            element={
              <ProtectedRoute>
                <Suggestions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/feedback/:id"
            element={
              <ProtectedRoute>
                <Feedback />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreateIdea />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
