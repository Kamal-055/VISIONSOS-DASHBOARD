import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Common/Sidebar";
import Navbar from "../components/Common/Navbar";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToActiveIncidents, startSOSBridgeListener, subscribeToStreetlights } from "../services/rtdbService";

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { addToast, setSirenPlaying, setActiveSOSAlerts } = useNotifications();
  
  // Track alert status and streetlight states to detect changes
  const notifiedAlertsRef = useRef(new Set());
  const prevStreetlightsRef = useRef({});

  useEffect(() => {
    // Start background sync bridge for external/mobile SOS writes
    const unsubscribeBridge = startSOSBridgeListener();

    // 1. Subscribe to Live SOS Alerts from RTDB active_incidents
    const unsubscribeAlerts = subscribeToActiveIncidents((alerts) => {
      const safeAlerts = alerts || [];
      setActiveSOSAlerts(safeAlerts);

      // Clean up notified set of any alerts that are no longer active/present
      const currentIds = new Set(safeAlerts.map(a => a.incidentId));
      notifiedAlertsRef.current.forEach(id => {
        if (!currentIds.has(id)) {
          notifiedAlertsRef.current.delete(id);
        }
      });

      // Filter for currently ACTIVE status alerts
      const activeOnlyAlerts = safeAlerts.filter(a => a.status === "ACTIVE");
      const hasActive = activeOnlyAlerts.length > 0;

      if (hasActive) {
        // Trigger toast notifications for any new active alerts we haven't notified yet
        activeOnlyAlerts.forEach(alert => {
          if (!notifiedAlertsRef.current.has(alert.incidentId)) {
            notifiedAlertsRef.current.add(alert.incidentId);
            addToast(`CRITICAL: Live SOS Alert [${alert.incidentId}] from ${alert.userName}!`, "danger");
          }
        });
        
        // Turn siren ON
        setSirenPlaying(true);
      } else {
        // Turn siren OFF
        setSirenPlaying(false);
      }
    });

    // 2. Subscribe to Smart Streetlights from RTDB
    const unsubscribeStreetlights = subscribeToStreetlights((lights) => {
      // Check for streetlight status changes (online -> offline)
      Object.keys(lights).forEach((key) => {
        const light = lights[key];
        const prevLight = prevStreetlightsRef.current[key];
        
        if (prevLight && prevLight.status === "ONLINE" && light.status === "OFFLINE") {
          addToast(`WARNING: Smart Streetlight ${key} has gone OFFLINE!`, "warning");
        }
      });
      
      prevStreetlightsRef.current = lights;
    });

    return () => {
      unsubscribeBridge();
      unsubscribeAlerts();
      unsubscribeStreetlights();
    };
  }, [addToast, setSirenPlaying, setActiveSOSAlerts]);

  const toggleSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg text-brand-text font-sans bg-grid-cyber">
      {/* Sidebar - Desktop collapsible, Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-40 md:relative transform ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } md:translate-x-0 transition-transform duration-300`}>
        <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      </div>

      {/* Backdrop for mobile drawer */}
      {isMobileOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-35 bg-black/60 md:hidden"
        />
      )}

      {/* Main content body */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar toggleSidebar={toggleSidebar} />
        
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
