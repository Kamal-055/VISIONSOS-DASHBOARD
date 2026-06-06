import React, { useState, useEffect } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler
} from "chart.js";
import { subscribeToIncidents, subscribeToSOSHistory } from "../services/firestoreService";
import { subscribeToStreetlights } from "../services/rtdbService";
import { BarChart3, TrendingUp, ShieldCheck, Activity } from "lucide-react";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Analytics = () => {
  const [incidents, setIncidents] = useState([]);
  const [history, setHistory] = useState([]);
  const [streetlights, setStreetlights] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubIncidents = subscribeToIncidents((incs) => {
      setIncidents(incs);
      setLoading(false);
    });

    const unsubHistory = subscribeToSOSHistory((hist) => {
      setHistory(hist);
    });

    const unsubLights = subscribeToStreetlights((lights) => {
      setStreetlights(lights);
    });

    return () => {
      unsubIncidents();
      unsubHistory();
      unsubLights();
    };
  }, []);

  // Compute metrics
  const activeCases = incidents.filter(i => i.status === "ACTIVE").length;
  const progressCases = incidents.filter(i => i.status === "IN_PROGRESS").length;
  const resolvedCases = incidents.filter(i => i.status === "RESOLVED").length;
  const safeCases = incidents.filter(i => i.status === "SAFE").length;

  // Chart 1: Case Resolution (Doughnut)
  const doughnutData = {
    labels: ["Active (Unassigned)", "In-Progress Response", "Resolved", "Citizen Marked Safe"],
    datasets: [
      {
        data: [activeCases, progressCases, resolvedCases, safeCases],
        backgroundColor: [
          "rgba(239, 68, 68, 0.8)",  // active
          "rgba(245, 158, 11, 0.8)", // progress
          "rgba(37, 99, 235, 0.8)",  // resolved
          "rgba(34, 197, 94, 0.8)",  // safe
        ],
        borderColor: [
          "#ef4444",
          "#f59e0b",
          "#2563eb",
          "#22c55e",
        ],
        borderWidth: 1.5,
      },
    ],
  };

  // Chart 2: Daily SOS Load trends (Line Chart)
  // Aggregate SOS history counts by day of the week
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  
  history.forEach((item) => {
    if (item.timestamp) {
      try {
        const d = new Date(item.timestamp);
        const dayName = days[d.getDay()];
        if (dayCounts[dayName] !== undefined) {
          dayCounts[dayName]++;
        }
      } catch (e) {
        console.error("Error parsing timestamp in analytics:", e);
      }
    }
  });

  const lineData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        fill: true,
        label: "SOS Panic Alerts",
        data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => dayCounts[d]),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.15)",
        tension: 0.35,
        borderWidth: 2,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointHoverRadius: 6,
      },
    ],
  };

  // Chart 3: Top Risk Areas based on streetlights near alerts (Bar Chart)
  const poleCounts = {};
  history.forEach(h => {
    const key = h.nearestLight || "SL1";
    poleCounts[key] = (poleCounts[key] || 0) + 1;
  });

  // Ensure default SL1, SL2, SL3, SL4 exist in keys
  ["SL1", "SL2", "SL3", "SL4"].forEach(key => {
    if (!poleCounts[key]) poleCounts[key] = 0;
  });

  const barData = {
    labels: Object.keys(poleCounts).sort(),
    datasets: [
      {
        label: "Distress Signals Aggregated",
        data: Object.keys(poleCounts).sort().map(k => poleCounts[k]),
        backgroundColor: "rgba(239, 68, 68, 0.75)",
        borderColor: "#ef4444",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Chart 4: Average response times by Deployed Unit (Bar Chart)
  // Compute response times per officer/patrol unit from closed/resolved incidents
  const officerTimes = {};
  const officerCounts = {};
  
  incidents.forEach(inc => {
    if ((inc.status === "RESOLVED" || inc.status === "SAFE") && inc.createdAt && inc.resolvedAt) {
      try {
        const duration = (new Date(inc.resolvedAt) - new Date(inc.createdAt)) / 60000; // in minutes
        const officer = inc.assignedOfficer || "HQ Command Center";
        if (duration >= 0) {
          officerTimes[officer] = (officerTimes[officer] || 0) + duration;
          officerCounts[officer] = (officerCounts[officer] || 0) + 1;
        }
      } catch (e) {
        console.error("Error calculating response time:", e);
      }
    }
  });

  const officerLabels = Object.keys(officerCounts);
  const officerAvgs = officerLabels.map(off => {
    const avg = officerTimes[off] / officerCounts[off];
    return parseFloat(avg.toFixed(1));
  });

  // Fallback if no resolved cases exist yet
  const finalLabels = officerLabels.length > 0 ? officerLabels : ["Inspector Rajesh Kumar", "Officer Priya Sharma", "Officer Amit Patel"];
  const finalAvgs = officerAvgs.length > 0 ? officerAvgs : [0, 0, 0];

  const responseTimesData = {
    labels: finalLabels,
    datasets: [
      {
        label: "Avg Response Time (Minutes)",
        data: finalAvgs,
        backgroundColor: "rgba(34, 197, 94, 0.75)",
        borderColor: "#22c55e",
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#f8fafc",
          font: { family: "Inter", size: 10 }
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        borderColor: "#334155",
        borderWidth: 1,
        titleColor: "#f8fafc",
        bodyColor: "#f8fafc",
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { color: "rgba(51, 65, 85, 0.15)" },
        ticks: { color: "#94a3b8", font: { size: 9 } }
      },
      y: {
        grid: { color: "rgba(51, 65, 85, 0.15)" },
        ticks: { color: "#94a3b8", font: { size: 9 } }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
            <BarChart3 className="text-blue-500" />
            Security & Telemetry Analytics
          </h2>
          <p className="text-xs text-gray-400">
            Historical incident aggregation, response timelines, and IoT status reviews.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Daily SOS load */}
          <div className="bg-brand-card border border-brand-border p-5 rounded-xl shadow-lg flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-blue-400" />
                SOS Panic Alerts Trend (Weekly)
              </span>
            </div>
            <div className="flex-1 relative">
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>

          {/* Chart 2: Case statuses */}
          <div className="bg-brand-card border border-brand-border p-5 rounded-xl shadow-lg flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-brand-success" />
                CAD Cases Resolution Distribution
              </span>
            </div>
            <div className="flex-1 relative">
              <Doughnut 
                data={doughnutData} 
                options={{
                  ...chartOptions,
                  scales: { x: { display: false }, y: { display: false } } // Hide axes for pie/doughnut
                }} 
              />
            </div>
          </div>

          {/* Chart 3: Top Risk Areas */}
          <div className="bg-brand-card border border-brand-border p-5 rounded-xl shadow-lg flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                <Activity size={14} className="text-brand-danger" />
                 distress calls by IoT sector (Hotspots)
              </span>
            </div>
            <div className="flex-1 relative">
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>

          {/* Chart 4: Response Times */}
          <div className="bg-brand-card border border-brand-border p-5 rounded-xl shadow-lg flex flex-col h-[320px]">
            <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1.5">
                <Clock size={14} className="text-green-400" />
                Average Response Time by Deployed Unit
              </span>
            </div>
            <div className="flex-1 relative">
              <Bar data={responseTimesData} options={chartOptions} />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Analytics;
