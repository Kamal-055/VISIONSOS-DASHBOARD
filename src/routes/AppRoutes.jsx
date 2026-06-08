import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { NotificationProvider } from "../context/NotificationContext";

// Layouts
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";

// Protected Route Guard
import ProtectedRoute from "./ProtectedRoute";

// Pages (Skeletons to be built)
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import LiveAlerts from "../pages/LiveAlerts";
import MapMonitoring from "../pages/MapMonitoring";
import IncidentManagement from "../pages/IncidentManagement";
import SmartStreetlights from "../pages/SmartStreetlights";
import Analytics from "../pages/Analytics";
import SOSHistory from "../pages/SOSHistory";
import UserManagement from "../pages/UserManagement";
import Settings from "../pages/Settings";
import Profile from "../pages/Profile";
import NotFound from "../pages/NotFound";
import About from "../pages/About";

const AppRoutes = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Guest/Auth routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
            </Route>

            {/* Protected Command Center routes */}
            <Route
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/alerts" element={<LiveAlerts />} />
              <Route path="/map" element={<MapMonitoring />} />
              <Route path="/incidents" element={<IncidentManagement />} />
              <Route path="/streetlights" element={<SmartStreetlights />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/history" element={<SOSHistory />} />
               <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/about" element={<About />} />
              
              {/* Admin-only route */}
              <Route
                path="/users"
                element={
                  <ProtectedRoute allowedRoles={["Admin"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Miscellaneous */}
            <Route path="/404" element={<NotFound />} />
            <Route
              path="/unauthorized"
              element={
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-brand-text bg-grid-cyber relative p-6">
                  <div className="text-center max-w-md p-8 border border-brand-border bg-brand-card rounded-xl shadow-2xl flex flex-col items-center">
                    <img src="/logo.jpg" alt="VISION Logo" className="w-16 h-16 rounded-xl border border-brand-border mb-6 object-contain bg-slate-950" />
                    <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-2">Access Denied</h2>
                    <p className="text-xs text-gray-400 mb-6 leading-relaxed uppercase tracking-wider font-mono">Administrative clearance levels required for this node.</p>
                    <a href="/" className="inline-flex items-center gap-2 px-5 py-3 bg-brand-primary hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/10 transition-all cursor-pointer">Return to Control Feed</a>
                  </div>
                </div>
              }
            />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default AppRoutes;
