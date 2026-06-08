import React from "react";
import { useTheme } from "../context/ThemeContext";
import { Shield, BookOpen, ShieldAlert, Cpu, Heart, CheckCircle2 } from "lucide-react";

const About = () => {
  const { resolvedTheme } = useTheme();

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto py-4">
      {/* Header Panel */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center gap-8 bg-grid-cyber">
        {/* Logo Card */}
        <div className="shrink-0 flex items-center justify-center">
          <img 
            src="/logo.jpg" 
            alt="VISION Logo" 
            className="w-32 h-32 rounded-2xl shadow-2xl border-2 border-brand-border object-contain bg-slate-950 animate-logo-pulse" 
          />
        </div>

        {/* Title and Specs */}
        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-blue-600/10 text-brand-primary border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-widest">
            🛡️ Official Government Asset
          </div>
          <h2 className="font-display font-black text-3xl tracking-wider text-brand-text uppercase">
            VISION SOS SYSTEM
          </h2>
          <p className="text-xs text-gray-400 font-mono tracking-wider max-w-xl">
            Computer-Aided Dispatch (CAD) Emergency Response Platform // Safe City Bengaluru Initiative
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-[10px] font-mono text-gray-500 pt-1">
            <span>VERSION: 4.8.0-PROD</span>
            <span>BUILD: SECURE_CAD_17809</span>
            <span>SECURITY LEVEL: CLASS-A MHA</span>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Operational Mandate */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-4">
          <h3 className="font-display font-bold text-sm text-brand-text uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
            <BookOpen size={16} className="text-blue-500" />
            1. Operational Mandate
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            The VISION SOS platform serves as the central command hub for managing municipal distress alerts. Designed to integrate mobile citizen triggers directly with local standby police patrol units and IoT smart streetlights, it ensures response times are minimized and safety zones are illuminated dynamically during emergency operations.
          </p>
          <div className="bg-slate-950/40 p-3 rounded-lg border border-brand-border space-y-2 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-gray-500">MUNICIPAL SPONSOR:</span>
              <span className="text-gray-300 font-bold">Safe City Bengaluru Project</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">DIRECTIVE AUTHORITY:</span>
              <span className="text-gray-300 font-bold">MHA / Police Commissionerate</span>
            </div>
          </div>
        </div>

        {/* Card 2: AI & GIS Engine Specs */}
        <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-4">
          <h3 className="font-display font-bold text-sm text-brand-text uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
            <Cpu size={16} className="text-purple-500" />
            2. Platform Capabilities
          </h3>
          <ul className="space-y-2.5 text-xs text-gray-400">
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span><strong>Haversine Geo-Proximity</strong>: Maps citizen coordinates to nearest smart streetlight and officers dynamically.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span><strong>KDE Spatial Heatmaps</strong>: Real-time Gaussian risk density grid computation (12x12 Bangalore boundaries).</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span><strong>DBSCAN Hotspot Clusters</strong>: Interactive density clustering algorithms for geographical hazard identification.</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
              <span><strong>Random Forest Predictor</strong>: Dynamic machine learning probability model trained on-the-fly to evaluate risk scores (0-100%).</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Standby Operations Panel */}
      <div className="bg-brand-card border border-brand-border p-6 rounded-xl shadow-md space-y-4">
        <h3 className="font-display font-bold text-sm text-brand-text uppercase tracking-wider flex items-center gap-2 border-b border-brand-border pb-3">
          <ShieldAlert size={16} className="text-red-500" />
          Emergency Response Protocol
        </h3>
        <p className="text-xs text-gray-400 leading-relaxed font-sans">
          This system operates under classification **CLASS-A MHA**. All citizen distress triggers are logged permanently in the Realtime Database (`sos_history`) and Firestore archive (`incident_history`). Under standard operations, dispatch officers are required to coordinate with the assigned precinct (East/West/Central) within **180 seconds** of active signal capture.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950/40 p-3 rounded-lg border border-brand-border text-center">
            <span className="text-[9px] text-gray-500 block uppercase font-mono">Precision Target</span>
            <span className="text-sm font-bold text-brand-primary font-mono">100% CAD Sync</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-lg border border-brand-border text-center">
            <span className="text-[9px] text-gray-500 block uppercase font-mono">Target Response</span>
            <span className="text-sm font-bold text-green-500 font-mono">&lt; 5 Minutes</span>
          </div>
          <div className="bg-slate-950/40 p-3 rounded-lg border border-brand-border text-center">
            <span className="text-[9px] text-gray-500 block uppercase font-mono">Service Availability</span>
            <span className="text-sm font-bold text-amber-500 font-mono">99.99% Uptime</span>
          </div>
        </div>
      </div>

      {/* Footer credits */}
      <div className="flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-gray-500 pt-4 border-t border-brand-border select-none">
        <span>© 2026 Bengaluru Police Command Center. All rights reserved.</span>
        <span className="flex items-center gap-1 mt-1 sm:mt-0">
          Made with <Heart size={10} className="text-red-500 fill-red-500" /> for Smart City Initiatives
        </span>
      </div>
    </div>
  );
};

export default About;
