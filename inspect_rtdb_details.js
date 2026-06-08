import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, query, limitToLast } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCrnXI42hERpMIW4VJCGvcOYUb5yffFdp8",
  authDomain: "vision-sos-5df6a.firebaseapp.com",
  databaseURL: "https://vision-sos-5df6a-default-rtdb.firebaseio.com",
  projectId: "vision-sos-5df6a",
  storageBucket: "vision-sos-5df6a.firebasestorage.app",
  messagingSenderId: "350079474652",
  appId: "1:350079474652:web:ef38523224743bc7eb0d19"
};

const app = initializeApp(firebaseConfig);
const rtdb = getDatabase(app);

async function main() {
  try {
    console.log("=== DETAIL INSPECTION ===");
    
    // 1. Get last 3 alerts in RTDB sos_history
    const sosHistoryRef = ref(rtdb, "sos_history");
    const sosSnap = await get(sosHistoryRef);
    if (sosSnap.exists()) {
      const val = sosSnap.val();
      const keys = Object.keys(val);
      console.log(`Total alerts in RTDB sos_history: ${keys.length}`);
      const lastKeys = keys.slice(-3);
      for (const k of lastKeys) {
        console.log(`Alert "${k}":`, JSON.stringify(val[k], null, 2));
      }
    } else {
      console.log("No sos_history in RTDB.");
    }

    // 2. Get live_tracking
    const trackingRef = ref(rtdb, "live_tracking");
    const trackSnap = await get(trackingRef);
    if (trackSnap.exists()) {
      console.log("live_tracking details:", JSON.stringify(trackSnap.val(), null, 2));
    }

    // 3. Get incident_status
    const incidentRef = ref(rtdb, "incident_status");
    const incSnap = await get(incidentRef);
    if (incSnap.exists()) {
      console.log("incident_status details:", JSON.stringify(incSnap.val(), null, 2));
    }
    
    // 4. Get streetlights
    const slRef = ref(rtdb, "streetlights");
    const slSnap = await get(slRef);
    if (slSnap.exists()) {
      console.log("streetlights details:", JSON.stringify(slSnap.val(), null, 2));
    }
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}

main();
