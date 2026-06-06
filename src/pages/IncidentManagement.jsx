import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { getIncidents, getOfficers, updateIncidentStatusInFirestore } from "../services/firestoreService";
import { 
  ShieldAlert, 
  UserPlus, 
  CheckCircle, 
  Archive,
  Clock,
  User,
  Lightbulb,
  Phone,
  UserCheck
} from "lucide-react";

const IncidentManagement = () => {
  const { addToast } = useNotifications();
  
  // States
  const [incidents, setIncidents] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [targetCase, setTargetCase] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  const loadIncidents = async () => {
    try {
      const incData = await getIncidents();
      setIncidents(incData);
      
      const offData = await getOfficers();
      setOfficers(offData.filter(o => o.status === "Active"));
    } catch (err) {
      console.error(err);
      addToast("Failed to load incidents feed.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfficer || !targetCase) return;

    const assignedOfficerName = officers.find(o => o.officerId === selectedOfficer)?.name || "Officer";

    try {
      await updateIncidentStatusInFirestore(targetCase.caseId, "IN_PROGRESS", {
        assignedOfficer: assignedOfficerName
      });
      addToast(`Officer ${assignedOfficerName} assigned to Case ${targetCase.caseId}`, "success");
      setShowAssignModal(false);
      setSelectedOfficer("");
      loadIncidents();
    } catch (err) {
      addToast("Failed to reassign officer.", "danger");
    }
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    if (!targetCase) return;

    try {
      await updateIncidentStatusInFirestore(targetCase.caseId, "RESOLVED", {
        resolutionNotes
      });
      addToast(`Case ${targetCase.caseId} resolved successfully.`, "success");
      setShowResolveModal(false);
      setResolutionNotes("");
      loadIncidents();
    } catch (err) {
      addToast("Failed to resolve incident.", "danger");
    }
  };

  const handleArchiveCase = async (caseId) => {
    try {
      await updateIncidentStatusInFirestore(caseId, "SAFE");
      addToast(`Case ${caseId} archived.`, "info");
      loadIncidents();
    } catch (err) {
      addToast("Failed to archive case.", "danger");
    }
  };

  // Separate active vs historical cases on this page
  const activeCases = incidents.filter(i => i.status === "ACTIVE" || i.status === "IN_PROGRESS");
  const closedCases = incidents.filter(i => i.status === "RESOLVED" || i.status === "SAFE");

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
          <ShieldAlert className="text-brand-primary" />
          Incident Dispatch Management
        </h2>
        <p className="text-xs text-gray-400">
          Track, deploy, and resolve police dispatches for local emergencies.
        </p>
      </div>

      {/* Grid: Active Cases */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-danger animate-ping" />
          Active Responses ({activeCases.length})
        </h3>
        
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : activeCases.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCases.map((incident) => (
              <div 
                key={incident.caseId}
                className="bg-brand-card border border-brand-border rounded-xl shadow-lg hover:shadow-xl hover:border-slate-600 transition-all duration-200 p-5 space-y-4"
              >
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-blue-400 font-bold block">{incident.caseId}</span>
                    <h4 className="font-bold text-sm text-brand-text">{incident.citizenName}</h4>
                  </div>
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold tracking-widest ${
                    incident.status === "ACTIVE" 
                      ? "bg-red-950/40 text-brand-danger border-red-500/30 animate-pulse" 
                      : "bg-amber-950/40 text-brand-warning border-amber-500/30"
                  }`}>
                    {incident.status === "ACTIVE" ? "ACTIVE / DEPLOYING" : "IN PROGRESS"}
                  </span>
                </div>

                {/* Details list */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Phone size={14} className="text-gray-500" />
                    <span>{incident.phone || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <User size={14} className="text-gray-500" />
                    <span>Officer: <strong className="text-brand-text">{incident.assignedOfficer || "STANDBY DISPATCH"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-300">
                    <Lightbulb size={14} className="text-gray-500" />
                    <span>Assigned Light: <strong className="text-brand-warning">{incident.assignedLight || "N/A"}</strong></span>
                  </div>
                  <div className="flex items-center gap-2.5 text-gray-400 text-[10px] font-mono">
                    <Clock size={12} />
                    <span>Triggered: {new Date(incident.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                {/* Buttons Action */}
                <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
                  <button
                    onClick={() => {
                      setTargetCase(incident);
                      setShowAssignModal(true);
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-brand-border flex items-center justify-center gap-1.5"
                  >
                    <UserPlus size={12} />
                    Assign
                  </button>
                  <button
                    onClick={() => {
                      setTargetCase(incident);
                      setShowResolveModal(true);
                    }}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle size={12} />
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl font-mono text-xs text-slate-500">
            All incident alerts responded to.
          </div>
        )}
      </div>

      {/* Grid: Resolved History Cases */}
      <div className="pt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
          Archived Cases ({closedCases.length})
        </h3>
        {closedCases.length > 0 ? (
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 border-b border-brand-border text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="p-4">Case ID</th>
                    <th className="p-4">Citizen</th>
                    <th className="p-4">Deployed Officer</th>
                    <th className="p-4">Light Pole</th>
                    <th className="p-4">Date Closed</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-xs">
                  {closedCases.map((incident) => (
                    <tr key={incident.caseId} className="hover:bg-slate-900/40 text-gray-300">
                      <td className="p-4 font-mono font-bold text-blue-400">{incident.caseId}</td>
                      <td className="p-4 font-semibold text-brand-text">{incident.citizenName}</td>
                      <td className="p-4">{incident.assignedOfficer}</td>
                      <td className="p-4 font-mono">{incident.assignedLight}</td>
                      <td className="p-4 text-gray-400">{new Date(incident.resolvedAt || incident.createdAt).toLocaleString()}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          incident.status === "RESOLVED"
                            ? "bg-emerald-950/40 text-brand-success border-emerald-500/20"
                            : "bg-blue-950/40 text-blue-400 border-blue-500/20"
                        }`}>
                          {incident.status}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {incident.status === "RESOLVED" ? (
                          <button
                            onClick={() => handleArchiveCase(incident.caseId)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 uppercase rounded border border-brand-border cursor-pointer flex items-center gap-1.5 mx-auto"
                          >
                            <Archive size={12} />
                            Archive
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">CLOSED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl font-mono text-xs text-slate-500">
            No historical archived cases found.
          </div>
        )}
      </div>

      {/* Assign Officer Modal */}
      {showAssignModal && targetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <UserCheck className="text-brand-primary w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Dispatch Duty Officer
              </h3>
            </div>
            <form onSubmit={handleAssignSubmit} className="p-6 space-y-4">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-mono mb-1">TARGET CASE</span>
                <p className="text-xs text-brand-text font-bold">
                  {targetCase.caseId} // Citizen: {targetCase.citizenName}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Select Active Officer
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
                  onClick={() => setShowAssignModal(false)}
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

      {/* Resolve Incident Case Modal */}
      {showResolveModal && targetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <CheckCircle className="text-brand-success w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Resolve & Archive Case
              </h3>
            </div>
            <form onSubmit={handleResolveSubmit} className="p-6 space-y-4">
              <div>
                <span className="text-gray-500 block text-[10px] uppercase font-mono mb-1">TARGET CASE</span>
                <p className="text-xs text-brand-text font-bold">
                  {targetCase.caseId} // Citizen: {targetCase.citizenName}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Resolution Log Report
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none min-h-[100px]"
                  placeholder="Describe the final outcome of this emergency response..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResolveModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold uppercase rounded-lg text-white cursor-pointer"
                >
                  Confirm Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentManagement;
