import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import useAuth from "./pages/UserScreen/Auth/useAuth";

import Navbar from "./components/Navbar/Navbar";
import Home from "./pages/UserScreen/Home/Home";
import Dashboard from "./pages/UserScreen/Dashboard/Dashboard";
import CreateIdea from "./pages/UserScreen/CreateIdea/CreateIdea";
// import IdeaList from "./pages/UserScreen/IdeaList/IdeaList";
import IdeaDetail from "./pages/UserScreen/IdeaDetail/IdeaDetail";
import UpdateIdea from "./pages/UserScreen/Updateidea/UpdateIdea";
import Settings from "./pages/UserScreen/Settings/Settings";
import Login from "./pages/UserScreen/Auth/Login";
import Register from "./pages/UserScreen/Auth/Register";
import Suggestions from "./pages/UserScreen/suggestions/Suggestions";
import Feedback from "./pages/UserScreen/Feedback/Feedback";
import Profile from "./pages/UserScreen/Profile/Profile";  
import ForgotPassword from "./pages/UserScreen/Auth/ForgotPassword";
import ResetPassword from "./pages/UserScreen/Auth/ResetPassword";
import Chatbot from "./pages/UserScreen/Chatbot/Chatbot";
import ApiKeyScreen from "./pages/UserScreen/ApiScreen/ApiKeyScreen";
import ApiKeyForm from "./pages/UserScreen/ApiScreen/ApiKeyForm";
import AdminDashboard from "./pages/AdminScreen/AdminDashboard";
import AdminLogin from "./pages/AdminScreen/AdminLogin";
import AdminIdeaDetail from "./pages/AdminScreen/AdminIdeaDetail";
import useAdminAuth from "./pages/UserScreen/Auth/useAdminAuth";
import ExpertRegister from "./pages/ExpertScreen/ExpertRegister/ExpertRegister";
import ExpertLogin from "./pages/ExpertScreen/ExpertLogin/ExpertLogin";
import ExpertDashboard from "./pages/ExpertScreen/ExpertDashboard/ExpertDashboard";
import ChatScreen from "./pages/ExpertScreen/ChatScreen/ChatScreen";
import ExpertChangeProfile from "./pages/ExpertScreen/ExpertProfile/ExpertChangeProfile";
import useExpertAuth from "./pages/UserScreen/Auth/useExpertAuth";
import ExpertSelection from "./pages/UserScreen/ExpertSelection/ExpertSelection";
import ExpertChat from "./pages/UserScreen/ExpertChat/ExpertChat";
import ExpertProfile from "./pages/UserScreen/ExpertProfile/ExpertProfile";
import AdminExpertDashboard   from "./pages/AdminScreen/AdminExpertDashboard ";
import ExpertForgotPassword from "./pages/ExpertScreen/Auth/ExpertForgotPassword";
import ExpertResetPassword from "./pages/ExpertScreen/Auth/ExpertResetPassword";


export default function App() {
  const { isAuthenticated, login, logout } = useAuth();
  const { adminSession, login: adminLogin, logout: adminLogout } = useAdminAuth();
  const { expertSession, login: expertLogin, logout: expertLogout } = useExpertAuth();
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/" replace />;
  };
  const AdminProtectedRoute = ({ children }) =>{
    const session = JSON.parse(localStorage.getItem("adminSession"));
    return session?.token && session?.adminId ? children : <Navigate to="/admin" replace />;
  };
  const ExpertProtectedRoute = ({ children }) => {
    const session = JSON.parse(localStorage.getItem("expertSession"));
    return session?.token && session?.expertId
      ? children
      : <Navigate to="/expert/login" replace />;
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
            path="/admin"
            element={<AdminLogin onLogin={adminLogin} />}
          />
          <Route
            path="/admindashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboard/>
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/adminexpertdashboard"
            element={
              <AdminProtectedRoute>
                <AdminExpertDashboard />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/adminidea/:ideaId"
            element={
              <AdminProtectedRoute>
                <AdminIdeaDetail
                  adminId={adminSession?.adminId}
                  token={adminSession?.token}
                  onLogout={adminLogout}
                />
              </AdminProtectedRoute>
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
          <Route path="/expert/forgot-password" 
          element={
              expertSession ? <Navigate to="/expert/login" replace /> : <ExpertForgotPassword />
            } />
          <Route path="/expert/reset-password/:expertId" 
            element={
              expertSession ? <Navigate to="/expert/login" replace /> : <ExpertResetPassword/>
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
          <Route
            path="/ExpertSelection/:ideaid"
            element={
              <ProtectedRoute>
                <ExpertSelection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ExpertProfile/:expertid/:ideaid"
            element={
              <ProtectedRoute>
                <ExpertProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ExpertChat/:expertid/:ideaid"
            element={
              <ProtectedRoute>
                <ExpertChat />
              </ProtectedRoute>
            }
          />
          {/* Expert Routes */}
        <Route
          path="/expert/register"
          element={
            <ExpertRegister onLogin={expertLogin}/>
          }
        />
        <Route
          path="/expert/login"
          element={
            <ExpertLogin onLogin={expertLogin}/>
          }
        />
        <Route
          path="/expert/dashboard"
          element={
            <ExpertProtectedRoute>
              <ExpertDashboard />
            </ExpertProtectedRoute>
          }
        />
        <Route
          path="/expert/chat/:ideaId"
          element={
            <ExpertProtectedRoute>
              <ChatScreen />
            </ExpertProtectedRoute>
          }
        />
        <Route
          path="/expert/profile"
          element={
            <ExpertProtectedRoute>
              <ExpertChangeProfile />
            </ExpertProtectedRoute>
          }
        />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
