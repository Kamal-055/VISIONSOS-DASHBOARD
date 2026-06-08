import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToActiveIncidents, clearCurrentAlertInRTDB, subscribeToStreetlights } from "../services/rtdbService";
import { subscribeToOfficers, addSOSHistoryRecord, createIncident } from "../services/firestoreService";
import { 
  AlertTriangle, 
  MapPin, 
  UserCheck, 
  CheckCircle, 
  ShieldAlert, 
  Trash2,
  Clock,
  Compass,
  AlertOctagon,
  Radio
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LiveAlerts = () => {
  const { addToast, setSirenPlaying } = useNotifications();
  const navigate = useNavigate();
  
  // States
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [selectedTargetAlert, setSelectedTargetAlert] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [streetlights, setStreetlights] = useState({});
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolveType, setResolveType] = useState("RESOLVED"); // RESOLVED or SAFE

  useEffect(() => {
    // Subscribe to live concurrent active alerts
    const unsub = subscribeToActiveIncidents((alerts) => {
      setActiveAlerts(alerts);
    });

    // Subscribe to officers list from Firestore in real-time
    const unsubOfficers = subscribeToOfficers((data) => {
      setOfficers(data.filter(o => o.status === "Active"));
    });

    // Subscribe to smart streetlights
    const unsubLights = subscribeToStreetlights((lights) => {
      setStreetlights(lights);
    });

    return () => {
      unsub();
      unsubOfficers();
      unsubLights();
    };
  }, []);

  // Calculate nearest pole dynamically for a specific alert
  const getNearestPole = (alert) => {
    if (!alert || !streetlights || Object.keys(streetlights).length === 0) return { id: "SL1", distance: "30m" };
    
    let nearestId = "SL1";
    let minDistance = Infinity;

    const lat1 = alert.latitude;
    const lon1 = alert.longitude;

    Object.keys(streetlights).forEach(key => {
      const pole = streetlights[key];
      if (pole && typeof pole.latitude === 'number' && typeof pole.longitude === 'number') {
        const lat2 = pole.latitude;
        const lon2 = pole.longitude;

        const R = 6371; // km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const dist = R * c * 1000; // meters

        if (dist < minDistance) {
          minDistance = dist;
          nearestId = pole.id || key;
        }
      }
    });

    return {
      id: nearestId,
      distance: Math.round(minDistance) + "m"
    };
  };

  const handleAssignOfficerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfficer || !selectedTargetAlert) {
      addToast("Please select an officer.", "warning");
      return;
    }

    const assignedOfficerName = officers.find(o => o.officerId === selectedOfficer)?.name || "Officer";
    const targetNearest = selectedTargetAlert.nearestLight || getNearestPole(selectedTargetAlert).id;
    const targetDistance = selectedTargetAlert.distance || getNearestPole(selectedTargetAlert).distance;

    try {
      // Create active case in incident_history
      const newCaseId = "CASE-" + Math.floor(1000 + Math.random() * 9000);
      const incidentData = {
        caseId: newCaseId,
        citizenName: selectedTargetAlert.userName,
        phone: selectedTargetAlert.phone,
        assignedOfficer: assignedOfficerName,
        assignedLight: targetNearest,
        status: "IN_PROGRESS",
        location: {
          latitude: selectedTargetAlert.latitude,
          longitude: selectedTargetAlert.longitude
        }
      };
      
      await createIncident(incidentData);

      // Save alert snapshot to SOS history with IN_PROGRESS marker
      await addSOSHistoryRecord({
        alertId: selectedTargetAlert.alertId || selectedTargetAlert.id,
        userName: selectedTargetAlert.userName,
        phone: selectedTargetAlert.phone,
        latitude: selectedTargetAlert.latitude,
        longitude: selectedTargetAlert.longitude,
        nearestLight: targetNearest,
        distance: targetDistance,
        timestamp: selectedTargetAlert.timestamp,
        status: "IN_PROGRESS",
        priority: selectedTargetAlert.priority || "HIGH",
        resolvedBy: assignedOfficerName,
        resolutionNotes: `Assigned case to officer: ${assignedOfficerName}. Dispatch ID: ${newCaseId}`
      });

      // Clear alert from live feed
      await clearCurrentAlertInRTDB(selectedTargetAlert.alertId || selectedTargetAlert.id, {
        status: "IN_PROGRESS",
        resolvedBy: assignedOfficerName,
        resolutionNotes: `Assigned case to officer: ${assignedOfficerName}. Dispatch ID: ${newCaseId}`,
        nearestLight: targetNearest,
        distance: targetDistance
      });

      if (activeAlerts.length <= 1) {
        setSirenPlaying(false);
      }
      setShowAssignModal(false);
      setSelectedOfficer("");
      setSelectedTargetAlert(null);
      addToast(`Dispatch created: ${newCaseId}. ${assignedOfficerName} deployed.`, "success");
    } catch (err) {
      addToast("Failed to assign officer: " + err.message, "danger");
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTargetAlert) return;

    const targetNearest = selectedTargetAlert.nearestLight || getNearestPole(selectedTargetAlert).id;
    const targetDistance = selectedTargetAlert.distance || getNearestPole(selectedTargetAlert).distance;

    try {
      // Archive to history
      await addSOSHistoryRecord({
        alertId: selectedTargetAlert.alertId || selectedTargetAlert.id,
        userName: selectedTargetAlert.userName,
        phone: selectedTargetAlert.phone,
        latitude: selectedTargetAlert.latitude,
        longitude: selectedTargetAlert.longitude,
        nearestLight: targetNearest,
        distance: targetDistance,
        timestamp: selectedTargetAlert.timestamp,
        status: resolveType,
        priority: selectedTargetAlert.priority || "HIGH",
        resolvedBy: "HQ Command Center",
        resolutionNotes: resolutionNotes || `Alert marked as ${resolveType} by dispatcher.`
      });

      // Clear from RTDB with full details
      await clearCurrentAlertInRTDB(selectedTargetAlert.alertId || selectedTargetAlert.id, {
        status: resolveType,
        resolvedBy: "HQ Command Center",
        resolutionNotes: resolutionNotes || `Alert marked as ${resolveType} by dispatcher.`,
        nearestLight: targetNearest,
        distance: targetDistance
      });

      if (activeAlerts.length <= 1) {
        setSirenPlaying(false);
      }
      setShowResolveModal(false);
      setResolutionNotes("");
      setSelectedTargetAlert(null);
      addToast(`Alert ${selectedTargetAlert.alertId || selectedTargetAlert.id} resolved as ${resolveType} and archived.`, "success");
    } catch (err) {
      addToast("Resolution failed: " + err.message, "danger");
    }
  };

  const handleDeleteAlert = async (alert) => {
    if (!window.confirm(`Are you sure you want to delete live alert ${alert.alertId || alert.id}? This action clears the live broadcast without saving history.`)) return;
    try {
      await clearCurrentAlertInRTDB(alert.alertId || alert.id, {
        status: "RESOLVED",
        resolvedBy: "HQ Command Center",
        resolutionNotes: "Live active alert signal discarded."
      });
      if (activeAlerts.length <= 1) {
        setSirenPlaying(false);
      }
      addToast("Live alert deleted from channel.", "info");
    } catch (e) {
      addToast("Failed to delete alert.", "danger");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
          <AlertOctagon className="text-brand-danger animate-pulse" />
          Live Active Alerts
        </h2>
        <p className="text-xs text-gray-400">
          Monitor incoming emergency broadcast streams from citizen mobile devices.
        </p>
      </div>

      {/* Main Alerts Listing */}
      <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg overflow-hidden">
        {activeAlerts && activeAlerts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-brand-border text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="p-4">Alert / Incident ID</th>
                  <th className="p-4">Device ID</th>
                  <th className="p-4">Citizen</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Nearest Light</th>
                  <th className="p-4">Distance</th>
                  <th className="p-4">Incident Coordinates</th>
                  <th className="p-4">Time Triggered</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {activeAlerts.map((alert) => {
                  const nearestLightId = alert.assignedStreetlight || alert.nearestLight || getNearestPole(alert).id;
                  const distVal = alert.distance || getNearestPole(alert).distance;
                  return (
                    <tr key={alert.alertId || alert.id} className="hover:bg-slate-900/40 transition-colors duration-1000">
                      <td className="p-4 font-mono font-bold text-brand-danger">
                        {alert.alertId || alert.id}
                      </td>
                      <td className="p-4 font-mono text-gray-400">
                        {alert.deviceId || "DEV-N/A"}
                      </td>
                      <td className="p-4 font-semibold text-brand-text">
                        {alert.userName}
                      </td>
                      <td className="p-4 text-gray-300">
                        {alert.phone}
                      </td>
                      <td className="p-4 text-brand-warning font-mono">
                        {nearestLightId}
                      </td>
                      <td className="p-4 text-green-400 font-mono">
                        {distVal}
                      </td>
                      <td className="p-4 text-gray-300 font-mono">
                        {alert.latitude?.toFixed(5)}, {alert.longitude?.toFixed(5)}
                      </td>
                      <td className="p-4 text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${
                          alert.status === "ACTIVE"
                            ? "bg-red-950 text-brand-danger border border-red-500/30 animate-pulse"
                            : "bg-amber-950 text-brand-warning border border-amber-500/30"
                        }`}>
                          {alert.status || "ACTIVE"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => navigate("/map")}
                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Locate Alert on Leaflet Map"
                          >
                            <Compass size={14} />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedTargetAlert(alert);
                              setShowAssignModal(true);
                            }}
                            className="p-2 bg-brand-primary hover:bg-blue-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Deploy Patrol Officer"
                          >
                            <UserCheck size={14} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTargetAlert(alert);
                              setResolveType("RESOLVED");
                              setShowResolveModal(true);
                            }}
                            className="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Mark Case Resolved"
                          >
                            <CheckCircle size={14} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedTargetAlert(alert);
                              setResolveType("SAFE");
                              setShowResolveModal(true);
                            }}
                            className="p-2 bg-teal-600 hover:bg-teal-700 text-white rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Verify Citizen Safe"
                          >
                            <ShieldAlert size={14} />
                          </button>

                          <button
                            onClick={() => handleDeleteAlert(alert)}
                            className="p-2 bg-red-950/40 text-red-400 hover:bg-red-900 border border-red-500/20 rounded text-[10px] font-bold uppercase transition-colors cursor-pointer"
                            title="Discard Signal"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center p-6">
            <Radio className="w-12 h-12 text-slate-700 mb-4 animate-ping" />
            <h3 className="font-display font-bold text-sm uppercase text-slate-400 tracking-wider">
              CAD Channels Quiet
            </h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm">
              There are currently no active SOS broadcast alerts. Use the simulation console on the home dashboard to trigger a test emergency.
            </p>
          </div>
        )}
      </div>

      {/* Deploy Patrol Officer Modal */}
      {showAssignModal && selectedTargetAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <UserCheck className="text-brand-primary w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Dispatch Duty Officer
              </h3>
            </div>
            <form onSubmit={handleAssignOfficerSubmit} className="p-6 space-y-4">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-mono mb-1">TARGET INCIDENT</span>
                <p className="text-xs text-brand-text font-bold">
                  {selectedTargetAlert.alertId || selectedTargetAlert.id} // User: {selectedTargetAlert.userName}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Select Officer on Standby
                </label>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                  required
                >
                  <option value="">-- Choose Officer --</option>
                  {officers.map((off) => (
                    <option key={off.officerId} value={off.officerId}>
                      {off.name} ({off.rank}) • Badge: {off.badgeNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedTargetAlert(null);
                  }}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase rounded-lg text-white cursor-pointer"
                >
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve SOS Modal */}
      {showResolveModal && selectedTargetAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <CheckCircle className="text-brand-success w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Resolve Emergency Alert
              </h3>
            </div>
            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-mono mb-1">TARGET INCIDENT</span>
                <p className="text-xs text-brand-text font-bold">
                  {selectedTargetAlert.alertId || selectedTargetAlert.id} // User: {selectedTargetAlert.userName}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Resolution Log Notes
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none min-h-[100px]"
                  placeholder="Enter details about safety checks, police dispatch results, or actions taken..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowResolveModal(false);
                    setSelectedTargetAlert(null);
                  }}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold uppercase rounded-lg text-white cursor-pointer"
                >
                  Archive & Clear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveAlerts;
