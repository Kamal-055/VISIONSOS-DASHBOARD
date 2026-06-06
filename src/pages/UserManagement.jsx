import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { useNotifications } from "../context/NotificationContext";
import { subscribeToOfficers, createOfficer, updateOfficerDetails, deactivateOfficerAccount } from "../services/firestoreService";
import { 
  Users, 
  UserPlus, 
  ShieldAlert, 
  Edit2, 
  ShieldOff, 
  UserCheck, 
  Shield, 
  Lock, 
  Mail, 
  Phone, 
  Hash,
  BadgeAlert
} from "lucide-react";

// Same config to create secondary auth registrations
const firebaseConfig = {
  apiKey: "AIzaSyCrnXI42hERpMIW4VJCGvcOYUb5yffFdp8",
  authDomain: "vision-sos-5df6a.firebaseapp.com",
  databaseURL: "https://vision-sos-5df6a-default-rtdb.firebaseio.com",
  projectId: "vision-sos-5df6a",
  storageBucket: "vision-sos-5df6a.firebasestorage.app",
  messagingSenderId: "350079474652",
  appId: "1:350079474652:web:ef38523224743bc7eb0d19"
};

const UserManagement = () => {
  const { addToast } = useNotifications();
  
  // States
  const [officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Control
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form States - Add Officer
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [rank, setRank] = useState("Officer");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form States - Edit Officer
  const [targetOfficer, setTargetOfficer] = useState(null);
  const [editName, setEditName] = useState("");
  const [editBadge, setEditBadge] = useState("");
  const [editRank, setEditRank] = useState("Officer");
  const [editPhone, setEditPhone] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  useEffect(() => {
    const unsub = subscribeToOfficers((data) => {
      setOfficers(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !badgeNumber || !phone) {
      addToast("Please fill in all required registration fields.", "warning");
      return;
    }

    setSubmitting(true);
    let secondaryApp = null;
    try {
      // 1. Initialize a secondary Firebase app instance to register Auth details
      // This prevents the current Admin dispatcher session from being signed out!
      const appName = "SecondaryRegistrationApp_" + Date.now();
      secondaryApp = initializeApp(firebaseConfig, appName);
      const secondaryAuth = getAuth(secondaryApp);
      
      // 2. Create user inside secondary instance
      const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
      const newUid = credential.user.uid;
      
      // 3. Clear secondary session immediately
      await signOut(secondaryAuth);
      
      // 4. Save details in Firestore using the main admin session
      const officerData = {
        name,
        email,
        badgeNumber,
        rank,
        status: "Active",
        phone
      };
      
      await createOfficer(newUid, officerData);
      
      addToast(`Officer account created for ${name} (${badgeNumber})`, "success");
      setShowAddModal(false);
      resetAddForm();
    } catch (err) {
      console.error(err);
      addToast("Failed to register officer: " + err.message, "danger");
    } finally {
      setSubmitting(false);
      if (secondaryApp) {
        try {
          await secondaryApp.delete();
        } catch (e) {}
      }
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!targetOfficer) return;

    setSubmitting(true);
    try {
      await updateOfficerDetails(targetOfficer.officerId, {
        name: editName,
        badgeNumber: editBadge,
        rank: editRank,
        phone: editPhone,
        status: editStatus
      });
      addToast("Officer configuration updated successfully.", "success");
      setShowEditModal(false);
    } catch (err) {
      addToast("Failed to update officer profile.", "danger");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (officerId, officerName) => {
    if (!window.confirm(`Are you sure you want to deactivate ${officerName}? They will lose dashboard entry permissions.`)) return;
    
    try {
      await deactivateOfficerAccount(officerId);
      addToast(`Officer account ${officerName} deactivated.`, "info");
    } catch (err) {
      addToast("Failed to deactivate account.", "danger");
    }
  };

  const resetAddForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setBadgeNumber("");
    setRank("Officer");
    setPhone("");
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
            <Users className="text-brand-primary" />
            Duty Roster & User Management
          </h2>
          <p className="text-xs text-gray-400">
            Admin console to register, profile, and audit police officer credentials.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors cursor-pointer shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20"
        >
          <UserPlus size={14} />
          <span>Register Officer</span>
        </button>
      </div>

      {/* Officers List Table */}
      <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : officers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 border-b border-brand-border text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="p-4">Badge ID</th>
                  <th className="p-4">Officer Details</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Clearance Role</th>
                  <th className="p-4">Duty Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-xs">
                {officers.map((off) => (
                  <tr key={off.officerId} className="hover:bg-slate-900/40 text-gray-300">
                    <td className="p-4 font-mono font-bold text-blue-400">
                      {off.badgeNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-semibold text-brand-text">{off.name}</div>
                      <div className="text-[10px] text-gray-500 font-mono">{off.email}</div>
                    </td>
                    <td className="p-4 text-gray-300 font-mono">
                      {off.phone}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        off.rank === "Admin"
                          ? "bg-red-950/40 text-brand-danger border-red-500/20"
                          : off.rank === "Supervisor"
                          ? "bg-amber-950/40 text-brand-warning border-amber-500/20"
                          : "bg-blue-950/40 text-blue-400 border-blue-500/20"
                      }`}>
                        {off.rank}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase ${
                        off.status === "Active"
                          ? "bg-emerald-950/40 text-brand-success border-emerald-500/20"
                          : "bg-slate-900 text-gray-500 border-slate-700"
                      }`}>
                        {off.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setTargetOfficer(off);
                            setEditName(off.name);
                            setEditBadge(off.badgeNumber);
                            setEditRank(off.rank);
                            setEditPhone(off.phone);
                            setEditStatus(off.status);
                            setShowEditModal(true);
                          }}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-brand-border rounded cursor-pointer"
                          title="Edit Officer details"
                        >
                          <Edit2 size={12} />
                        </button>
                        
                        {off.status === "Active" ? (
                          <button
                            onClick={() => handleDeactivate(off.officerId, off.name)}
                            className="p-2 bg-red-950/40 text-red-400 hover:bg-red-950 border border-red-500/20 rounded cursor-pointer"
                            title="Deactivate security key"
                          >
                            <ShieldOff size={12} />
                          </button>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-500">DEACTIVATED</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl font-mono text-xs text-slate-500">
            No officers on duty rosters. Seed databases or register new ones above.
          </div>
        )}
      </div>

      {/* Register Officer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-md rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <UserPlus className="text-brand-primary w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Register Deployed Officer
              </h3>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Full Officer Name
                </label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Officer name..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Security Email (Login)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@vision.gov"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Assigned Security Passkey
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters..."
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Badge Number */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Badge ID
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={badgeNumber}
                      onChange={(e) => setBadgeNumber(e.target.value)}
                      placeholder="POL-8291"
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Clearance */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Role Rank
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none h-[38px]"
                  >
                    <option value="Officer">Officer (Dispatcher)</option>
                    <option value="Supervisor">Supervisor (Inspector)</option>
                    <option value="Admin">Admin (Director)</option>
                  </select>
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Emergency Phone
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 90000 00000"
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddForm();
                  }}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase rounded-lg text-white disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Signing Security..." : "Register Officer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Officer Modal */}
      {showEditModal && targetOfficer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <Edit2 className="text-brand-primary w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Edit Officer Profile
              </h3>
            </div>
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Officer Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Badge ID
                  </label>
                  <input
                    type="text"
                    value={editBadge}
                    onChange={(e) => setEditBadge(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Clearance Role
                  </label>
                  <select
                    value={editRank}
                    onChange={(e) => setEditRank(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none h-[34px]"
                  >
                    <option value="Officer">Officer</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Duty Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none h-[34px]"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase rounded-lg text-white disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
