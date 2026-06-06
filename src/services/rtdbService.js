import { ref, onValue, set, update, get, remove } from "firebase/database";
import { dbRealtime } from "../firebase/firebaseConfig";

// ===== LIVE TRACKING SUBSCRIPTIONS =====

// Subscribe to all live tracking active SOS alert items from the Flutter mobile app
export const subscribeToLiveTracking = (onTrackingUpdated) => {
  const trackingRef = ref(dbRealtime, "live_tracking");
  const unsubscribe = onValue(trackingRef, (snapshot) => {
    const data = snapshot.val() || {};
    const activeAlerts = Object.keys(data).map(uid => {
      const item = data[uid];
      return {
        uid,
        alertId: "SOS-" + uid.substring(0, 5).toUpperCase(),
        userName: item.userName || item.name || "Citizen (" + uid.substring(0, 4) + ")",
        phone: item.phone || item.phoneNumber || "+91 99999 99999",
        latitude: Number(item.latitude || 28.6139),
        longitude: Number(item.longitude || 77.2090),
        timestamp: item.timestamp || new Date().toISOString(),
        nearestLight: item.nearestLight || "SL1",
        distance: item.distance || "15m",
        status: "ACTIVE"
      };
    });
    onTrackingUpdated(activeAlerts);
  });
  return unsubscribe;
};

// Subscribe to analytics summary counts (activeSOS, resolvedSOS, totalSOS)
export const subscribeToAnalyticsSummary = (onSummaryUpdated) => {
  const summaryRef = ref(dbRealtime, "analytics/summary");
  const unsubscribe = onValue(summaryRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      onSummaryUpdated({
        activeSOS: Number(data.activeSOS || 0),
        resolvedSOS: Number(data.resolvedSOS || 0),
        totalSOS: Number(data.totalSOS || 0),
        lastUpdated: data.lastUpdated || Date.now()
      });
    } else {
      // Seed default summary if empty
      const initialSummary = {
        activeSOS: 0,
        resolvedSOS: 59,
        totalSOS: 59,
        lastUpdated: Date.now()
      };
      set(summaryRef, initialSummary);
      onSummaryUpdated(initialSummary);
    }
  });
  return unsubscribe;
};

// Write active SOS tracker to RTDB (for Simulation console)
export const setLiveTrackingAlert = async (uid, alertData) => {
  try {
    const trackerRef = ref(dbRealtime, `live_tracking/${uid}`);
    await set(trackerRef, alertData);
    
    // Increment activeSOS and totalSOS in summary
    const summaryRef = ref(dbRealtime, "analytics/summary");
    const summarySnap = await get(summaryRef);
    if (summarySnap.exists()) {
      const summary = summarySnap.val();
      await update(summaryRef, {
        activeSOS: (summary.activeSOS || 0) + 1,
        totalSOS: (summary.totalSOS || 0) + 1,
        lastUpdated: Date.now()
      });
    }
  } catch (error) {
    console.error("Error setting live tracking alert:", error);
    throw error;
  }
};

// Clear/resolve live tracking alert by UID
export const clearLiveTrackingAlert = async (uid) => {
  try {
    const trackerRef = ref(dbRealtime, `live_tracking/${uid}`);
    await remove(trackerRef);
    
    // Decrement activeSOS and increment resolvedSOS in summary
    const summaryRef = ref(dbRealtime, "analytics/summary");
    const summarySnap = await get(summaryRef);
    if (summarySnap.exists()) {
      const summary = summarySnap.val();
      const currentActive = summary.activeSOS || 0;
      await update(summaryRef, {
        activeSOS: currentActive > 0 ? currentActive - 1 : 0,
        resolvedSOS: (summary.resolvedSOS || 0) + 1,
        lastUpdated: Date.now()
      });
    }
  } catch (error) {
    console.error("Error clearing live tracking alert:", error);
    throw error;
  }
};

// ===== BACKWARDS COMPATIBILITY LAYER =====

export const subscribeToCurrentAlert = (onAlertReceived) => {
  return subscribeToLiveTracking((alerts) => {
    onAlertReceived(alerts.length > 0 ? alerts[0] : null);
  });
};

export const setCurrentAlert = async (alertData) => {
  const mockUid = alertData.user || "mock_user_" + Math.floor(1000 + Math.random() * 9000);
  return setLiveTrackingAlert(mockUid, alertData);
};

export const clearCurrentAlertInRTDB = async () => {
  try {
    const trackingRef = ref(dbRealtime, "live_tracking");
    const snap = await get(trackingRef);
    if (snap.exists()) {
      const data = snap.val();
      for (const uid of Object.keys(data)) {
        await clearLiveTrackingAlert(uid);
      }
    }
  } catch (e) {
    console.error("Error clearing current alerts compatibility layer:", e);
  }
};

// ===== OTHER RTDB DATA SERVICES =====

// Subscribe to smart streetlights
export const subscribeToStreetlights = (onStreetlightsUpdated) => {
  const streetlightsRef = ref(dbRealtime, "streetlights");
  const unsubscribe = onValue(streetlightsRef, (snapshot) => {
    const data = snapshot.val();
    onStreetlightsUpdated(data || {});
  });
  return unsubscribe;
};

// Update streetlight properties (e.g. mode, state, battery)
export const updateStreetlight = async (lightId, updates) => {
  try {
    const lightRef = ref(dbRealtime, `streetlights/${lightId}`);
    await update(lightRef, updates);
  } catch (error) {
    console.error(`Error updating streetlight ${lightId}:`, error);
    throw error;
  }
};

// Subscribe to incident status current case
export const subscribeToCurrentCase = (onCaseUpdated) => {
  const caseRef = ref(dbRealtime, "incident_status/current_case");
  const unsubscribe = onValue(caseRef, (snapshot) => {
    const data = snapshot.val();
    onCaseUpdated(data);
  });
  return unsubscribe;
};

// Seed default streetlights if they do not exist
export const seedDefaultStreetlights = async () => {
  try {
    const streetlightsRef = ref(dbRealtime, "streetlights");
    const snapshot = await get(streetlightsRef);
    if (!snapshot.exists()) {
      await set(streetlightsRef, {
        SL1: {
          id: "SL1",
          latitude: 28.6139,
          longitude: 77.2090,
          battery: 92,
          state: "NORMAL",
          lastActivated: new Date().toISOString(),
          status: "ONLINE"
        },
        SL2: {
          id: "SL2",
          latitude: 28.6180,
          longitude: 77.2150,
          battery: 78,
          state: "NORMAL",
          lastActivated: new Date().toISOString(),
          status: "ONLINE"
        },
        SL3: {
          id: "SL3",
          latitude: 28.6105,
          longitude: 77.2210,
          battery: 15,
          state: "MAINTENANCE",
          lastActivated: new Date().toISOString(),
          status: "ONLINE"
        },
        SL4: {
          id: "SL4",
          latitude: 28.6220,
          longitude: 77.2020,
          battery: 0,
          state: "OFFLINE",
          lastActivated: new Date().toISOString(),
          status: "OFFLINE"
        }
      });
      console.log("Realtime Database seeded with default streetlights.");
    }
  } catch (error) {
    console.error("Error seeding default streetlights:", error);
  }
};
