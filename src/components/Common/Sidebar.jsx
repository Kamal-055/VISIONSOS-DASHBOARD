import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { logoutUser } from "../../services/authService";
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Map, 
  ShieldAlert, 
  Lightbulb, 
  BarChart3, 
  History, 
  Users, 
  Settings, 
  UserCircle, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Shield
} from "lucide-react";

const Sidebar = ({ isCollapsed, setIsCollapsed }) => {
  const { profile, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (e) {
      console.error("Logout failed:", e);
    }
  };

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Live Alerts", path: "/alerts", icon: AlertTriangle },
    { name: "Map Monitoring", path: "/map", icon: Map },
    { name: "Incidents", path: "/incidents", icon: ShieldAlert },
    { name: "Streetlights", path: "/streetlights", icon: Lightbulb },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "SOS History", path: "/history", icon: History },
    { name: "User Management", path: "/users", icon: Users, adminOnly: true },
    { name: "Settings", path: "/settings", icon: Settings },
    { name: "Profile", path: "/profile", icon: UserCircle },
    { name: "About", path: "/about", icon: Shield },
  ];

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 70 : 260 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="flex flex-col h-screen bg-brand-card border-r border-brand-border text-brand-text select-none shrink-0"
    >
      {/* Brand Logo & Title */}
      <div className="flex flex-col items-center justify-center py-4 border-b border-brand-border shrink-0 select-none">
        <img 
          src="/logo.jpg" 
          alt="VISION Logo" 
          className="w-10 h-10 rounded-lg shadow-md border border-brand-border object-contain bg-slate-950" 
        />
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-2 flex flex-col items-center justify-center relative"
          >
            <span className="font-display font-black text-sm tracking-widest uppercase text-blue-400 block">
              VISION SOS
            </span>
            <span className="text-[9px] text-gray-400 tracking-widest uppercase block">
              Control Room
            </span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="absolute -right-12 top-0.5 flex items-center justify-center p-1 rounded-md border border-brand-border bg-slate-800/50 hover:bg-slate-700/50 text-gray-400 hover:text-brand-text cursor-pointer"
            >
              <ChevronLeft size={12} />
            </button>
          </motion.div>
        ) : (
          <button
            onClick={() => setIsCollapsed(false)}
            className="mt-2.5 flex items-center justify-center p-1 rounded-md border border-brand-border bg-slate-800/50 hover:bg-slate-700/50 text-gray-400 hover:text-brand-text cursor-pointer"
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          // If page is admin only, hide it for non-admins
          if (item.adminOnly && !isAdmin) return null;
          
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm font-medium tracking-wide transition-all group duration-200 relative ${
                  isActive
                    ? "bg-brand-primary text-white shadow-lg shadow-blue-500/10 border-l-4 border-blue-400 pl-2"
                    : "text-gray-400 hover:bg-slate-800 hover:text-brand-text"
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.name}
                </motion.span>
              )}
              {isCollapsed && (
                <div className="absolute left-[75px] bg-slate-900 border border-slate-700 text-brand-text text-xs px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-150 z-50 whitespace-nowrap shadow-xl">
                  {item.name}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-brand-border bg-slate-900/30">
        {!isCollapsed && profile && (
          <div className="flex items-center justify-between gap-2 mb-3 px-1">
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold truncate text-gray-200">{profile.name}</span>
              <span className="text-[10px] text-gray-400 truncate">{profile.role} • {profile.badgeNumber}</span>
            </div>
            <div className="w-2 h-2 rounded-full bg-brand-success animate-pulse shrink-0" />
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-400 hover:text-white bg-red-950/20 hover:bg-red-900/40 border border-red-500/10 hover:border-red-500/30 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Term. Session</span>}
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
