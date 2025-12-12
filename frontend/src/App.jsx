// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import DashboardLayout from "./components/DashboardLayout";
import Profile from "./pages/Profile";
import Reports from "./pages/Reports";
import Dashboard from "./pages/Dashboard";

function App() {
  const isAuthenticated = localStorage.getItem("isAuthenticated");

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated ?
              <Navigate to="/dashboard/profile" /> :
              <Navigate to="/login" />
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ?
              <DashboardLayout /> :
              <Navigate to="/login" />
          }
        >
          <Route path="profile" element={<Profile />} />
          <Route path="reports" element={<Reports />} />
          <Route path="overview" element={<Dashboard />} />
          <Route index element={<Navigate to="overview" replace />} />
        </Route>

        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-dark-900 mb-4">404</h1>
                <p className="text-dark-700">Page not found</p>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;