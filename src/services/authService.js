import { 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail, 
  updatePassword, 
  updateProfile 
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, dbFirestore } from "../firebase/firebaseConfig";

// Log in user with email and password
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    throw new Error(error.message || "Failed to login. Please check your credentials.");
  }
};

// Log out user
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(error.message || "Failed to logout.");
  }
};

// Send password reset email
export const sendPasswordReset = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    throw new Error(error.message || "Failed to send password reset email.");
  }
};

// Update password of current user
export const updateUserPassword = async (newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No active session found.");
  try {
    await updatePassword(user, newPassword);
  } catch (error) {
    throw new Error(error.message || "Failed to update password.");
  }
};

// Update profile name
export const updateUserProfile = async (displayName) => {
  const user = auth.currentUser;
  if (!user) throw new Error("No active session found.");
  try {
    await updateProfile(user, { displayName });
    
    // Also update in firestore
    const userDocRef = doc(dbFirestore, "users", user.uid);
    await setDoc(userDocRef, { name: displayName }, { merge: true });
    
    const officerDocRef = doc(dbFirestore, "officers", user.uid);
    const officerSnap = await getDoc(officerDocRef);
    if (officerSnap.exists()) {
      await setDoc(officerDocRef, { name: displayName }, { merge: true });
    }
  } catch (error) {
    throw new Error(error.message || "Failed to update profile.");
  }
};

// Fetch user profile from Firestore
export const getUserProfile = async (uid) => {
  try {
    const docRef = doc(dbFirestore, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error("Error fetching user profile from firestore:", error);
    return null;
  }
};
