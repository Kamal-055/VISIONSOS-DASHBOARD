import { ref, onValue, set, update, get } from "firebase/database";
import { dbRealtime } from "../firebase/firebaseConfig";

// 1. Subscribe to active current SOS alert from RTDB sos_history
export const subscribeToCurrentAlert = (onAlertReceived) => {
  const historyRef = ref(dbRealtime, "sos_history");
  const unsubscribe = onValue(historyRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      onAlertReceived(null);
      return;
    }
    
    // Find all active alerts in RTDB
    const activeAlerts = [];
    Object.keys(data).forEach(key => {
      const alert = data[key];
      if (alert && alert.status === "ACTIVE") {
        activeAlerts.push({ id: key, ...alert });
      }
    });

    if (activeAlerts.length === 0) {
      onAlertReceived(null);
      return;
    }

    // Sort by timestamp desc and take the latest one
    activeAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    onAlertReceived(activeAlerts[0]);
  });
  return unsubscribe;
};

// 2. Subscribe to smart streetlights (with standardized schema mapping)
export const subscribeToStreetlights = (onStreetlightsUpdated) => {
  const streetlightsRef = ref(dbRealtime, "streetlights");
  const unsubscribe = onValue(streetlightsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const standardized = {};
    Object.keys(data).forEach(key => {
      const pole = data[key];
      if (pole) {
        standardized[key] = {
          id: pole.id || pole.name || key,
          name: pole.name || key,
          latitude: pole.lat !== undefined ? pole.lat : (pole.latitude || 0),
          longitude: pole.long !== undefined ? pole.long : (pole.longitude || 0),
          battery: pole.battery !== undefined ? pole.battery : 100,
          state: pole.state || (pole.status === "ACTIVE" ? "ACTIVE" : "NORMAL"),
          status: pole.status === "OFFLINE" || pole.state === "OFFLINE" ? "OFFLINE" : "ONLINE",
          lastActivated: pole.lastActivated 
            ? (typeof pole.lastActivated === 'number' && pole.lastActivated > 0 
                ? new Date(pole.lastActivated).toISOString() 
                : pole.lastActivated) 
            : new Date().toISOString()
        };
      }
    });
    onStreetlightsUpdated(standardized);
  });
  return unsubscribe;
};

// 3. Update streetlight properties
export const updateStreetlight = async (lightId, updates) => {
  try {
    const lightRef = ref(dbRealtime, `streetlights/${lightId}`);
    
    // Translate dashboard updates back to database keys
    const dbUpdates = {};
    if (updates.state !== undefined) dbUpdates.state = updates.state;
    if (updates.status !== undefined) {
      if (updates.status === "ONLINE") {
        dbUpdates.status = updates.state === "ACTIVE" ? "ACTIVE" : "NORMAL";
      } else {
        dbUpdates.status = updates.status;
      }
    }
    if (updates.battery !== undefined) dbUpdates.battery = Number(updates.battery);
    if (updates.lastActivated !== undefined) {
      dbUpdates.lastActivated = typeof updates.lastActivated === 'string' 
        ? new Date(updates.lastActivated).getTime() 
        : updates.lastActivated;
    }
    
    await update(lightRef, dbUpdates);
  } catch (error) {
    console.error(`Error updating streetlight ${lightId}:`, error);
    throw error;
  }
};

// 4. Subscribe to incident status current case
export const subscribeToCurrentCase = (onCaseUpdated) => {
  const caseRef = ref(dbRealtime, "incident_status/current_case");
  const unsubscribe = onValue(caseRef, (snapshot) => {
    const data = snapshot.val();
    onCaseUpdated(data);
  });
  return unsubscribe;
};

// 5. Update/resolve current case status in RTDB
export const updateCurrentCaseInRTDB = async (caseData) => {
  try {
    const caseRef = ref(dbRealtime, "incident_status/current_case");
    await update(caseRef, caseData);
  } catch (error) {
    console.error("Error updating current case in RTDB:", error);
    throw error;
  }
};

