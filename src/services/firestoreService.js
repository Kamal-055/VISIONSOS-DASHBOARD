import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  getDoc,
  where,
  deleteDoc,
  onSnapshot
} from "firebase/firestore";
import { dbFirestore } from "../firebase/firebaseConfig";

// ===== OFFICERS SERVICE =====

export const getOfficers = async () => {
  try {
    const q = query(collection(dbFirestore, "officers"), orderBy("name"));
    const querySnapshot = await getDocs(q);
    const officers = [];
    querySnapshot.forEach((doc) => {
      officers.push({ id: doc.id, ...doc.data() });
    });
    return officers;
  } catch (error) {
    console.error("Error fetching officers:", error);
    throw error;
  }
};

export const createOfficer = async (officerId, officerData) => {
  try {
    // Write to users collection (for roles / auth logic)
    const userRef = doc(dbFirestore, "users", officerId);
    await setDoc(userRef, {
      uid: officerId,
      name: officerData.name,
      email: officerData.email,
      role: officerData.rank, // rank translates to role
      status: "Active",
      badgeNumber: officerData.badgeNumber,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    // Write to officers collection
    const officerRef = doc(dbFirestore, "officers", officerId);
    await setDoc(officerRef, {
      officerId,
      ...officerData,
      assignedIncidents: 0,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error creating officer in Firestore:", error);
    throw error;
  }
};

export const updateOfficerDetails = async (officerId, officerData) => {
  try {
    const officerRef = doc(dbFirestore, "officers", officerId);
    await updateDoc(officerRef, officerData);
    
    // Also update users collection name / role
    const userRef = doc(dbFirestore, "users", officerId);
    const userUpdates = {};
    if (officerData.name) userUpdates.name = officerData.name;
    if (officerData.rank) userUpdates.role = officerData.rank;
    if (officerData.status) userUpdates.status = officerData.status;
    await updateDoc(userRef, userUpdates);
  } catch (error) {
    console.error("Error updating officer details:", error);
    throw error;
  }
};

export const deactivateOfficerAccount = async (officerId) => {
  try {
    const officerRef = doc(dbFirestore, "officers", officerId);
    await updateDoc(officerRef, { status: "Inactive" });

    const userRef = doc(dbFirestore, "users", officerId);
    await updateDoc(userRef, { status: "Inactive" });
  } catch (error) {
    console.error("Error deactivating officer:", error);
    throw error;
  }
};


// ===== SOS HISTORY SERVICE =====

export const getSOSHistory = async () => {
  try {
    const q = query(collection(dbFirestore, "sos_history"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    const history = [];
    querySnapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    return history;
  } catch (error) {
    console.error("Error fetching SOS history:", error);
    throw error;
  }
};

export const addSOSHistoryRecord = async (alert) => {
  try {
    const historyRef = collection(dbFirestore, "sos_history");
    const docRef = await addDoc(historyRef, {
      ...alert,
      resolvedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding SOS history record:", error);
    throw error;
  }
};


// ===== INCIDENT HISTORY SERVICE =====

export const getIncidents = async () => {
  try {
    const q = query(collection(dbFirestore, "incident_history"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const incidents = [];
    querySnapshot.forEach((doc) => {
      incidents.push({ id: doc.id, ...doc.data() });
    });
    return incidents;
  } catch (error) {
    console.error("Error fetching incidents:", error);
    throw error;
  }
};

export const createIncident = async (incidentData) => {
  try {
    const ref = collection(dbFirestore, "incident_history");
    const docRef = await addDoc(ref, {
      ...incidentData,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating incident:", error);
    throw error;
  }
};

export const updateIncidentStatusInFirestore = async (caseId, status, updates = {}) => {
  try {
    const docRef = doc(dbFirestore, "incident_history", caseId);
    const data = { status, ...updates };
    if (status === "RESOLVED" || status === "SAFE") {
      data.resolvedAt = new Date().toISOString();
    }
    await updateDoc(docRef, data);
  } catch (error) {
    console.error("Error updating incident status in firestore:", error);
    throw error;
  }
};


// ===== SEEDING FIRESTORE DATA =====

export const seedFirestoreData = async () => {
  try {
    // Check if officers collection is empty
    const officersCol = collection(dbFirestore, "officers");
    const officersSnap = await getDocs(query(officersCol, limit(1)));
    
    if (officersSnap.empty) {
      console.log("Seeding officers database...");
      
      const dummyOfficers = [
        {
          officerId: "officer_1",
          name: "Inspector Rajesh Kumar",
          badgeNumber: "POL-7291",
          rank: "Supervisor",
          status: "Active",
          phone: "+91 98765 43210",
          email: "rajesh.kumar@vision.gov",
          assignedIncidents: 12
        },
        {
          officerId: "officer_2",
          name: "Officer Priya Sharma",
          badgeNumber: "POL-3841",
          rank: "Officer",
          status: "Active",
          phone: "+91 87654 32109",
          email: "priya.sharma@vision.gov",
          assignedIncidents: 8
        },
        {
          officerId: "officer_3",
          name: "Officer Amit Patel",
          badgeNumber: "POL-2938",
          rank: "Officer",
          status: "Active",
          phone: "+91 76543 21098",
          email: "amit.patel@vision.gov",
          assignedIncidents: 15
        },
        {
          officerId: "officer_4",
          name: "Officer Vikram Singh",
          badgeNumber: "POL-5847",
          rank: "Officer",
          status: "Inactive", // Deactivated for test representation
          phone: "+91 65432 10987",
          email: "vikram.singh@vision.gov",
          assignedIncidents: 4
        }
      ];

      for (const officer of dummyOfficers) {
        await setDoc(doc(dbFirestore, "officers", officer.officerId), officer);
        
        // Also create users mapping
        await setDoc(doc(dbFirestore, "users", officer.officerId), {
          uid: officer.officerId,
          name: officer.name,
          email: officer.email,
          role: officer.rank,
          status: officer.status,
          badgeNumber: officer.badgeNumber,
          createdAt: new Date().toISOString()
        });
      }
    }

    // Check if sos_history is empty
    const sosHistoryCol = collection(dbFirestore, "sos_history");
    const sosHistorySnap = await getDocs(query(sosHistoryCol, limit(1)));

    if (sosHistorySnap.empty) {
      console.log("Seeding SOS History database...");
      const historicalAlerts = [
        {
          alertId: "SOS-8947-1",
          userName: "Ananya Iyer",
          phone: "+91 99988 87766",
          latitude: 28.6145,
          longitude: 77.2085,
          nearestLight: "SL1",
          distance: "45m",
          status: "RESOLVED",
          priority: "HIGH",
          resolvedBy: "Inspector Rajesh Kumar",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
          resolutionNotes: "Dispatched patrol car. Found citizen safely escorted to nearest metro station."
        },
        {
          alertId: "SOS-7291-2",
          userName: "Rahul Verma",
          phone: "+91 98888 77766",
          latitude: 28.6190,
          longitude: 77.2160,
          nearestLight: "SL2",
          distance: "12m",
          status: "SAFE",
          priority: "CRITICAL",
          resolvedBy: "Officer Priya Sharma",
          timestamp: new Date(Date.now() - 3600000 * 6).toISOString(), // 6 hours ago
          resolutionNotes: "Accidental press, citizen verified safe. Checked area via nearby smart streetlight camera."
        },
        {
          alertId: "SOS-4821-3",
          userName: "Neha Gupta",
          phone: "+91 97777 66655",
          latitude: 28.6110,
          longitude: 77.2205,
          nearestLight: "SL3",
          distance: "80m",
          status: "RESOLVED",
          priority: "HIGH",
          resolvedBy: "Officer Amit Patel",
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
          resolutionNotes: "Street harassment reported. Dispatched Beat Officer Patel. Suspect fled, victim escorted home."
        },
        {
          alertId: "SOS-3829-4",
          userName: "Suresh Pillai",
          phone: "+91 96666 55544",
          latitude: 28.6215,
          longitude: 77.2015,
          nearestLight: "SL4",
          distance: "110m",
          status: "SAFE",
          priority: "LOW",
          resolvedBy: "Officer Amit Patel",
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
          resolutionNotes: "Drunk altercation in neighborhood. Resolved on spot."
        }
      ];

      for (const alert of historicalAlerts) {
        await addDoc(sosHistoryCol, alert);
      }
    }

    // Check if incident_history is empty
    const incidentHistoryCol = collection(dbFirestore, "incident_history");
    const incidentHistorySnap = await getDocs(query(incidentHistoryCol, limit(1)));

    if (incidentHistorySnap.empty) {
      console.log("Seeding Incidents database...");
      const dummyIncidents = [
        {
          caseId: "CASE-9281",
          citizenName: "Rohan Deshmukh",
          phone: "+91 94444 33322",
          assignedOfficer: "Officer Priya Sharma",
          assignedLight: "SL2",
          status: "IN_PROGRESS",
          createdAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
        },
        {
          caseId: "CASE-1049",
          citizenName: "Kavita Rao",
          phone: "+91 93333 22211",
          assignedOfficer: "Officer Amit Patel",
          assignedLight: "SL1",
          status: "ACTIVE",
          createdAt: new Date(Date.now() - 900000).toISOString(), // 15 min ago
        },
        {
          caseId: "CASE-4921",
          citizenName: "Ananya Iyer",
          phone: "+91 99988 87766",
          assignedOfficer: "Inspector Rajesh Kumar",
          assignedLight: "SL1",
          status: "RESOLVED",
          createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
          resolvedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        }
      ];

      for (const incident of dummyIncidents) {
        await setDoc(doc(dbFirestore, "incident_history", incident.caseId), incident);
      }
    }

    // Check if police stations are seeded
    const stationsCol = collection(dbFirestore, "police_stations");
    const stationsSnap = await getDocs(query(stationsCol, limit(1)));
    if (stationsSnap.empty) {
      console.log("Seeding police stations...");
      const defaultStations = [
        { name: "Police HQ Station", lat: 28.6139, lng: 77.2090, details: "Delhi Main Control Hub" },
        { name: "West Sector Precinct", lat: 28.6210, lng: 77.2010, details: "Sector 3 Patrol Dispatch" },
        { name: "East Sector Precinct", lat: 28.6100, lng: 77.2220, details: "Sector 7 Patrol Dispatch" }
      ];
      for (const st of defaultStations) {
        await addDoc(stationsCol, st);
      }
    }

    // Check if police units are seeded
    const unitsCol = collection(dbFirestore, "police_units");
    const unitsSnap = await getDocs(query(unitsCol, limit(1)));
    if (unitsSnap.empty) {
      console.log("Seeding police patrol units...");
      const defaultUnits = [
        { name: "Patrol Alpha", officer: "Inspector Rajesh Kumar", lat: 28.6120, lng: 77.2050 },
        { name: "Patrol Delta", officer: "Officer Priya Sharma", lat: 28.6160, lng: 77.2180 },
        { name: "Beat Patrol 4", officer: "Officer Amit Patel", lat: 28.6080, lng: 77.2130 }
      ];
      for (const un of defaultUnits) {
        await addDoc(unitsCol, un);
      }
    }

  } catch (error) {
    console.error("Error seeding Firestore:", error);
  }
};

// Real-time Firestore Listeners
export const subscribeToOfficers = (onUpdate) => {
  const q = query(collection(dbFirestore, "officers"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const officers = [];
    snapshot.forEach((doc) => {
      officers.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(officers);
  }, (error) => {
    console.error("Error subscribing to officers:", error);
  });
};

export const subscribeToSOSHistory = (onUpdate) => {
  const q = query(collection(dbFirestore, "sos_history"), orderBy("timestamp", "desc"));
  return onSnapshot(q, (snapshot) => {
    const history = [];
    snapshot.forEach((doc) => {
      history.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(history);
  }, (error) => {
    console.error("Error subscribing to SOS history:", error);
  });
};

export const subscribeToIncidents = (onUpdate) => {
  const q = query(collection(dbFirestore, "incident_history"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const incidents = [];
    snapshot.forEach((doc) => {
      incidents.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(incidents);
  }, (error) => {
    console.error("Error subscribing to incidents:", error);
  });
};

export const subscribeToPoliceStations = (onUpdate) => {
  const q = query(collection(dbFirestore, "police_stations"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const stations = [];
    snapshot.forEach((doc) => {
      stations.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(stations);
  }, (error) => {
    console.error("Error subscribing to police stations:", error);
  });
};

export const subscribeToPoliceUnits = (onUpdate) => {
  const q = query(collection(dbFirestore, "police_units"), orderBy("name"));
  return onSnapshot(q, (snapshot) => {
    const units = [];
    snapshot.forEach((doc) => {
      units.push({ id: doc.id, ...doc.data() });
    });
    onUpdate(units);
  }, (error) => {
    console.error("Error subscribing to police units:", error);
  });
};
