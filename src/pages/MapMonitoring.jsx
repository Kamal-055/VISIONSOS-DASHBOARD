import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { subscribeToActiveIncidents, subscribeToStreetlights, subscribeToLiveTracking } from "../services/rtdbService";
import { subscribeToPoliceStations, subscribeToPoliceUnits } from "../services/firestoreService";
import { Radio, ShieldAlert, Compass } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useLocation } from "react-router-dom";

// Inline SVG Pins to avoid Vite Leaflet asset resolution bugs
const createSVGIcon = (color, type) => {
  let innerSVG = "";
  if (type === "sos") {
    innerSVG = `
      <circle cx="12" cy="12" r="10" fill="${color}" fill-opacity="0.2"/>
      <circle cx="12" cy="12" r="6" fill="${color}" fill-opacity="0.4"/>
      <circle cx="12" cy="12" r="3" fill="${color}"/>
    `;
  } else if (type === "police") {
    innerSVG = `
      <path d="M12 2L3 5v6c0 5.5 3.8 10.7 9 12 5.2-1.3 9-6.5 9-12V5l-9-3z" fill="${color}"/>
      <circle cx="12" cy="12" r="3" fill="#ffffff"/>
    `;
  } else if (type === "light") {
    innerSVG = `
      <path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" fill="${color}"/>
      <path d="M9 21h6" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    `;
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      ${type === "sos" ? `<div class="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-60"></div>` : ""}
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="z-10 shadow-lg">
        ${innerSVG}
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: "custom-leaflet-icon",
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
  });
};

const icons = {
  sos: createSVGIcon("#EF4444", "sos"),
  police: createSVGIcon("#2563EB", "police"),
  lightOnline: createSVGIcon("#22C55E", "light"),
  lightMaint: createSVGIcon("#F59E0B", "light"),
  lightOffline: createSVGIcon("#64748B", "light"),
};

// Component to dynamically recenter the map on live events without looping
const ChangeMapView = ({ center }) => {
  const map = useMap();
  const prevCenterRef = React.useRef(null);

  useEffect(() => {
    if (center && (!prevCenterRef.current || prevCenterRef.current[0] !== center[0] || prevCenterRef.current[1] !== center[1])) {
      prevCenterRef.current = center;
      map.setView(center, 15, { animate: true });
    }
  }, [center, map]);
  return null;
};

