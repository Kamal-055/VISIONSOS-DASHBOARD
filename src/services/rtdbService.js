import { ref, onValue, set, update, get } from "firebase/database";
import { dbRealtime, dbFirestore } from "../firebase/firebaseConfig";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

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

// Helper to synchronize active/new RTDB alerts to Firestore incident_history
export const syncAlertToFirestore = async (alertId, alert) => {
  try {
    const docRef = doc(dbFirestore, "incident_history", alertId);
    await setDoc(docRef, {
      caseId: alertId,
      citizenName: alert.userName || "Unknown User",
      phone: alert.phone || "N/A",
      assignedOfficer: alert.assignedOfficer || "UNASSIGNED",
      assignedLight: alert.assignedStreetlight || alert.nearestLight || "SL1",
      status: alert.status || "ACTIVE",
      createdAt: alert.timestamp || new Date().toISOString(),
      location: {
        latitude: alert.latitude || 12.9585,
        longitude: alert.longitude || 77.5530
      },
      priority: alert.priority || "HIGH",
      emergencyType: alert.emergencyType || "Emergency",
      severityLevel: alert.severityLevel || alert.priority || "HIGH",
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error syncing alert to Firestore:", error);
  }
};

// 6. Write active SOS alert to RTDB sos_history, active_incidents, and current_alert
export const setCurrentAlert = async (alertData) => {
  try {
    const alertId = alertData.alertId || `alert_${Date.now()}`;
    const deviceId = alertData.deviceId || `DEV-${Math.floor(100000 + Math.random() * 900000)}`;
    const uid = alertData.uid || alertData.user || `user_${Math.floor(1000 + Math.random() * 9000)}`;
    const email = alertData.email || `${(alertData.userName || 'user').toLowerCase().replace(/\s+/g, '')}@vision.gov`;

    const enrichedAlertData = {
      ...alertData,
      alertId,
      deviceId,
      uid,
      email,
      status: alertData.status || "ACTIVE",
      emergencyType: alertData.emergencyType || "Emergency",
      severityLevel: alertData.severityLevel || alertData.priority || "HIGH",
      priority: alertData.priority || "HIGH",
      assignedOfficer: alertData.assignedOfficer || "UNASSIGNED",
      lastUpdated: new Date().toISOString()
    };

    // A. Write to sos_history (for archive/historical records)
    const alertRef = ref(dbRealtime, `sos_history/${alertId}`);
    await set(alertRef, enrichedAlertData);

    // B. Write to active_incidents (for concurrent active tracking)
    const incidentRef = ref(dbRealtime, `active_incidents/${alertId}`);
    await set(incidentRef, enrichedAlertData);

    // C. Write to sos_alert/current_alert (for backward compatibility)
    const currentAlertRef = ref(dbRealtime, "sos_alert/current_alert");
    await set(currentAlertRef, enrichedAlertData);

    // D. Synchronize to Firestore incident_history
    await syncAlertToFirestore(alertId, enrichedAlertData);

  } catch (error) {
    console.error("Error setting alert in RTDB:", error);
    throw error;
  }
};

// 7. Clear/resolve current active SOS alert in RTDB (across all locations)
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
      const updateData = { 
        status: updates.status || "RESOLVED", 
        resolvedAt: new Date().toISOString(),
        resolvedBy: updates.resolvedBy || "HQ Command Center",
        resolutionNotes: updates.resolutionNotes || "Alert cleared by dispatcher.",
        lastUpdated: new Date().toISOString(),
        ...updates
      };

      // A. Update in sos_history
      const alertRef = ref(dbRealtime, `sos_history/${targetKey}`);
      await update(alertRef, updateData);

      // B. Update/resolve in active_incidents
      const incidentRef = ref(dbRealtime, `active_incidents/${targetKey}`);
      const incidentSnap = await get(incidentRef);
      if (incidentSnap.exists()) {
        if (updateData.status === "RESOLVED" || updateData.status === "SAFE") {
          // Remove from active_incidents node so it's cleared from active lists
          await set(incidentRef, null);
        } else {
          await update(incidentRef, updateData);
        }
      }

      // D. Update in Firestore
      const firestoreDocRef = doc(dbFirestore, "incident_history", targetKey);
      const firestoreSnap = await getDoc(firestoreDocRef);
      const firestoreUpdates = {
        status: updateData.status,
        lastUpdated: new Date().toISOString()
      };
      if (updateData.status === "RESOLVED" || updateData.status === "SAFE") {
        firestoreUpdates.resolvedAt = new Date().toISOString();
      }
      if (updateData.resolvedBy) {
        firestoreUpdates.assignedOfficer = updateData.resolvedBy;
      }
      if (updateData.nearestLight) {
        firestoreUpdates.assignedLight = updateData.nearestLight;
      }

      if (firestoreSnap.exists()) {
        await updateDoc(firestoreDocRef, firestoreUpdates);
      } else {
        // Create resolved document if missing
        await setDoc(firestoreDocRef, {
          caseId: targetKey,
          citizenName: data[targetKey]?.userName || "Unknown User",
          phone: data[targetKey]?.phone || "N/A",
          assignedOfficer: updateData.resolvedBy || "UNASSIGNED",
          assignedLight: updateData.nearestLight || "SL1",
          status: updateData.status,
          createdAt: data[targetKey]?.timestamp || new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
          location: {
            latitude: data[targetKey]?.latitude || 12.9585,
            longitude: data[targetKey]?.longitude || 77.5530
          }
        });
      }

      // C. Update sos_alert/current_alert (backward compatibility)
      const currentAlertRef = ref(dbRealtime, "sos_alert/current_alert");
      const currentAlertSnap = await get(currentAlertRef);
      if (currentAlertSnap.exists()) {
        const curAlert = currentAlertSnap.val();
        if (curAlert && (curAlert.alertId === targetKey || curAlert.id === targetKey)) {
          // It's the current alert! Let's check if there are other active incidents to show.
          const activeIncRef = ref(dbRealtime, "active_incidents");
          const activeIncSnap = await get(activeIncRef);
          let nextActive = null;
          if (activeIncSnap.exists()) {
            const incidents = activeIncSnap.val();
            const activeList = [];
            Object.keys(incidents).forEach(k => {
              if (k !== targetKey && incidents[k] && (incidents[k].status === "ACTIVE" || incidents[k].status === "ACKNOWLEDGED" || incidents[k].status === "RESPONDER_ASSIGNED" || incidents[k].status === "IN_PROGRESS")) {
                activeList.push({ id: k, ...incidents[k] });
              }
            });
            if (activeList.length > 0) {
              activeList.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
              nextActive = activeList[0];
            }
          }

          if (nextActive) {
            // Replace with next active alert
            await set(currentAlertRef, {
              ...nextActive,
              alertId: nextActive.id
            });
          } else {
            // No other active alerts, just resolve current_alert
            if (updateData.status === "RESOLVED" || updateData.status === "SAFE") {
              await set(currentAlertRef, null);
            } else {
              await update(currentAlertRef, updateData);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error clearing current alert in RTDB:", error);
    throw error;
  }
};

// 7.1 Subscribe to active incidents (concurrent active list)
export const subscribeToActiveIncidents = (onIncidentsUpdated) => {
  const incidentsRef = ref(dbRealtime, "active_incidents");
  const unsubscribe = onValue(incidentsRef, (snapshot) => {
    const data = snapshot.val() || {};
    const list = [];
    Object.keys(data).forEach(key => {
      const item = data[key];
      if (item && (item.status === "ACTIVE" || item.status === "ACKNOWLEDGED" || item.status === "RESPONDER_ASSIGNED" || item.status === "IN_PROGRESS")) {
        list.push({
          incidentId: key,
          id: key,
          ...item
        });
      }
    });
    // Sort latest first
    list.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    onIncidentsUpdated(list);
  });
  return unsubscribe;
};

// 7.2 Background bridge to synchronize external writes (e.g. mobile app) with active_incidents
export const startSOSBridgeListener = () => {
  // Listen to sos_history for any active alerts
  const historyRef = ref(dbRealtime, "sos_history");
  const unsubscribeHistory = onValue(historyRef, async (snapshot) => {
    const data = snapshot.val();
    if (!data) return;
    
    // Check active_incidents node
    const activeIncidentsRef = ref(dbRealtime, "active_incidents");
    const activeIncidentsSnap = await get(activeIncidentsRef);
    const activeIncidentsData = activeIncidentsSnap.val() || {};

    Object.keys(data).forEach(async (key) => {
      const alert = data[key];
      if (alert && (alert.status === "ACTIVE" || alert.status === "ACKNOWLEDGED" || alert.status === "RESPONDER_ASSIGNED" || alert.status === "IN_PROGRESS") && !activeIncidentsData[key]) {
        // Active in history but missing in active_incidents - copy it!
        console.log(`Bridge Sync: Copying active alert ${key} to active_incidents`);
        const deviceId = alert.deviceId || `DEV-${Math.floor(100000 + Math.random() * 900000)}`;
        const uid = alert.uid || alert.user || `user_${Math.floor(1000 + Math.random() * 9000)}`;
        const email = alert.email || `${(alert.userName || 'user').toLowerCase().replace(/\s+/g, '')}@vision.gov`;
        
        const alertDataEnriched = {
          uid,
          deviceId,
          userName: alert.userName || "Unknown User",
          email,
          phone: alert.phone || "N/A",
          latitude: alert.latitude || 12.9585,
          longitude: alert.longitude || 77.5530,
          timestamp: alert.timestamp || new Date().toISOString(),
          status: alert.status || "ACTIVE",
          assignedOfficer: alert.assignedOfficer || "UNASSIGNED",
          assignedStreetlight: alert.nearestLight || alert.assignedStreetlight || "SL1",
          distance: alert.distance || "30m",
          priority: alert.priority || "HIGH",
          emergencyType: alert.emergencyType || "Emergency",
          severityLevel: alert.severityLevel || alert.priority || "HIGH",
          lastUpdated: alert.lastUpdated || new Date().toISOString()
        };

        await set(ref(dbRealtime, `active_incidents/${key}`), alertDataEnriched);
        await syncAlertToFirestore(key, alertDataEnriched);
      }
    });
  });

  // Listen to sos_alert/current_alert
  const currentAlertRef = ref(dbRealtime, "sos_alert/current_alert");
  const unsubscribeCurrent = onValue(currentAlertRef, async (snapshot) => {
    const alert = snapshot.val();
    if (!alert || (alert.status !== "ACTIVE" && alert.status !== "ACKNOWLEDGED" && alert.status !== "RESPONDER_ASSIGNED" && alert.status !== "IN_PROGRESS")) return;

    const alertId = alert.alertId || alert.id;
    if (!alertId) return;

    // Check active_incidents node
    const activeIncidentsRef = ref(dbRealtime, "active_incidents");
    const activeIncidentsSnap = await get(activeIncidentsRef);
    const activeIncidentsData = activeIncidentsSnap.val() || {};

    if (!activeIncidentsData[alertId]) {
      // Missing in active_incidents - copy it!
      console.log(`Bridge Sync: Copying current_alert ${alertId} to active_incidents`);
      const deviceId = alert.deviceId || `DEV-${Math.floor(100000 + Math.random() * 900000)}`;
      const uid = alert.uid || alert.user || `user_${Math.floor(1000 + Math.random() * 9000)}`;
      const email = alert.email || `${(alert.userName || 'user').toLowerCase().replace(/\s+/g, '')}@vision.gov`;

      const alertDataEnriched = {
        uid,
        deviceId,
        userName: alert.userName || "Unknown User",
        email,
        phone: alert.phone || "N/A",
        latitude: alert.latitude || 12.9585,
        longitude: alert.longitude || 77.5530,
        timestamp: alert.timestamp || new Date().toISOString(),
        status: alert.status || "ACTIVE",
        assignedOfficer: alert.assignedOfficer || "UNASSIGNED",
        assignedStreetlight: alert.nearestLight || alert.assignedStreetlight || "SL1",
        distance: alert.distance || "30m",
        priority: alert.priority || "HIGH",
        emergencyType: alert.emergencyType || "Emergency",
        severityLevel: alert.severityLevel || alert.priority || "HIGH",
        lastUpdated: alert.lastUpdated || new Date().toISOString()
      };

      await set(ref(dbRealtime, `active_incidents/${alertId}`), alertDataEnriched);
      await syncAlertToFirestore(alertId, alertDataEnriched);
    }
  });

  return () => {
    unsubscribeHistory();
    unsubscribeCurrent();
  };
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
