import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { updateUserProfile, updateUserPassword } from "../services/authService";
import { 
  User, 
  Key, 
  ShieldCheck, 
  Mail, 
  Hash, 
  UserCheck, 
  Lock,
  ArrowRight
} from "lucide-react";

const Profile = () => {
  const { profile, user } = useAuth();
  const { addToast } = useNotifications();

  // Profile update form state
  const [name, setName] = useState(profile?.name || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change form state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name) {
      addToast("Name field cannot be blank.", "warning");
      return;
    }

    setUpdatingProfile(true);
    try {
      await updateUserProfile(name);
      addToast("Display name updated successfully in CAD directory.", "success");
    } catch (err) {
      addToast(err.message || "Failed to update profile.", "danger");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      addToast("Please fill in all security passkey fields.", "warning");
      return;
    }

    if (newPassword.length < 6) {
      addToast("Security passkey must be at least 6 characters.", "warning");
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast("Passkeys do not match.", "warning");
      return;
    }

    setUpdatingPassword(true);
    try {
      await updateUserPassword(newPassword);
      addToast("Security passkey updated successfully.", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(err.message || "Failed to update passkey. Re-login required.", "danger");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
          <User className="text-blue-500" />
          Officer Command Profile
        </h2>
        <p className="text-xs text-gray-400">
          Manage officer badge details, contact email, and dashboard access credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Details Card */}
        <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden h-fit">
          {/* Security badge ribbon */}
          <div className="absolute top-0 right-0 bg-blue-600 text-white px-3 py-1 text-[8px] font-bold uppercase tracking-widest rounded-bl-lg font-mono">
            CAD ACCESS
          </div>

          <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-brand-border flex items-center justify-center text-gray-400 mb-4 text-3xl">
            {profile?.name ? profile.name.charAt(0).toUpperCase() : "O"}
          </div>

          <h3 className="font-bold text-lg text-brand-text">{profile?.name}</h3>
          <p className="text-xs text-gray-400 uppercase tracking-widest mt-0.5">{profile?.role}</p>

          <div className="w-full mt-6 space-y-3.5 text-xs text-left border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <Mail size={12} /> Email Account
              </span>
              <span className="font-mono text-gray-200">{profile?.email || user?.email}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <Hash size={12} /> Badge Number
              </span>
              <span className="font-mono text-gray-200">{profile?.badgeNumber || "POL-7291"}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <UserCheck size={12} /> Authorization
              </span>
              <span className="text-green-400 font-mono uppercase font-bold">{profile?.role || "Officer"}</span>
            </div>

            <div className="flex items-center justify-between text-gray-300">
              <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1.5">
                <ShieldCheck size={12} /> Account Status
              </span>
              <span className="text-green-400 font-mono uppercase font-bold">Active Duty</span>
            </div>
          </div>
        </div>

        {/* Profile Modification & Password update forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Modify Profile */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-brand-border pb-3 mb-5">
              Personal Information
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Display Roster Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                    placeholder="Enter name..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingProfile}
                  className="px-5 py-2.5 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                >
                  {updatingProfile ? "Saving Profile..." : "Update Name"}
                </button>
              </div>
            </form>
          </div>

          {/* Change Security Passkey */}
          <div className="bg-brand-card border border-brand-border rounded-xl p-6 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-brand-border pb-3 mb-5">
              Change Security Key
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* New Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    New Security Key
                  </label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-600 focus:outline-none"
                      placeholder="Min 6 characters..."
                      required
                    />
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Confirm Security Key
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text placeholder-slate-600 focus:outline-none"
                      placeholder="Repeat passkey..."
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updatingPassword}
                  className="px-5 py-2.5 bg-red-950/20 hover:bg-red-900/40 text-brand-danger border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Change Security Key</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
