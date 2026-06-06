import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { getSOSHistory } from "../services/firestoreService";
import { 
  Database, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileText,
  Clock,
  Compass,
  UserCheck
} from "lucide-react";

const SOSHistory = () => {
  const { addToast } = useNotifications();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [officerFilter, setOfficerFilter] = useState("");
  const [lightFilter, setLightFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const loadHistory = async () => {
    try {
      const data = await getSOSHistory();
      setHistory(data);
      setFilteredHistory(data);
    } catch (err) {
      console.error(err);
      addToast("Failed to load historical incident database.", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Apply filters and searches
  useEffect(() => {
    let result = [...history];

    // Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (h) =>
          h.alertId?.toLowerCase().includes(q) ||
          h.userName?.toLowerCase().includes(q) ||
          h.phone?.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (statusFilter) {
      result = result.filter((h) => h.status === statusFilter);
    }

    // Deployed Officer Filter
    if (officerFilter) {
      result = result.filter((h) => h.resolvedBy?.toLowerCase().includes(officerFilter.toLowerCase()));
    }

    // Smart Light Pole Filter
    if (lightFilter) {
      result = result.filter((h) => h.nearestLight === lightFilter);
    }

    // Date Filter
    if (dateFilter) {
      result = result.filter((h) => {
        const itemDate = new Date(h.timestamp).toISOString().split("T")[0];
        return itemDate === dateFilter;
      });
    }

    setFilteredHistory(result);
  }, [searchQuery, statusFilter, officerFilter, lightFilter, dateFilter, history]);

  // Client-side CSV/Excel compiler
  const handleExportCSV = () => {
    if (filteredHistory.length === 0) {
      addToast("No data available to export.", "warning");
      return;
    }

    const headers = [
      "Alert ID",
      "Citizen Name",
      "Phone Number",
      "Latitude",
      "Longitude",
      "Nearest Pole",
      "Distance",
      "Timestamp",
      "Resolution Status",
      "Responding Officer",
      "Incident Resolution Notes"
    ];

    const rows = filteredHistory.map((h) => [
      h.alertId,
      h.userName,
      h.phone,
      h.latitude,
      h.longitude,
      h.nearestLight || "SL1",
      h.distance || "0m",
      new Date(h.timestamp).toLocaleString().replace(/,/g, " "),
      h.status,
      h.resolvedBy || "N/A",
      `"${(h.resolutionNotes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `VISION_SOS_HISTORY_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast("CSV log spreadsheet downloaded successfully.", "success");
  };

  // Browser PDF Print Trigger
  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 print:p-0">
      {/* Title (hidden during print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
            <Database className="text-brand-primary" />
            SOS Archive Registry
          </h2>
          <p className="text-xs text-gray-400">
            Audit resolved incidents, citizen distress history, and police dispatch report sheets.
          </p>
        </div>

        {/* Exporters */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-brand-border rounded-lg text-xs font-bold uppercase tracking-wider text-gray-200 cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-green-500" />
            <span>Export Excel / CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-brand-border rounded-lg text-xs font-bold uppercase tracking-wider text-gray-200 cursor-pointer"
          >
            <FileText size={14} className="text-blue-500" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter panel (hidden during print) */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-5 shadow-lg print:hidden space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-gray-300">
          <Filter size={14} className="text-brand-primary" />
          <span>Interactive Search Filters</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {/* Search Query */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Citizen, Phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="SAFE">SAFE (Accidental)</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
          </select>

          {/* Officer Filter */}
          <input
            type="text"
            value={officerFilter}
            onChange={(e) => setOfficerFilter(e.target.value)}
            placeholder="Filter by Officer Name..."
            className="px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
          />

          {/* Light Pole Filter */}
          <select
            value={lightFilter}
            onChange={(e) => setLightFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
          >
            <option value="">All Poles</option>
            <option value="SL1">SL1 Sector</option>
            <option value="SL2">SL2 Sector</option>
            <option value="SL3">SL3 Sector</option>
            <option value="SL4">SL4 Sector</option>
          </select>

          {/* Date Filter */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
          />
        </div>
      </div>

      {/* Main Print Header (only visible when printing) */}
      <div className="hidden print:block text-slate-900 border-b-2 border-slate-900 pb-4 mb-6">
        <h1 className="font-bold text-xl uppercase tracking-wider">VISION SOS EMERGENCY AUDIT REPORT</h1>
        <p className="text-xs font-mono">Date Generated: {new Date().toLocaleString()} // Filtered Cases: {filteredHistory.length}</p>
      </div>

      {/* Historical List Table */}
      <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg overflow-hidden print:border-none print:shadow-none">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : filteredHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse print:text-black">
              <thead>
                <tr className="bg-slate-900 border-b border-brand-border text-[10px] font-bold uppercase tracking-wider text-gray-400 print:bg-slate-200 print:text-slate-800 print:border-slate-800">
                  <th className="p-4">Alert ID</th>
                  <th className="p-4">Citizen</th>
                  <th className="p-4">Nearest Pole</th>
                  <th className="p-4">Incident Coordinates</th>
                  <th className="p-4">Date & Time</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Responding Officer</th>
                  <th className="p-4">Resolution Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs print:divide-slate-300">
                {filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-900/40 text-gray-300 print:text-slate-900">
                    <td className="p-4 font-mono font-bold text-brand-primary print:text-blue-800">{h.alertId}</td>
                    <td className="p-4">
                      <div className="font-semibold">{h.userName}</div>
                      <div className="text-[10px] text-gray-500 print:text-slate-500 font-mono">{h.phone}</div>
                    </td>
                    <td className="p-4 font-mono">
                      {h.nearestLight || "SL1"} <span className="text-slate-500 font-normal">({h.distance || "0m"})</span>
                    </td>
                    <td className="p-4 font-mono text-[10px] text-gray-400 print:text-slate-600">
                      {h.latitude?.toFixed(4)}, {h.longitude?.toFixed(4)}
                    </td>
                    <td className="p-4 text-gray-400 print:text-slate-600">
                      {new Date(h.timestamp).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        h.status === "RESOLVED"
                          ? "bg-emerald-950/40 text-brand-success border-emerald-500/20 print:bg-green-100 print:text-green-800"
                          : h.status === "SAFE"
                          ? "bg-blue-950/40 text-blue-400 border-blue-500/20 print:bg-blue-100 print:text-blue-800"
                          : "bg-red-950/40 text-brand-danger border-red-500/20 print:bg-red-100 print:text-red-800 animate-pulse"
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{h.resolvedBy || "N/A"}</td>
                    <td className="p-4 text-gray-400 print:text-slate-600 max-w-xs truncate" title={h.resolutionNotes}>
                      {h.resolutionNotes || "No notes logged."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Database className="w-12 h-12 text-slate-700 mb-4" />
            <h3 className="font-display font-bold text-sm uppercase text-slate-400 tracking-wider">
              No Archives Registered
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              No entries match the active search filter parameters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SOSHistory;
