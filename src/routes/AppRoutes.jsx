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
                <div className="flex h-screen w-screen flex-col items-center justify-center bg-brand-bg text-brand-text">
                  <h2 className="text-xl font-bold text-red-500 uppercase tracking-widest mb-2">Access Denied</h2>
                  <p className="text-sm text-gray-400 mb-4">You do not have administrative privileges to access this channel.</p>
                  <a href="/" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold rounded uppercase">Return to Control Feed</a>
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
