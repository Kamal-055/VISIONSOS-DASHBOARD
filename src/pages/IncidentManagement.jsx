import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToIncidents, subscribeToOfficers, updateIncidentStatusInFirestore } from "../services/firestoreService";
import { 
  ShieldAlert, 
  UserPlus, 
  CheckCircle, 
  Archive,
  Clock,
  User,
  Lightbulb,
  Phone,
  UserCheck,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const IncidentManagement = () => {
  const { addToast } = useNotifications();
  
  // Real-time Database States
  const [incidents, setIncidents] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [targetCase, setTargetCase] = useState(null);
  const [selectedOfficer, setSelectedOfficer] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Search, Filter, Sort, Pagination States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const unsubIncidents = subscribeToIncidents((incs) => {
      setIncidents(incs);
      setLoading(false);
    });

    const unsubOfficers = subscribeToOfficers((offs) => {
      setOfficers(offs.filter(o => o.status === "Active"));
    });

    return () => {
      unsubIncidents();
      unsubOfficers();
    };
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
      setTargetCase(null);
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
      setTargetCase(null);
    } catch (err) {
      addToast("Failed to resolve incident.", "danger");
    }
  };

  const handleArchiveCase = async (caseId) => {
    try {
      await updateIncidentStatusInFirestore(caseId, "SAFE");
      addToast(`Case ${caseId} archived as SAFE.`, "info");
    } catch (err) {
      addToast("Failed to archive case.", "danger");
    }
  };

  const handleStatusTransition = async (caseId, newStatus) => {
    try {
      const updates = {
        lastUpdated: new Date().toISOString()
      };
      if (newStatus === "RESOLVED" || newStatus === "SAFE") {
        updates.resolvedAt = new Date().toISOString();
      }
      await updateIncidentStatusInFirestore(caseId, newStatus, updates);
      addToast(`Incident ${caseId} transitioned to status ${newStatus}.`, "success");
    } catch (err) {
      addToast("Failed to transition status: " + err.message, "danger");
    }
  };

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setCurrentPage(1);
  };

  // 1. Filter Logic
  const filteredIncidents = React.useMemo(() => {
    return incidents.filter((inc) => {
      // Search matches: Case ID, Citizen Name, or Deployed Officer
      const caseIdStr = inc.caseId || inc.id || "";
      const citizenNameStr = inc.citizenName || "";
      const officerStr = inc.assignedOfficer || "";
      
      const matchesSearch = 
        caseIdStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        citizenNameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        officerStr.toLowerCase().includes(searchTerm.toLowerCase());

      // Status Filter Match
      const matchesStatus = statusFilter === "ALL" || inc.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [incidents, searchTerm, statusFilter]);

  // 2. Sort Logic
  const sortedIncidents = React.useMemo(() => {
    const sorted = [...filteredIncidents];
    sorted.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "createdAt" || sortField === "resolvedAt") {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortDirection === "asc" ? -1 : 1;
      if (valA > valB) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredIncidents, sortField, sortDirection]);

  // 3. Pagination Logic
  const paginatedIncidents = React.useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedIncidents.slice(startIndex, startIndex + pageSize);
  }, [sortedIncidents, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedIncidents.length / pageSize);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, pageSize]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
          <ShieldAlert className="text-brand-primary animate-pulse" />
          Incident Dispatch Table
        </h2>
        <p className="text-xs text-gray-400">
          Real-time interactive monitoring database of police dispatches and active emergencies.
        </p>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-brand-card border border-brand-border p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-md">
        <div className="flex flex-1 min-w-[280px] max-w-md items-center gap-2 px-3 py-2 bg-slate-950 border border-brand-border rounded-lg focus-within:border-brand-primary">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search by Case ID, Citizen, Deployed Officer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 bg-transparent text-xs text-brand-text border-none focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Filter size={14} />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1.5 bg-slate-950 border border-brand-border rounded text-xs text-brand-text font-semibold uppercase focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL CASES</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
              <option value="RESPONDER_ASSIGNED">RESPONDER ASSIGNED</option>
              <option value="IN_PROGRESS">IN PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
              <option value="SAFE">SAFE</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1.5 bg-slate-950 border border-brand-border rounded text-xs text-brand-text font-semibold focus:outline-none cursor-pointer"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Grid */}
      <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : sortedIncidents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-brand-border text-[10px] font-bold uppercase tracking-wider text-gray-400 select-none">
                  <th className="p-4 cursor-pointer hover:text-brand-text" onClick={() => handleSort("caseId")}>
                    <div className="flex items-center gap-1">
                      Incident ID <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-brand-text" onClick={() => handleSort("citizenName")}>
                    <div className="flex items-center gap-1">
                      User ID / Citizen <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4">Latitude</th>
                  <th className="p-4">Longitude</th>
                  <th className="p-4 cursor-pointer hover:text-brand-text" onClick={() => handleSort("createdAt")}>
                    <div className="flex items-center gap-1">
                      Time Created <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-brand-text" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">
                      Current Status <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-brand-text" onClick={() => handleSort("assignedOfficer")}>
                    <div className="flex items-center gap-1">
                      Assigned Officer <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 cursor-pointer hover:text-brand-text" onClick={() => handleSort("resolvedAt")}>
                    <div className="flex items-center gap-1">
                      Resolution Time <ArrowUpDown size={10} />
                    </div>
                  </th>
                  <th className="p-4 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs font-mono">
                {paginatedIncidents.map((incident) => {
                  const lat = incident.location?.latitude || incident.latitude || 12.9585;
                  const lng = incident.location?.longitude || incident.longitude || 77.5530;
                  
                  return (
                    <tr key={incident.caseId || incident.id} className="hover:bg-slate-900/40 text-gray-300 transition-colors">
                      <td className="p-4 font-bold text-blue-400">{incident.caseId || incident.id}</td>
                      <td className="p-4 font-sans text-brand-text font-semibold">{incident.citizenName}</td>
                      <td className="p-4 text-gray-400">{lat.toFixed(5)}</td>
                      <td className="p-4 text-gray-400">{lng.toFixed(5)}</td>
                      <td className="p-4 text-gray-400">
                        {new Date(incident.createdAt).toLocaleTimeString()}
                        <span className="text-[10px] text-gray-500 block">
                          {new Date(incident.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="p-4 font-sans">
                        <select
                          value={incident.status}
                          onChange={(e) => handleStatusTransition(incident.caseId || incident.id, e.target.value)}
                          className={`bg-slate-950 border border-brand-border rounded px-2.5 py-1.5 text-[10px] font-sans font-bold uppercase cursor-pointer focus:outline-none transition-colors ${
                            incident.status === "ACTIVE" ? "text-brand-danger border-red-500/30" :
                            incident.status === "ACKNOWLEDGED" ? "text-blue-400 border-blue-500/30" :
                            incident.status === "RESPONDER_ASSIGNED" ? "text-purple-400 border-purple-500/30" :
                            incident.status === "IN_PROGRESS" ? "text-amber-500 border-amber-500/30" :
                            incident.status === "RESOLVED" ? "text-brand-success border-emerald-500/30" :
                            "text-gray-400 border-slate-700"
                          }`}
                        >
                          <option value="ACTIVE" className="text-brand-danger bg-slate-950">ACTIVE</option>
                          <option value="ACKNOWLEDGED" className="text-blue-400 bg-slate-950">ACKNOWLEDGED</option>
                          <option value="RESPONDER_ASSIGNED" className="text-purple-400 bg-slate-950">RESPONDER ASSIGNED</option>
                          <option value="IN_PROGRESS" className="text-amber-500 bg-slate-950">IN PROGRESS</option>
                          <option value="RESOLVED" className="text-brand-success bg-slate-950">RESOLVED</option>
                          <option value="SAFE" className="text-emerald-400 bg-slate-950">SAFE (ARCHIVED)</option>
                        </select>
                      </td>
                      <td className="p-4 font-sans text-gray-300">
                        {incident.assignedOfficer || (
                          <span className="text-[10px] font-mono text-gray-500 italic">STANDBY DISPATCH</span>
                        )}
                      </td>
                      <td className="p-4 text-gray-400">
                        {incident.resolvedAt ? (
                          <>
                            {new Date(incident.resolvedAt).toLocaleTimeString()}
                            <span className="text-[10px] text-gray-500 block">
                              {new Date(incident.resolvedAt).toLocaleDateString()}
                            </span>
                          </>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-950/40 text-brand-danger border border-red-500/20 font-bold tracking-widest animate-pulse">
                            ACTIVE
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 font-sans">
                          {(incident.status === "ACTIVE" || incident.status === "ACKNOWLEDGED") && (
                            <button
                              onClick={() => {
                                setTargetCase(incident);
                                setShowAssignModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-200 rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer border border-brand-border flex items-center gap-1.5"
                              title="Assign Patrol Officer"
                            >
                              <UserPlus size={12} />
                              Assign
                            </button>
                          )}
                          {(incident.status === "IN_PROGRESS" || incident.status === "RESPONDER_ASSIGNED") && (
                            <button
                              onClick={() => {
                                setTargetCase(incident);
                                setShowResolveModal(true);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                              title="Mark Incident Resolved"
                            >
                              <CheckCircle size={12} />
                              Resolve
                            </button>
                          )}
                          {incident.status === "RESOLVED" && (
                            <button
                              onClick={() => handleArchiveCase(incident.caseId || incident.id)}
                              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 uppercase rounded border border-brand-border cursor-pointer flex items-center gap-1.5"
                              title="Archive case details"
                            >
                              <Archive size={12} />
                              Archive
                            </button>
                          )}
                          {incident.status === "SAFE" && (
                            <span className="text-[10px] font-mono text-slate-500 italic">CLOSED</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center select-none">
            <ShieldAlert className="w-12 h-12 text-slate-500/30 mx-auto mb-3" />
            <h3 className="font-display font-bold text-sm uppercase text-slate-400 tracking-wider">
              No matching dispatches found
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              Try adjusting your search criteria or choosing a different status filter.
            </p>
          </div>
        )}

        {/* Table Pagination Footer */}
        {sortedIncidents.length > 0 && (
          <div className="bg-slate-900 border-t border-brand-border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 select-none">
            <div>
              Showing <strong className="text-brand-text">{(currentPage - 1) * pageSize + 1}</strong> to{" "}
              <strong className="text-brand-text">
                {Math.min(currentPage * pageSize, sortedIncidents.length)}
              </strong>{" "}
              of <strong className="text-brand-text">{sortedIncidents.length}</strong> entries
            </div>

            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  className="p-1.5 bg-slate-950 border border-brand-border hover:border-slate-600 rounded text-brand-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                
                {Array.from({ length: totalPages }).map((_, i) => {
                  const pg = i + 1;
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`px-3 py-1 border rounded font-bold transition-all cursor-pointer ${
                        currentPage === pg
                          ? "bg-brand-primary border-brand-primary text-white"
                          : "bg-slate-950 border-brand-border hover:border-slate-600 text-gray-400"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  className="p-1.5 bg-slate-950 border border-brand-border hover:border-slate-600 rounded text-brand-text disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign Officer Modal */}
      {showAssignModal && targetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
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
                  {targetCase.caseId || targetCase.id} // Citizen: {targetCase.citizenName}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Select Active Officer
                </label>
                <select
                  value={selectedOfficer}
                  onChange={(e) => setSelectedOfficer(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none cursor-pointer"
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
                    setTargetCase(null);
                    setSelectedOfficer("");
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

      {/* Resolve Incident Case Modal */}
      {showResolveModal && targetCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 animate-fadeIn">
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
                  {targetCase.caseId || targetCase.id} // Citizen: {targetCase.citizenName}
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
                  onClick={() => {
                    setShowResolveModal(false);
                    setTargetCase(null);
                    setResolutionNotes("");
                  }}
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