const MapMonitoring = () => {
  const { resolvedTheme } = useTheme();
  const location = useLocation();
  const centerAlertId = location?.state?.centerAlertId;
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [streetlights, setStreetlights] = useState({});
  const [policeStations, setPoliceStations] = useState([]);
  const [policeUnits, setPoliceUnits] = useState([]);
  const [liveLocations, setLiveLocations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let trackingUnsubs = {};

    // 1. Subscribe to Live SOS Alerts from RTDB active_incidents
    const unsubAlerts = subscribeToActiveIncidents((alerts) => {
      setActiveAlerts(alerts);
      
      // Setup tracking for all active users
      const newTrackingUnsubs = {};
      alerts.forEach((alert) => {
        const userId = alert.uid || alert.user;
        if (userId && !trackingUnsubs[userId]) {
          newTrackingUnsubs[userId] = subscribeToLiveTracking(userId, (loc) => {
            if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
              setLiveLocations((prev) => ({
                ...prev,
                [userId]: loc
              }));
            }
          });
        } else if (userId && trackingUnsubs[userId]) {
          newTrackingUnsubs[userId] = trackingUnsubs[userId];
          delete trackingUnsubs[userId];
        }
      });

      // Unsubscribe from users who are no longer active
      Object.keys(trackingUnsubs).forEach((userId) => {
        trackingUnsubs[userId]();
      });

      trackingUnsubs = newTrackingUnsubs;
    });

    // 2. Subscribe to Streetlights
    const unsubLights = subscribeToStreetlights((lights) => {
      setStreetlights(lights);
    });

    // 3. Subscribe to Police Stations
    const unsubStations = subscribeToPoliceStations((stations) => {
      setPoliceStations(stations);
    });

    // 4. Subscribe to Police Patrol Units
    const unsubUnits = subscribeToPoliceUnits((units) => {
      setPoliceUnits(units);
      setLoading(false);
    });

    return () => {
      unsubAlerts();
      unsubLights();
      unsubStations();
      unsubUnits();
      Object.values(trackingUnsubs).forEach((unsub) => unsub());
    };
  }, []);

  // Compute final positions, using live moving GPS coordinate if tracked, otherwise static
  const alertsWithPositions = React.useMemo(() => {
    return activeAlerts.map((alert) => {
      const userId = alert.uid || alert.user;
      const liveLoc = liveLocations[userId];
      const lat = liveLoc?.latitude !== undefined ? liveLoc.latitude : alert.latitude;
      const lng = liveLoc?.longitude !== undefined ? liveLoc.longitude : alert.longitude;
      return {
        ...alert,
        latitude: lat,
        longitude: lng
      };
    });
  }, [activeAlerts, liveLocations]);

  // Apply deterministic jitter (offset) for identical coordinates to prevent overlays
  const processedAlerts = React.useMemo(() => {
    const groups = {};
    alertsWithPositions.forEach((alert) => {
      if (typeof alert.latitude !== 'number' || typeof alert.longitude !== 'number') return;
      const key = `${alert.latitude.toFixed(5)}_${alert.longitude.toFixed(5)}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(alert);
    });

    const result = [];
    Object.values(groups).forEach((group) => {
      const count = group.length;
      group.forEach((alert, index) => {
        if (count <= 1) {
          result.push({ ...alert, displayLat: alert.latitude, displayLng: alert.longitude, hasLive: !!liveLocations[alert.uid || alert.user] });
        } else {
          const angle = (index * 2 * Math.PI) / count;
          const distance = 0.00015; // ~15 meters
          const displayLat = alert.latitude + Math.sin(angle) * distance;
          const displayLng = alert.longitude + Math.cos(angle) * distance;
          result.push({ ...alert, displayLat, displayLng, hasLive: !!liveLocations[alert.uid || alert.user] });
        }
      });
    });
    return result;
  }, [alertsWithPositions, liveLocations]);

  // Center logic: center on centerAlertId if provided, otherwise latest active alert, otherwise Bangalore
  const mapCenter = React.useMemo(() => {
    if (centerAlertId) {
      const target = processedAlerts.find(a => (a.incidentId || a.id) === centerAlertId);
      if (target) return [target.latitude, target.longitude];
    }
    if (processedAlerts.length > 0) {
      const latest = processedAlerts[0];
      return [latest.latitude, latest.longitude];
    }
    return [12.9585, 77.5530];
  }, [processedAlerts, centerAlertId]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-display font-extrabold text-2xl tracking-wide uppercase text-brand-text flex items-center gap-2">
            <Compass size={24} className="text-blue-500 animate-spin" style={{ animationDuration: "10s" }} />
            GIS Map Monitor
          </h2>
          <p className="text-xs text-gray-400">
            Visual tracking of citizen distress calls, police cruisers, and IoT streetlights.
          </p>
        </div>
        
        {processedAlerts.length > 0 && (
          <div className="flex items-center gap-2.5 px-3.5 py-1.5 bg-red-950/40 text-brand-danger border border-red-500/30 rounded-lg animate-pulse">
            <Radio size={14} className="animate-ping" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {processedAlerts.length} SOS Intercepts Locked
            </span>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 bg-brand-card border border-brand-border rounded-xl shadow-lg overflow-hidden h-[500px] relative z-10">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : null}

        <MapContainer
          center={mapCenter}
          zoom={14}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* CartoDB TileLayer dynamically adapted to current theme */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={resolvedTheme === "light" 
              ? "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            }
          />

          <ChangeMapView center={mapCenter} />

          {/* 1. Render Active SOS Citizen Markers */}
          {processedAlerts.map((alert) => (
            <Marker 
              key={alert.incidentId || alert.id || alert.alertId}
              position={[alert.displayLat, alert.displayLng]} 
              icon={icons.sos}
            >
              <Popup>
                <div className="space-y-1.5 p-1 text-xs">
                  <div className="flex items-center gap-1.5 text-brand-danger font-bold uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    Distress SOS Active {alert.hasLive ? "• Tracking Live" : ""}
                  </div>
                  <div className="border-t border-slate-700 my-1 pt-1 space-y-1 font-mono">
                    <p><strong>Incident ID:</strong> {alert.incidentId || alert.id || alert.alertId}</p>
                    <p><strong>User ID:</strong> {alert.uid || alert.user || "N/A"}</p>
                    <p><strong>Citizen:</strong> {alert.userName}</p>
                    <p><strong>Contact:</strong> {alert.phone}</p>
                    <p><strong>Coordinates:</strong> {alert.latitude.toFixed(5)}, {alert.longitude.toFixed(5)}</p>
                    <p><strong>Time:</strong> {new Date(alert.timestamp).toLocaleTimeString()}</p>
                    <p><strong>Status:</strong> {alert.status}</p>
                    <p><strong>Emergency Type:</strong> {alert.emergencyType || "Emergency"}</p>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* 2. Render Police Station Precinct HQ Markers */}
          {policeStations.map((station, i) => {
            if (typeof station.lat !== 'number' || typeof station.lng !== 'number') return null;
            return (
              <Marker
                key={`station-${i}`}
                position={[station.lat, station.lng]}
                icon={icons.police}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-blue-400 font-bold block">{station.name}</strong>
                    <span className="text-gray-400 block">{station.details}</span>
                    <span className="text-[9px] font-mono text-green-400">DISPATCH READY</span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 3. Render Simulated Patrol Units */}
          {policeUnits.map((unit) => {
            if (typeof unit.lat !== 'number' || typeof unit.lng !== 'number') return null;
            return (
              <Marker
                key={unit.id}
                position={[unit.lat, unit.lng]}
                icon={icons.police}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1">
                    <strong className="text-blue-400 font-bold block">{unit.name}</strong>
                    <p className="text-gray-300"><strong>Officer:</strong> {unit.officer}</p>
                    <span className="text-[9px] font-mono bg-blue-950 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20 uppercase tracking-widest font-bold">
                      PATROL PATROLING
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* 4. Render IoT Streetlights */}
          {Object.keys(streetlights).map((key) => {
            const pole = streetlights[key];
            if (!pole || typeof pole.latitude !== 'number' || typeof pole.longitude !== 'number') return null;
            let poleIcon = icons.lightOnline;
            if (pole.state === "MAINTENANCE") poleIcon = icons.lightMaint;
            if (pole.status === "OFFLINE" || pole.state === "OFFLINE") poleIcon = icons.lightOffline;

            return (
              <Marker
                key={pole.id}
                position={[pole.latitude, pole.longitude]}
                icon={poleIcon}
              >
                <Popup>
                  <div className="p-1 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <strong className="text-brand-warning font-bold">{pole.id}</strong>
                      <span className={`text-[8px] font-mono font-bold px-1.5 rounded uppercase ${
                        pole.status === "ONLINE" ? "bg-emerald-950 text-brand-success" : "bg-red-950 text-brand-danger"
                      }`}>
                        {pole.status}
                      </span>
                    </div>
                    <div className="border-t border-slate-700 pt-1 space-y-0.5 font-mono">
                      <p><strong>Battery:</strong> {pole.battery}%</p>
                      <p><strong>State:</strong> {pole.state}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div className="bg-brand-card border border-brand-border p-4 rounded-xl flex flex-wrap gap-6 text-xs text-gray-300">
        <span className="font-bold text-gray-400 uppercase tracking-wider border-r border-brand-border pr-6">GIS Legend</span>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-red-600 animate-pulse border border-red-400" />
          <span>Active SOS User</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 bg-blue-600 rounded flex items-center justify-center text-[10px] text-white font-bold">P</span>
          <span>Police Station / Patrol Car</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-emerald-400" />
          <span>Streetlight (Online)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-600 border border-amber-400" />
          <span>Streetlight (Maintenance)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-slate-600 border border-slate-500" />
          <span>Streetlight (Offline)</span>
        </div>
      </div>
    </div>
  );
};

export default MapMonitoring;
