import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 text-brand-text">
        <div className="flex flex-col items-center gap-6">
          <img 
            src="/logo.jpg" 
            alt="VISION Logo" 
            className="w-24 h-24 rounded-2xl shadow-2xl border-2 border-slate-800 object-contain bg-slate-950 animate-logo-pulse" 
          />
          <div className="flex flex-col items-center gap-2">
            <h1 className="font-display font-black text-xl tracking-widest text-brand-text uppercase">
              VISION SOS
            </h1>
            <p className="text-xs font-mono tracking-widest text-blue-500 uppercase animate-pulse">
              Securing Control Room Session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login but save the current location to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if role is allowed
  if (allowedRoles && (!profile || !allowedRoles.includes(profile.role))) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;
