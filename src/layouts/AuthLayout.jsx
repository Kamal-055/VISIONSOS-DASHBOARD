import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Shield } from "lucide-react";

const AuthLayout = () => {
  const { user } = useAuth();

  // If already logged in, redirect directly to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-brand-bg text-brand-text font-sans bg-grid-cyber relative p-4">
      {/* Decorative top scanning bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600 shadow-md"></div>
      
      {/* Visual background glow */}
      <div className="absolute top-[20%] left-[25%] w-[300px] h-[300px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[25%] w-[300px] h-[300px] rounded-full bg-red-900/10 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
