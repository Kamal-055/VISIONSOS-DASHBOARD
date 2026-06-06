import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, dbFirestore } from "../firebase/firebaseConfig";
import { getUserProfile } from "../services/authService";

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  isOfficer: false,
  isSupervisor: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Retrieve or initialize profile in Firestore
        const userDocRef = doc(dbFirestore, "users", currentUser.uid);
        
        // Listen to changes on the user profile in Firestore
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data());
            setLoading(false);
          } else {
            // Profile does not exist yet (e.g. first login). Auto-create to avoid lockout
            const email = currentUser.email || "";
            const isEmailAdmin = email.toLowerCase().includes("admin") || email === "visionsos@admin.com";
            
            const newProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || email.split("@")[0] || "Officer",
              email: email,
              role: isEmailAdmin ? "Admin" : "Officer",
              status: "Active",
              badgeNumber: "BADGE-" + Math.floor(1000 + Math.random() * 9000),
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            };
            
            try {
              await setDoc(userDocRef, newProfile);
              
              // Also add to officers collection if they are an officer or admin
              const officerDocRef = doc(dbFirestore, "officers", currentUser.uid);
              await setDoc(officerDocRef, {
                officerId: currentUser.uid,
                name: newProfile.name,
                badgeNumber: newProfile.badgeNumber,
                rank: newProfile.role,
                status: "Active",
                phone: currentUser.phoneNumber || "+1 (555) 019-2831",
                email: email,
                assignedIncidents: 0
              });

              setProfile(newProfile);
            } catch (err) {
              console.error("Error auto-creating user profile in Firestore:", err);
            }
            setLoading(false);
          }
        });

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === "Admin",
    isOfficer: profile?.role === "Officer",
    isSupervisor: profile?.role === "Supervisor" || profile?.role === "Admin", // supervisor permissions
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
