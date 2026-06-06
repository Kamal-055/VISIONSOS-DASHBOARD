import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import { 
  Volume2, 
  VolumeX, 
  Clock, 
  ShieldAlert, 
  User, 
  Radio, 
  LogOut 
} from "lucide-react";
import { logoutUser } from "../../services/authService";
import { useNavigate } from "react-router-dom";

const Navbar = ({ toggleSidebar }) => {
  const { profile } = useAuth();
  const { isMuted, setMuted, isSirenPlaying, activeSOSAlerts } = useNotifications();
  const [time, setTime] = useState(new Date());
  const navigate = useNavigate();

  // Keep digital clock updating
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (t) => {
    return t.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    });
  };

  const formatDate = (t) => {
    return t.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (e) {
      console.error(e);
    }
  };

  const hasActiveEmergency = activeSOSAlerts && activeSOSAlerts.length > 0;

  return (
    <header className="flex flex-col bg-brand-card border-b border-brand-border z-30 shrink-0">
      {/* Top flashing emergency banner if active SOS */}
      {hasActiveEmergency && (
        <div className="animate-siren-red border-b border-red-500 py-2.5 px-4 text-center flex items-center justify-center gap-3 select-none">
          <ShieldAlert className="w-5 h-5 text-white animate-bounce" />
          <span className="text-white font-display font-bold text-xs tracking-wider uppercase">
            CRITICAL SOS IN PROGRESS: User {activeSOSAlerts[0].userName || "Unknown"} near {activeSOSAlerts[0].nearestLight || "N/A"} ({activeSOSAlerts[0].distance || "0m"})
          </span>
          <button 
            onClick={() => navigate("/alerts")}
            className="ml-4 px-3 py-1 bg-white text-red-700 hover:bg-red-100 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer shadow-md"
          >
            Intercept Alert
          </button>
        </div>
      )}

      {/* Main Navbar Contents */}
      <div className="flex items-center justify-between h-[64px] px-6">
        {/* Left Section: Mobile toggle & Title */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="md:hidden p-2 rounded-lg text-gray-400 hover:text-brand-text hover:bg-slate-800 cursor-pointer"
          >
            <Radio className="w-5 h-5 animate-pulse text-blue-500" />
          </button>
          <div className="flex flex-col">
            <h1 className="font-display font-bold text-base tracking-wide text-brand-text flex items-center gap-2">
              VISION CORE <span className="text-xs px-2 py-0.5 rounded bg-blue-600/10 text-brand-primary border border-blue-500/20 uppercase tracking-widest font-mono">CAD v1.2</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-mono tracking-wider hidden sm:block">
              CAD FEED // LATENCY: 22ms // DATABASE CONNECTED
            </p>
          </div>
        </div>

        {/* Right Section: Time, Siren status, Profile */}
        <div className="flex items-center gap-6">
          {/* Time Module */}
          <div className="hidden lg:flex items-center gap-2.5 font-mono text-xs text-gray-400 border-r border-brand-border pr-6">
            <Clock size={14} className="text-blue-500" />
            <span>{formatDate(time)}</span>
            <span className="text-brand-text font-bold">{formatTime(time)}</span>
          </div>

          {/* Siren Alert Mute Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!isMuted)}
              className={`flex items-center justify-center p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                isMuted
                  ? "bg-slate-900 border-slate-700 text-gray-500 hover:text-gray-300"
                  : isSirenPlaying
                  ? "bg-red-500/10 border-red-500/30 text-brand-danger animate-pulse hover:bg-red-500/20"
                  : "bg-blue-500/10 border-blue-500/20 text-brand-primary hover:bg-blue-500/20"
              }`}
              title={isMuted ? "Unmute Alarm" : "Mute Alarm"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <span className="text-[10px] font-mono tracking-widest text-gray-400 uppercase hidden sm:inline select-none">
              {isMuted ? "MUTED" : isSirenPlaying ? "ALARM RINGING" : "MONITORING"}
            </span>
          </div>

          {/* Profile Quick Stats */}
          <div className="flex items-center gap-3">
            <div className="flex flex-col text-right">
              <span className="text-xs font-semibold text-gray-200">
                {profile?.name || "Officer"}
              </span>
              <span className="text-[9px] font-mono tracking-wider text-green-400 uppercase">
                {profile?.role || "Active Duty"}
              </span>
            </div>
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-800 border border-brand-border text-gray-300 hover:text-brand-text">
              <User size={16} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
