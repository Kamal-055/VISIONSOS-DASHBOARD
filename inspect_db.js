import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import { getFirestore, collection, getDocs } from "firebase/firestore";

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
const db = getFirestore(app);

async function inspectRTDB() {
  console.log("\n=== INSPECTING REALTIME DATABASE ===");
  try {
    const rootRef = ref(rtdb, "/");
    const snapshot = await get(rootRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      console.log("RTDB Keys at root:", Object.keys(val));
      
      // Print detailed structure for keys of interest
      for (const key of Object.keys(val)) {
        if (key === "sos_alert" || key === "sos_alerts" || key === "alerts" || key === "sos") {
          console.log(`\nRTDB Key "${key}":`, JSON.stringify(val[key], null, 2));
        } else {
          console.log(`\nRTDB Key "${key}" (summary):`, typeof val[key] === 'object' ? Object.keys(val[key]) : val[key]);
        }
      }
    } else {
      console.log("RTDB is empty.");
    }
  } catch (err) {
    console.error("Error inspecting RTDB:", err);
  }
}

async function inspectFirestore() {
  console.log("\n=== INSPECTING FIRESTORE ===");
  const collections = [
    "users", 
    "officers", 
    "sos_history", 
    "incident_history", 
    "police_stations", 
    "police_units",
    "sos_alerts", 
    "alerts", 
    "incidents"
  ];
  
  for (const colName of collections) {
    try {
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      console.log(`Collection "${colName}": ${snapshot.size} documents.`);
      if (snapshot.size > 0) {
        console.log("First document data sample:");
        const firstDoc = snapshot.docs[0];
        console.log(`- ID: ${firstDoc.id}`);
        console.log(`- Data:`, JSON.stringify(firstDoc.data(), null, 2));
      }
    } catch (err) {
      console.log(`Collection "${colName}" query failed or does not exist:`, err.message);
    }
  }
}

async function main() {
  await inspectRTDB();
  await inspectFirestore();
  process.exit(0);
}

main();
