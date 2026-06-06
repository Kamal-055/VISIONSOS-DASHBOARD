import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration from user credentials
const firebaseConfig = {
  apiKey: "AIzaSyCrnXI42hERpMIW4VJCGvcOYUb5yffFdp8",
  authDomain: "vision-sos-5df6a.firebaseapp.com",
  databaseURL: "https://vision-sos-5df6a-default-rtdb.firebaseio.com",
  projectId: "vision-sos-5df6a",
  storageBucket: "vision-sos-5df6a.firebasestorage.app",
  messagingSenderId: "350079474652",
  appId: "1:350079474652:web:ef38523224743bc7eb0d19",
  measurementId: "G-7TE6X3CS1Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const dbFirestore = getFirestore(app);
export const dbRealtime = getDatabase(app);

// Initialize Analytics conditionally (only in browser environments where it's supported)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn("Analytics initialization failed: ", e.message);
}

export { analytics };
export default app;
