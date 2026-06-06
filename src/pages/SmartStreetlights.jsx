import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToStreetlights, updateStreetlight } from "../services/rtdbService";
import { 
  Lightbulb, 
  Battery, 
  MapPin, 
  Clock, 
  Activity, 
  AlertCircle,
  Zap,
  ZapOff,
  Wrench,
  RefreshCw
} from "lucide-react";

const SmartStreetlights = () => {
  const { addToast } = useNotifications();
  const [streetlights, setStreetlights] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal control
  const [showEditModal, setShowEditModal] = useState(false);
  const [targetPole, setTargetPole] = useState(null);
  const [newMode, setNewMode] = useState("NORMAL");
  const [newStatus, setNewStatus] = useState("ONLINE");
  const [newBattery, setNewBattery] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeToStreetlights((lights) => {
      setStreetlights(lights);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!targetPole) return;

    setSubmitting(true);
    try {
      await updateStreetlight(targetPole.id, {
        state: newMode,
        status: newStatus,
        battery: Number(newBattery),
        lastActivated: new Date().toISOString()
      });
      addToast(`Streetlight ${targetPole.id} configuration updated.`, "success");
      setShowEditModal(false);
    } catch (err) {
      addToast(`Failed to update ${targetPole.id}.`, "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const getBatteryIconColor = (level) => {
    if (level > 70) return "text-brand-success";
    if (level > 30) return "text-brand-warning";
    return "text-brand-danger animate-pulse";
  };

  const getModeLabelColor = (mode) => {
    switch (mode) {
      case "ACTIVE":
        return "bg-blue-950 text-blue-400 border-blue-500/20";
      case "MAINTENANCE":
        return "bg-amber-950 text-brand-warning border-amber-500/20";
      case "OFFLINE":
        return "bg-slate-900 text-gray-500 border-slate-700";
      default:
        return "bg-emerald-950 text-brand-success border-emerald-500/20";
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
          <Lightbulb className="text-brand-warning" />
          Smart Streetlights Monitor
        </h2>
        <p className="text-xs text-gray-400">
          Track battery health, online connectivity, and dimming modes of ESP8266-linked streetlights.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : Object.keys(streetlights).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.keys(streetlights).map((key) => {
            const pole = streetlights[key];
            return (
              <div 
                key={pole.id}
                className="bg-brand-card border border-brand-border rounded-xl shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200 p-5 space-y-4 relative overflow-hidden"
              >
                {/* Decorative status bar */}
                <div className={`absolute top-0 left-0 right-0 h-1 ${
                  pole.status === "ONLINE" ? "bg-brand-success" : "bg-brand-danger"
                }`} />

                {/* Pole Title */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-gray-400 font-bold block">IOT POLE ID</span>
                    <h4 className="font-bold text-sm text-brand-text flex items-center gap-2">
                      {pole.id}
                      {pole.battery < 20 && pole.status === "ONLINE" && (
                        <AlertCircle className="w-4 h-4 text-brand-danger animate-bounce" title="Low Battery Warning!" />
                      )}
                    </h4>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${
                    pole.status === "ONLINE" 
                      ? "bg-emerald-950/40 text-brand-success border-emerald-500/20" 
                      : "bg-red-950/40 text-brand-danger border-red-500/20"
                  }`}>
                    {pole.status}
                  </span>
                </div>

                {/* Grid details */}
                <div className="space-y-2.5 text-xs">
                  {/* Battery */}
                  <div className="flex items-center justify-between text-gray-300">
                    <div className="flex items-center gap-2">
                      <Battery size={14} className="text-gray-500" />
                      <span>Battery Charge</span>
                    </div>
                    <span className={`font-mono font-bold ${getBatteryIconColor(pole.battery)}`}>
                      {pole.battery}%
                    </span>
                  </div>

                  {/* Mode */}
                  <div className="flex items-center justify-between text-gray-300">
                    <div className="flex items-center gap-2">
                      <Activity size={14} className="text-gray-500" />
                      <span>Operation Mode</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${getModeLabelColor(pole.state)}`}>
                      {pole.state}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="flex items-center justify-between text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-500" />
                      <span>GPS Coordinates</span>
                    </div>
                    <span className="font-mono text-[10px] text-gray-400">
                      {pole.latitude?.toFixed(4)}, {pole.longitude?.toFixed(4)}
                    </span>
                  </div>

                  {/* Last activity */}
                  <div className="flex items-center justify-between text-gray-400 text-[10px] font-mono border-t border-slate-800 pt-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>Last Activity</span>
                    </div>
                    <span>{new Date(pole.lastActivated || Date.now()).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Edit Button */}
                <button
                  onClick={() => {
                    setTargetPole(pole);
                    setNewMode(pole.state);
                    setNewStatus(pole.status);
                    setNewBattery(pole.battery);
                    setShowEditModal(true);
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-brand-border rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Wrench size={12} />
                  Configure Pole
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl font-mono text-xs text-slate-500">
          No streetlights online. Check Realtime Database configuration.
        </div>
      )}

      {/* Configure Pole Modal */}
      {showEditModal && targetPole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <Wrench className="text-brand-primary w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Configure Pole {targetPole.id}
              </h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {/* Operation Mode */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Operation Mode
                </label>
                <select
                  value={newMode}
                  onChange={(e) => setNewMode(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                >
                  <option value="NORMAL">NORMAL (Energy Saving)</option>
                  <option value="ACTIVE">ACTIVE (Full Brightness)</option>
                  <option value="OFFLINE">OFFLINE (Blackout)</option>
                  <option value="MAINTENANCE">MAINTENANCE (Repair Signal)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Connectivity Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                >
                  <option value="ONLINE">ONLINE</option>
                  <option value="OFFLINE">OFFLINE</option>
                </select>
              </div>

              {/* Battery level */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Battery level ({newBattery}%)
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={newBattery} 
                  onChange={(e) => setNewBattery(e.target.value)} 
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase rounded-lg text-white disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Applying..." : "Apply Config"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartStreetlights;
