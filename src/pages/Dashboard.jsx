import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { 
  subscribeToLiveTracking, 
  subscribeToAnalyticsSummary, 
  subscribeToStreetlights, 
  setLiveTrackingAlert, 
  clearLiveTrackingAlert 
} from "../services/rtdbService";
import { subscribeToIncidents, seedFirestoreData } from "../services/firestoreService";
import { 
  ShieldAlert, 
  CheckCircle, 
  AlertOctagon, 
  Lightbulb, 
  PowerOff, 
  Users, 
  Radio, 
  Sparkles,
  RefreshCw,
  Clock,
  Compass,
  UserCheck
} from "lucide-react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { addToast } = useNotifications();
  
  // Real-time states
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [summary, setSummary] = useState({ activeSOS: 0, resolvedSOS: 59, totalSOS: 59 });
  const [streetlights, setStreetlights] = useState({});
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // 1. Listen to live tracking active alerts from RTDB
    const unsubTracking = subscribeToLiveTracking((alerts) => {
      setActiveAlerts(alerts);
    });

    // 2. Listen to analytics summary counts from RTDB
    const unsubSummary = subscribeToAnalyticsSummary((data) => {
      setSummary(data);
    });

    // 3. Listen to streetlights
    const unsubStreetlights = subscribeToStreetlights((lights) => {
      setStreetlights(lights);
    });

    // 4. Listen to incidents in real-time
    const unsubIncidents = subscribeToIncidents((incs) => {
      setIncidents(incs);
      setLoading(false);
    });

    return () => {
      unsubTracking();
      unsubSummary();
      unsubStreetlights();
      unsubIncidents();
    };
  }, []);

  // Recalculate stats using Realtime Database synchronized values
  const currentAlert = activeAlerts.length > 0 ? activeAlerts[0] : null;
  const activeSOSCount = summary.activeSOS;
  const resolvedCasesCount = summary.resolvedSOS;
  const totalSOSAlerts = summary.totalSOS;
  
  const totalStreetlights = Object.keys(streetlights).length;
  const onlineStreetlights = Object.values(streetlights).filter(s => s.status === "ONLINE").length;
  const offlineStreetlights = totalStreetlights - onlineStreetlights;

  const activeIncidents = incidents.filter(i => i.status === "ACTIVE" || i.status === "IN_PROGRESS");

  // Trigger Mock SOS alert in Firebase Realtime Database
  const triggerTestSOS = async () => {
    const mockUid = "user_mock_" + Math.floor(1000 + Math.random() * 9000);
    const mockSOSId = "SOS-" + mockUid.substring(10);
    const mockNames = ["Aisha Sen", "Vikram Malhotra", "Kiran Joshi", "Siddharth Roy", "Riya Mehta"];
    const mockName = mockNames[Math.floor(Math.random() * mockNames.length)];
    
    // Choose random streetlight near Delhi Police headquarters
    const slChoices = ["SL1", "SL2", "SL3"];
    const selectedSL = slChoices[Math.floor(Math.random() * slChoices.length)];
    
    // Generate coordinate slightly offset from center
    const latOffset = (Math.random() - 0.5) * 0.01;
    const lngOffset = (Math.random() - 0.5) * 0.01;

    const testAlert = {
      alertId: mockSOSId,
      userName: mockName,
      user: mockUid,
      phone: "+91 95555 " + Math.floor(10000 + Math.random() * 90000),
      latitude: 28.6139 + latOffset,
      longitude: 77.2090 + lngOffset,
      timestamp: new Date().toISOString(),
      status: "ACTIVE",
      nearestLight: selectedSL,
      distance: Math.floor(5 + Math.random() * 95) + "m"
    };

    try {
      await setLiveTrackingAlert(mockUid, testAlert);
      addToast(`TEST SOS Simulated: ${mockSOSId} triggered successfully.`, "success");
    } catch (e) {
      addToast("Failed to write simulation SOS alert to Realtime Database.", "danger");
    }
  };

  // Seed default databases
  const handleForceSync = async () => {
    setSyncing(true);
    try {
      // Seed Firestore with mockup data if collections are empty
      await seedFirestoreData();
      addToast("Database collections synchronized and seeded successfully.", "success");
    } catch (e) {
      addToast("Sync failed. Check firestore settings.", "danger");
    } finally {
      setSyncing(false);
    }
  };

  const handleResolveAlert = async () => {
    const targetUid = currentAlert ? currentAlert.uid : null;
    if (!targetUid) return;
    try {
      await clearLiveTrackingAlert(targetUid);
      addToast("Active SOS alert cleared from live channel.", "success");
    } catch (e) {
      console.error(e);
      addToast("Failed to resolve active alert.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Header with Refresh/Sync */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text">
            Command Dashboard
          </h2>
          <p className="text-xs text-gray-400">
            Real-time operations center for SOS interception and streetlight tracking.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-brand-border rounded-lg text-xs font-bold uppercase tracking-wider text-gray-300 disabled:opacity-50 cursor-pointer"
            title="Seed Initial Database Data"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
            <span>Seed Database</span>
          </button>
        </div>
      </div>

      {/* Stats Counter Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Active SOS card */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center justify-between shadow-md relative overflow-hidden">
          {activeSOSCount > 0 && (
            <div className="absolute top-0 right-0 left-0 h-1 bg-brand-danger animate-pulse" />
          )}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Active SOS</span>
            <h3 className={`font-display font-extrabold text-3xl tracking-tight ${activeSOSCount > 0 ? "text-brand-danger animate-pulse" : "text-brand-text"}`}>
              {activeSOSCount}
            </h3>
          </div>
          <div className={`p-3 rounded-lg ${activeSOSCount > 0 ? "bg-red-500/10 text-brand-danger animate-pulse" : "bg-slate-800 text-gray-400"}`}>
            <AlertOctagon size={22} />
          </div>
        </div>

        {/* Resolved cases */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Resolved Cases</span>
            <h3 className="font-display font-extrabold text-3xl tracking-tight text-brand-success">
              {resolvedCasesCount}
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10 text-brand-success">
            <CheckCircle size={22} />
          </div>
        </div>

        {/* Total SOS */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Alerts</span>
            <h3 className="font-display font-extrabold text-3xl tracking-tight text-blue-400">
              {totalSOSAlerts}
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-400">
            <Radio size={22} className="animate-pulse" />
          </div>
        </div>

        {/* Online Streetlights */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lights Online</span>
            <h3 className="font-display font-extrabold text-3xl tracking-tight text-green-400">
              {onlineStreetlights} <span className="text-xs font-normal text-slate-500">/ {totalStreetlights || 4}</span>
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-green-500/10 text-green-400">
            <Lightbulb size={22} />
          </div>
        </div>

        {/* Offline Streetlights */}
        <div className="bg-brand-card border border-brand-border p-5 rounded-xl flex items-center justify-between shadow-md">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Lights Offline</span>
            <h3 className="font-display font-extrabold text-3xl tracking-tight text-amber-500">
              {offlineStreetlights}
            </h3>
          </div>
          <div className="p-3 rounded-lg bg-amber-500/10 text-brand-warning">
            <PowerOff size={22} />
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Live Alerts & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Incident Broadcast Center */}
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-6">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text border-b border-brand-border pb-3 mb-4 flex items-center gap-2">
              <Radio size={16} className="text-brand-danger animate-pulse" />
              Live Emergency Intercept
            </h4>

            {currentAlert ? (
              <div className="bg-slate-900 border border-brand-border rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 rounded-full bg-brand-danger animate-ping" />
                    <div>
                      <h5 className="font-bold text-base text-brand-text flex items-center gap-2">
                        {currentAlert.userName}
                      </h5>
                      <p className="text-xs text-gray-400">Phone: {currentAlert.phone}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 bg-red-950/40 text-brand-danger border border-red-500/30 rounded uppercase font-bold tracking-widest animate-pulse">
                    CRITICAL SOS ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-950 rounded-lg text-xs font-mono">
                  <div>
                    <span className="text-gray-500 block">ALERT ID</span>
                    <span className="text-brand-text font-bold">{currentAlert.alertId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">NEAREST POLE</span>
                    <span className="text-brand-text font-bold text-brand-warning">{currentAlert.nearestLight || "SL1"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">DISTANCE</span>
                    <span className="text-brand-text font-bold text-green-400">{currentAlert.distance || "32m"}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">COORDINATES</span>
                    <span className="text-brand-text font-bold truncate block" title={`${currentAlert.latitude}, ${currentAlert.longitude}`}>
                      {currentAlert.latitude?.toFixed(4)}, {currentAlert.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    to="/map"
                    className="flex-1 min-w-[120px] text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Locate on Map
                  </Link>
                  <button
                    onClick={handleResolveAlert}
                    className="flex-1 min-w-[120px] py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
                <Compass className="w-10 h-10 text-slate-700 mb-3 animate-spin" style={{ animationDuration: "12s" }} />
                <h5 className="font-semibold text-sm text-slate-400">No active SOS signals detected</h5>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  All channels clear. Authorities will be notified immediately when a mobile SOS trigger occurs.
                </p>
              </div>
            )}
          </div>

          {/* Quick Actions Panel */}
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-6">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text border-b border-brand-border pb-3 mb-4">
              Simulation & Quick Actions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Trigger Mock SOS */}
              <button
                onClick={triggerTestSOS}
                className="flex items-center gap-4 p-4 bg-red-950/20 hover:bg-red-900/40 border border-red-500/10 hover:border-red-500/30 rounded-xl transition-all duration-200 text-left group cursor-pointer"
              >
                <div className="p-3 bg-red-500/10 text-brand-danger rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <ShieldAlert size={20} className="animate-pulse" />
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-wide text-brand-danger block">Trigger Test SOS</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Simulates a mobile app panic alert.</span>
                </div>
              </button>

              {/* View Map */}
              <Link
                to="/map"
                className="flex items-center gap-4 p-4 bg-blue-950/20 hover:bg-blue-900/40 border border-blue-500/10 hover:border-blue-500/30 rounded-xl transition-all duration-200 text-left group shrink-0"
              >
                <div className="p-3 bg-blue-500/10 text-brand-primary rounded-lg group-hover:scale-105 transition-transform shrink-0">
                  <Compass size={20} />
                </div>
                <div>
                  <span className="font-bold text-xs uppercase tracking-wide text-blue-400 block">GIS Map Monitor</span>
                  <span className="text-[10px] text-gray-400 mt-0.5 block">Map overview of police units and poles.</span>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Incident Feed */}
        <div className="space-y-6">
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-6 h-full flex flex-col">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text border-b border-brand-border pb-3 mb-4 flex items-center justify-between">
              <span>Active Incident Feed</span>
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-brand-primary border border-blue-500/20 text-[10px] font-mono">
                {activeIncidents.length} RUNNING
              </span>
            </h4>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : activeIncidents.length > 0 ? (
                activeIncidents.map((incident) => (
                  <div 
                    key={incident.caseId}
                    className="p-4 bg-slate-900 border border-brand-border rounded-lg space-y-2 relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono font-bold text-blue-400">
                        {incident.caseId}
                      </span>
                      <span className={`text-[8px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-wide ${
                        incident.status === "ACTIVE" 
                          ? "bg-red-950/40 text-brand-danger border-red-500/30" 
                          : "bg-amber-950/40 text-brand-warning border-amber-500/30"
                      }`}>
                        {incident.status}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="text-gray-400 block text-[10px]">CITIZEN</span>
                      <span className="font-semibold text-brand-text">{incident.citizenName}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-slate-800 pt-2 font-mono">
                      <div>
                        <span className="text-gray-500 block">OFFICER</span>
                        <span className="text-gray-300 truncate block">{incident.assignedOfficer || "UNASSIGNED"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">STREETLIGHT</span>
                        <span className="text-gray-300 block">{incident.assignedLight || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs">
                  <UserCheck className="w-8 h-8 text-slate-700 mb-2" />
                  <span>No active dispatches</span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-brand-border mt-auto">
              <Link
                to="/incidents"
                className="block text-center py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors border border-brand-border cursor-pointer"
              >
                Dispatch Management
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
