import React, { useState, useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Common/Sidebar";
import Navbar from "../components/Common/Navbar";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToLiveTracking, subscribeToStreetlights } from "../services/rtdbService";

const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { addToast, setSirenPlaying, setActiveSOSAlerts } = useNotifications();
  
  // Track alert status and streetlight states to detect changes
  const seenAlertIdsRef = useRef(new Set());
  const prevStreetlightsRef = useRef({});

  useEffect(() => {
    // 1. Subscribe to Live SOS Alerts from live_tracking reference
    const unsubscribeAlerts = subscribeToLiveTracking((alerts) => {
      setActiveSOSAlerts(alerts);
      
      if (alerts.length > 0) {
        let hasNewAlert = false;
        
        alerts.forEach((alert) => {
          if (!seenAlertIdsRef.current.has(alert.alertId)) {
            seenAlertIdsRef.current.add(alert.alertId);
            addToast(`CRITICAL: Live SOS Alert [${alert.alertId}] from ${alert.userName}!`, "danger");
            hasNewAlert = true;
          }
        });
        
        if (hasNewAlert) {
          setSirenPlaying(true);
        }
      } else {
        // No active alerts
        setSirenPlaying(false);
        seenAlertIdsRef.current.clear();
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
