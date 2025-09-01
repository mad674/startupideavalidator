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
import ForgotPassword from "./pages/Auth/ForgotPassword";
import ResetPassword from "./pages/Auth/ResetPassword";
import Chatbot from "./pages/Chatbot/Chatbot";
import ApiKeyScreen from "./pages/ApiScreen/ApiKeyScreen";
import ApiKeyForm from "./pages/ApiScreen/ApiKeyForm";
export default function App() {
  const { isAuthenticated, login, logout } = useAuth();

  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/" replace />;
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
          <Route path="/forgot-password" 
          element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <ForgotPassword />
            } />
          <Route path="/reset-password/:userId" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <ResetPassword />
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
            path="/api_key/"
            element={
              <ProtectedRoute>
                <ApiKeyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/updateidea/:id"
            element={
              <ProtectedRoute>
                <ApiKeyScreen>
                  <UpdateIdea />
                </ApiKeyScreen>
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/suggestions/:id"
            element={
              <ProtectedRoute>
                <ApiKeyScreen>
                <Suggestions />
                </ApiKeyScreen>
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/feedback/:id"
            element={
              <ProtectedRoute>
                <ApiKeyScreen>
                <Feedback />
                </ApiKeyScreen>
              </ProtectedRoute>
            }
          />
          <Route
            path="/idea/chatbot/:id"
            element={
              <ProtectedRoute>
                <ApiKeyScreen>
                <Chatbot/>
                </ApiKeyScreen>
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
                <ApiKeyScreen>
                <CreateIdea />
                </ApiKeyScreen>
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
