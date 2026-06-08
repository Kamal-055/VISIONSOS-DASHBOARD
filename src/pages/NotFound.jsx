import React from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, ArrowLeft } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-brand-bg text-brand-text bg-grid-cyber relative p-6">
      {/* Flashing scanner bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 shadow-md"></div>

      <div className="text-center max-w-md p-8 border border-brand-border bg-brand-card rounded-xl shadow-2xl relative overflow-hidden">
        {/* Futuristic radar sweep animation */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500/20 blur-[1px] animate-pulse"></div>

        <div className="inline-flex items-center justify-center mb-6">
          <img src="/logo.jpg" alt="VISION Logo" className="w-16 h-16 rounded-xl border border-brand-border object-contain bg-slate-950 animate-pulse" />
        </div>

        <h1 className="font-display font-extrabold text-6xl tracking-tighter text-red-500 mb-2">
          404
        </h1>
        <h2 className="font-display font-bold text-lg uppercase tracking-wider text-brand-text mb-4">
          Signal Offline / Sector Unregistered
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-8">
          The requested coordinate or command line does not exist in the police CAD directory. It may have been resolved, archived, or restricted.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2.5 px-5 py-3 bg-brand-primary hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all cursor-pointer"
        >
          <ArrowLeft size={14} />
          Return to Command Feed
        </Link>
      </div>

      <div className="absolute bottom-5 font-mono text-[9px] text-slate-500 tracking-wider">
        SYS_STATUS: INVALID_URL_REDIRECT // LATITUDE: NULL // LONGITUDE: NULL
      </div>
    </div>
  );
};

export default NotFound;
