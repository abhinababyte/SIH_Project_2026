"use client"

import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { useEffect, useState } from "react"
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMapEvents,
} from "react-leaflet"
import {
  EVAC_ROUTES,
  HOTSPOTS,
  SHELTERS,
  TOWN,
  type Sensor,
} from "@/lib/flood-data"
import { severityColor } from "@/components/severity-badge"

const routeColor: Record<string, string> = {
  clear: severityColor.safe,
  congested: severityColor.watch,
  blocked: severityColor.danger,
}

function shelterIcon(status: string) {
  const bg =
    status === "full"
      ? severityColor.danger
      : status === "standby"
        ? severityColor.watch
        : severityColor.safe
  return L.divIcon({
    className: "custom-shelter-icon",
    html: `<div style="background-color: ${bg}; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 10px; height: 10px;"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

const userLocationIcon = L.divIcon({
  className: "custom-user-icon",
  html: `<div class="relative flex items-center justify-center" style="width: 16px; height: 16px;">
           <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
           <span class="relative inline-flex rounded-full size-2.5 bg-blue-500" style="box-shadow: 0 0 15px rgba(59,130,246,0.9);"></span>
         </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Map events to simulate clicking on map to close things etc. if needed
function MapEffect() {
  useMapEvents({
    click() {
      // Could trigger an onClick event if needed for empty areas
    },
  })
  return null
}

export default function FloodMap({ sensors, onSensorClick, showUserLocation = false }: { sensors: Sensor[], onSensorClick?: (sensor: Sensor) => void, showUserLocation?: boolean }) {
  const [realUserLoc, setRealUserLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (showUserLocation && typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setRealUserLoc([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.warn("Geolocation error:", err);
          setRealUserLoc([TOWN.center[0] - 0.005, TOWN.center[1] + 0.005]);
        },
        { enableHighAccuracy: true }
      );
    } else if (showUserLocation) {
      setRealUserLoc([TOWN.center[0] - 0.005, TOWN.center[1] + 0.005]);
    }
  }, [showUserLocation]);

  return (
    <MapContainer
      center={TOWN.center}
      zoom={14}
      minZoom={5}
      zoomControl={true}
      className="h-full w-full bg-[#030712] z-0 [&_.leaflet-container]:bg-slate-950 font-sans"
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution=""
        className="map-tiles"
      />

      <MapEffect />

      {/* Evacuation Routes */}
      {EVAC_ROUTES.map((route, i) => (
        <Polyline
          key={"route-" + i}
          positions={route.path}
          pathOptions={{
            color: routeColor[route.status],
            weight: route.status === "clear" ? 4 : 3,
            opacity: 0.8,
            dashArray: route.status === "clear" ? undefined : "10 10",
          }}
        >
          <Tooltip sticky className="custom-tooltip font-mono">
            Evacuation Route ({route.status.toUpperCase()})
          </Tooltip>
        </Polyline>
      ))}

      {/* Shelters */}
      {SHELTERS.map((sh) => (
        <Marker key={sh.id} position={sh.position} icon={shelterIcon(sh.status)}>
          <Tooltip direction="top" offset={[0, -6]}>
            <strong>{sh.name}</strong> - {sh.status.toUpperCase()}
          </Tooltip>
        </Marker>
      ))}

      {/* Danger hotspots */}
      {HOTSPOTS.map((h) => (
        <CircleMarker
          key={h.id}
          center={h.position}
          radius={12}
          eventHandlers={{
            click: () => onSensorClick?.({
              id: h.id,
              name: h.name,
              position: h.position,
              type: "rain", // mock type for hotspot
              level: h.severity === "danger" ? 95 : h.severity === "warning" ? 65 : 20,
              severity: h.severity,
              trend: "up",
            })
          }}
          pathOptions={{
            color: severityColor[h.severity],
            fillColor: severityColor[h.severity],
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {h.name} (HOTSPOT)
          </Tooltip>
        </CircleMarker>
      ))}

      {/* Live sensors */}
      {sensors.map((s) => (
        <CircleMarker
          key={s.id}
          center={s.position}
          radius={8}
          eventHandlers={{
            click: () => onSensorClick?.(s)
          }}
          pathOptions={{
            color: "white",
            fillColor: severityColor[s.severity],
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -6]}>
            {s.name}: {s.reading}
          </Tooltip>
        </CircleMarker>
      ))}

      {showUserLocation && realUserLoc && (
        <Marker position={realUserLoc} icon={userLocationIcon}>
          <Tooltip permanent direction="bottom" offset={[0, 8]} className="bg-blue-600/90 text-white font-bold text-[10px] border-white/10 shadow-xl px-2 py-1 rounded-full backdrop-blur-md">
            You are here
          </Tooltip>
        </Marker>
      )}
    </MapContainer>
  )
}
