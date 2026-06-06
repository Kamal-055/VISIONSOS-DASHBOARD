import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { loginWithEmail, sendPasswordReset } from "../services/authService";
import { useNotifications } from "../context/NotificationContext";
import { Shield, Lock, Mail, Eye, EyeOff, AlertTriangle } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const { addToast } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  // Get path to redirect back to (default: dashboard "/")
  const from = location.state?.from?.pathname || "/";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast("Please fill in all fields", "warning");
      return;
    }

    setIsSubmitting(true);
    try {
      await loginWithEmail(email, password);
      addToast("Access granted. Welcome to VISION SOS Console.", "success");
      navigate(from, { replace: true });
    } catch (err) {
      console.error(err);
      addToast(err.message || "Authentication failed. Check credentials.", "danger");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      addToast("Please enter your email", "warning");
      return;
    }

    setIsForgotSubmitting(true);
    try {
      await sendPasswordReset(forgotEmail);
      addToast("Reset link sent. Check your inbox.", "success");
      setShowForgotModal(false);
      setForgotEmail("");
    } catch (err) {
      addToast(err.message || "Failed to send reset email.", "danger");
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="bg-brand-card border border-brand-border rounded-xl shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Header section */}
      <div className="bg-slate-900/60 p-6 text-center border-b border-brand-border">
        <div className="inline-flex items-center justify-center p-3.5 rounded-full bg-blue-600/10 border border-blue-500/20 text-brand-primary mb-4">
          <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
        </div>
        <h2 className="font-display font-bold text-2xl tracking-wider uppercase text-brand-text">
          Vision SOS
        </h2>
        <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
          Police Control Room Login
        </p>
      </div>

      {/* Form section */}
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Email field */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Authorization Email
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              <Mail size={16} />
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-sm text-brand-text placeholder-slate-500 focus:outline-none transition-colors"
              placeholder="officer@vision.gov"
              required
            />
          </div>
        </div>

        {/* Password field */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400">
              Security Key
            </label>
            <button
              type="button"
              onClick={() => setShowForgotModal(true)}
              className="text-xs text-brand-primary hover:underline hover:text-blue-400 cursor-pointer"
            >
              Reset Key?
            </button>
          </div>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-500">
              <Lock size={16} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-sm text-brand-text placeholder-slate-500 focus:outline-none transition-colors"
              placeholder="••••••••••••"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-500 hover:text-brand-text cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-brand-primary hover:bg-blue-700 text-white rounded-lg text-sm font-bold uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            "Authenticate Console"
          )}
        </button>
      </form>

      {/* Info footer */}
      <div className="bg-slate-900/40 p-4 text-center border-t border-brand-border text-[10px] text-slate-500 font-mono">
        SECURE TERMINAL // AUTHORIZED PERSONNEL ONLY
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="bg-brand-card border border-brand-border w-full max-w-sm rounded-xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-brand-border flex items-center gap-3">
              <AlertTriangle className="text-brand-warning w-5 h-5" />
              <h3 className="font-display font-bold text-sm uppercase tracking-wider text-brand-text">
                Password Reset Request
              </h3>
            </div>
            <form onSubmit={handleForgotPassword} className="p-6 space-y-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                Enter your authorized police email address below. We will send a secure link to reset your console security key.
              </p>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-sm text-brand-text focus:outline-none"
                  placeholder="officer@vision.gov"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotEmail("");
                  }}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-xs font-semibold uppercase rounded-lg text-gray-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotSubmitting}
                  className="px-4 py-2 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase rounded-lg text-white disabled:opacity-50 cursor-pointer"
                >
                  {isForgotSubmitting ? "Sending..." : "Send Reset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