// 6. Write active SOS alert to RTDB sos_history
export const setCurrentAlert = async (alertData) => {
  try {
    const alertId = alertData.alertId || `alert_${Date.now()}`;
    const alertRef = ref(dbRealtime, `sos_history/${alertId}`);
    await set(alertRef, {
      ...alertData,
      alertId,
      status: "ACTIVE"
    });
  } catch (error) {
    console.error("Error setting alert in RTDB:", error);
    throw error;
  }
};

// 7. Clear/resolve current active SOS alert in RTDB
export const clearCurrentAlertInRTDB = async (alertId = null, updates = {}) => {
  try {
    const historyRef = ref(dbRealtime, "sos_history");
    const snapshot = await get(historyRef);
    if (!snapshot.exists()) return;
    
    const data = snapshot.val();
    let targetKey = alertId;
    
    if (!targetKey) {
      const activeAlerts = [];
      Object.keys(data).forEach(key => {
        if (data[key] && data[key].status === "ACTIVE") {
          activeAlerts.push({ key, ...data[key] });
        }
      });
      if (activeAlerts.length === 0) return;
      activeAlerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      targetKey = activeAlerts[0].key;
    }

    if (targetKey) {
      const alertRef = ref(dbRealtime, `sos_history/${targetKey}`);
      await update(alertRef, { 
        status: updates.status || "RESOLVED", 
        resolvedAt: new Date().toISOString(),
        resolvedBy: updates.resolvedBy || "HQ Command Center",
        resolutionNotes: updates.resolutionNotes || "Alert cleared by dispatcher.",
        ...updates
      });
    }
  } catch (error) {
    console.error("Error clearing current alert in RTDB:", error);
    throw error;
  }
};

// 8. Subscribe to citizen live location tracking
export const subscribeToLiveTracking = (userId, onLocationUpdated) => {
  if (!userId) return () => {};
  const trackingRef = ref(dbRealtime, `live_tracking/${userId}`);
  const unsubscribe = onValue(trackingRef, (snapshot) => {
    const data = snapshot.val();
    onLocationUpdated(data);
  });
  return unsubscribe;
};

// 9. Subscribe to the entire RTDB sos_history node
export const subscribeToRTDBSOSHistory = (onHistoryUpdated) => {
  const historyRef = ref(dbRealtime, "sos_history");
  const unsubscribe = onValue(historyRef, (snapshot) => {
    const data = snapshot.val() || {};
    const historyList = [];
    Object.keys(data).forEach(key => {
      const item = data[key];
      if (item) {
        historyList.push({
          id: key,
          ...item
        });
      }
    });
    // Sort latest first
    historyList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    onHistoryUpdated(historyList);
  });
  return unsubscribe;
};

// 10. Seed default streetlights if they do not exist (Bangalore-aligned coordinates)
export const seedDefaultStreetlights = async () => {
  try {
    const streetlightsRef = ref(dbRealtime, "streetlights");
    
    // Always overwrite or write if empty to ensure Bangalore coordinates
    await set(streetlightsRef, {
      SL1: {
        id: "SL1",
        name: "SL1",
        lat: 12.9585,
        long: 77.5530,
        battery: 92,
        state: "NORMAL",
        status: "NORMAL",
        lastActivated: Date.now()
      },
      SL2: {
        id: "SL2",
        name: "SL2",
        lat: 12.9592,
        long: 77.5545,
        battery: 78,
        state: "NORMAL",
        status: "NORMAL",
        lastActivated: Date.now()
      },
      SL3: {
        id: "SL3",
        name: "SL3",
        lat: 12.9575,
        long: 77.5520,
        battery: 15,
        state: "MAINTENANCE",
        status: "NORMAL",
        lastActivated: Date.now()
      },
      SL4: {
        id: "SL4",
        name: "SL4",
        lat: 12.9605,
        long: 77.5510,
        battery: 0,
        state: "OFFLINE",
        status: "OFFLINE",
        lastActivated: Date.now()
      }
    });
    console.log("Realtime Database seeded/updated with Bangalore streetlights.");
  } catch (error) {
    console.error("Error seeding default streetlights:", error);
  }
};
