import React, { createContext, useContext, useState, useEffect, useRef } from "react";

const NotificationContext = createContext({
  toasts: [],
  addToast: (message, type) => {},
  removeToast: (id) => {},
  isSirenPlaying: false,
  setSirenPlaying: (play) => {},
  isMuted: false,
  setMuted: (mute) => {},
  activeSOSAlerts: [] // List of active SOS alerts trigger banners
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isSirenPlaying, setSirenPlaying] = useState(false);
  const [isMuted, setMuted] = useState(false);
  const [activeSOSAlerts, setActiveSOSAlerts] = useState([]);
  
  const audioCtxRef = useRef(null);
  const osc1Ref = useRef(null);
  const osc2Ref = useRef(null);
  const gainNodeRef = useRef(null);
  const sirenIntervalRef = useRef(null);

  // Helper to add toast notifications
  const addToast = (message, type = "info") => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Web Audio API emergency siren synthesizer
  const startSirenAudio = () => {
    if (isMuted) return;
    
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Create main gain node for volume control
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime); // Low volume so it is not annoying
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      // Create two oscillators for a dual-tone police siren
      const osc1 = ctx.createOscillator();
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(450, ctx.currentTime);
      osc1.connect(gainNode);
      osc1.start();
      osc1Ref.current = osc1;

      // Siren tone modulation
      let toggle = false;
      sirenIntervalRef.current = setInterval(() => {
        const time = ctx.currentTime;
        if (toggle) {
          osc1.frequency.exponentialRampToValueAtTime(750, time + 0.4);
        } else {
          osc1.frequency.exponentialRampToValueAtTime(450, time + 0.4);
        }
        toggle = !toggle;
      }, 500);

    } catch (error) {
      console.error("Failed to start siren audio synth:", error);
    }
  };

  const stopSirenAudio = () => {
    if (sirenIntervalRef.current) {
      clearInterval(sirenIntervalRef.current);
      sirenIntervalRef.current = null;
    }
    
    if (osc1Ref.current) {
      try {
        osc1Ref.current.stop();
        osc1Ref.current.disconnect();
      } catch (e) {}
      osc1Ref.current = null;
    }
    
    if (gainNodeRef.current) {
      try {
        gainNodeRef.current.disconnect();
      } catch (e) {}
      gainNodeRef.current = null;
    }
    
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      // Just suspend context instead of closing to reuse it
      audioCtxRef.current.suspend();
    }
  };

  // Handle playing/stopping the siren based on states
  useEffect(() => {
    if (isSirenPlaying && !isMuted) {
      startSirenAudio();
    } else {
      stopSirenAudio();
    }

    return () => stopSirenAudio();
  }, [isSirenPlaying, isMuted]);

  const value = {
    toasts,
    addToast,
    removeToast,
    isSirenPlaying,
    setSirenPlaying,
    isMuted,
    setMuted,
    activeSOSAlerts,
    setActiveSOSAlerts
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Toast Notification Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between p-4 rounded-lg shadow-lg border text-brand-text transition-all duration-300 transform translate-y-0 ${
              toast.type === "danger"
                ? "bg-red-950 border-red-500 text-red-200"
                : toast.type === "success"
                ? "bg-emerald-950 border-emerald-500 text-emerald-200"
                : toast.type === "warning"
                ? "bg-amber-950 border-amber-500 text-amber-200"
                : "bg-slate-900 border-slate-700 text-slate-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === "danger" && (
                <span className="w-2 h-2 rounded-full bg-brand-danger animate-ping" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 text-xs font-bold text-gray-400 hover:text-gray-200 cursor-pointer"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
