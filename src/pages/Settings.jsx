import React, { useState, useEffect } from "react";
import { useNotifications } from "../context/NotificationContext";
import { useTheme } from "../context/ThemeContext";
import { seedDefaultStreetlights, updateStreetlight } from "../services/rtdbService";
import { 
  Settings as SettingsIcon, 
  Volume2, 
  MapPin, 
  ShieldAlert, 
  Database, 
  Wrench, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Info
} from "lucide-react";

const Settings = () => {
  const { addToast } = useNotifications();
  const { theme, setTheme } = useTheme();

  // Load preferences from local storage or set defaults
  const [volume, setVolume] = useState(() => Number(localStorage.getItem("settings_alarm_volume") || 50));
  const [mapZoom, setMapZoom] = useState(() => Number(localStorage.getItem("settings_map_zoom") || 14));
  const [batteryThreshold, setBatteryThreshold] = useState(() => Number(localStorage.getItem("settings_battery_threshold") || 20));
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("settings_sound_enabled") !== "false");
  
  const [seeding, setSeeding] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Save updates to LocalStorage
  const handleSavePreferences = (e) => {
    e.preventDefault();
    localStorage.setItem("settings_alarm_volume", volume);
    localStorage.setItem("settings_map_zoom", mapZoom);
    localStorage.setItem("settings_battery_threshold", batteryThreshold);
    localStorage.setItem("settings_sound_enabled", soundEnabled);
    addToast("Preferences saved to local browser cache.", "success");
  };

  const handleResetStreetlights = async () => {
    setSeeding(true);
    try {
      await seedDefaultStreetlights();
      addToast("Default streetlight nodes registered in Realtime Database.", "success");
    } catch (e) {
      addToast("Failed to seed streetlights.", "danger");
    } finally {
      setSeeding(false);
    }
  };

  // Simulate a low battery situation on SL3 to trigger alerts
  const simulateLowBattery = async () => {
    setSimulating(true);
    try {
      await updateStreetlight("SL3", {
        battery: 12, // Below threshold
        status: "ONLINE",
        state: "MAINTENANCE"
      });
      addToast("Simulated low battery on pole SL3. Check streetlights page.", "warning");
    } catch (e) {
      addToast("Simulation write failed.", "danger");
    } finally {
      setSimulating(false);
    }
  };

  // Simulate a pole going offline completely
  const simulateOfflinePole = async () => {
    setSimulating(true);
    try {
      await updateStreetlight("SL2", {
        status: "OFFLINE",
        state: "OFFLINE",
        battery: 0
      });
      addToast("Simulated connection blackout on pole SL2.", "danger");
    } catch (e) {
      addToast("Simulation write failed.", "danger");
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
          <SettingsIcon className="text-blue-500" />
          System Preferences & Diagnostics
        </h2>
        <p className="text-xs text-gray-400">
          Customize CAD thresholds, alarm sound volume, mapping parameters, and simulation triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Preferences Form */}
        <div className="lg:col-span-2 bg-brand-card border border-brand-border rounded-xl shadow-lg p-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-brand-border pb-3 mb-5">
            Operational Parameters
          </h3>
          
          <form onSubmit={handleSavePreferences} className="space-y-5">
            {/* Alarm Sound Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Alarm Sounds
                </label>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="flex items-center gap-3 py-2 text-xs text-brand-text cursor-pointer"
                >
                  {soundEnabled ? (
                    <ToggleRight className="w-8 h-8 text-brand-primary" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-500" />
                  )}
                  <span>Enable emergency sirens on distress</span>
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1.5">
                  <Volume2 size={12} />
                  Siren Volume ({volume}%)
                </label>
                <input
                  type="range"
                  min="5"
                  max="100"
                  value={volume}
                  disabled={!soundEnabled}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full accent-blue-600 disabled:opacity-30 cursor-pointer"
                />
              </div>
            </div>

            {/* Map Default Zoom & Battery thresholds */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1.5">
                  <MapPin size={12} />
                  Default GIS Zoom Level ({mapZoom})
                </label>
                <select
                  value={mapZoom}
                  onChange={(e) => setMapZoom(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                >
                  <option value="12">12 - Regional Sector Overview</option>
                  <option value="14">14 - Sector Neighborhood (Default)</option>
                  <option value="16">16 - Street-Level Close-up</option>
                  <option value="18">18 - Pole-Level Precision</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block flex items-center gap-1.5">
                  <ShieldAlert size={12} />
                  Battery Alert Threshold ({batteryThreshold}%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="50"
                  value={batteryThreshold}
                  onChange={(e) => setBatteryThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Theme Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-brand-border/30">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  Theme Preference
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-brand-border focus:border-brand-primary rounded-lg text-xs text-brand-text focus:outline-none"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">System Mode</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-brand-primary hover:bg-blue-700 text-xs font-bold uppercase tracking-wider text-white rounded-lg transition-colors cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Diagnostics & Simulator */}
        <div className="space-y-6">
          {/* Seeding & Reset */}
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-brand-border pb-3 mb-4 flex items-center gap-2">
              <Database size={14} className="text-blue-400" />
              CAD DB Management
            </h3>
            
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Write initial smart streetlights coordinates to the Realtime Database. Safe to click if nodes are empty.
            </p>

            <button
              onClick={handleResetStreetlights}
              disabled={seeding}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-200 border border-brand-border rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Wrench size={14} />
              {seeding ? "Provisioning..." : "Seed Smart Streetlights"}
            </button>
          </div>

          {/* Incident Simulation */}
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-200 border-b border-brand-border pb-3 mb-4 flex items-center gap-2">
              <Sparkles size={14} className="text-brand-warning" />
              Incident Simulator
            </h3>
            
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Simulate hardware faults on IoT streetlights to verify dashboard warnings and sound alert triggers.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={simulateLowBattery}
                disabled={simulating}
                className="w-full py-2 bg-amber-950/20 hover:bg-amber-900/30 text-brand-warning border border-amber-500/20 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Simulate Low Battery (SL3)
              </button>
              
              <button
                onClick={simulateOfflinePole}
                disabled={simulating}
                className="w-full py-2 bg-red-950/20 hover:bg-red-900/30 text-brand-danger border border-red-500/20 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Simulate Connection Blackout (SL2)
              </button>
            </div>
          </div>

          {/* Firebase Meta Info */}
          <div className="bg-brand-card border border-brand-border rounded-xl shadow-lg p-6 text-[10px] font-mono text-gray-500 space-y-1">
            <div className="flex items-center gap-1 text-gray-400 mb-2">
              <Info size={12} />
              <span className="font-bold uppercase tracking-wider">PROJECT METRICS</span>
            </div>
            <p>PROJECT_ID: vision-sos-5df6a</p>
            <p>RTDB_URL: https://vision-sos-5df6a...firebaseio.com</p>
            <p>FIREBASE_AUTH: PERSISTENT_LOCAL</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
