import { ref, onValue, set, update, get } from "firebase/database";
import { dbRealtime } from "../firebase/firebaseConfig";

// Subscribe to active current SOS alert
export const subscribeToCurrentAlert = (onAlertReceived) => {
  const alertRef = ref(dbRealtime, "sos_alert/current_alert");
  const unsubscribe = onValue(alertRef, (snapshot) => {
    const data = snapshot.val();
    onAlertReceived(data);
  });
  return unsubscribe;
};

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

// Write current active SOS alert
export const setCurrentAlert = async (alertData) => {
  try {
    const alertRef = ref(dbRealtime, "sos_alert/current_alert");
    await set(alertRef, alertData);
  } catch (error) {
    console.error("Error setting current alert in RTDB:", error);
    throw error;
  }
};

// Clear/resolve current active SOS alert
export const clearCurrentAlertInRTDB = async () => {
  try {
    const alertRef = ref(dbRealtime, "sos_alert/current_alert");
    await set(alertRef, null);
  } catch (error) {
    console.error("Error clearing current alert in RTDB:", error);
    throw error;
  }
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
          battery: 15, // Low battery to test warnings
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
