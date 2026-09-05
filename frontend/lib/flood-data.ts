// Simulated data layer for the Hillside Flash Flood Disaster Management app.
// All data is generated in-app to demonstrate a fully functional frontend.

export type Severity = "safe" | "watch" | "warning" | "danger"

export const SEVERITY_META: Record<
  Severity,
  { label: string; description: string; order: number }
> = {
  safe: { label: "Safe", description: "Normal conditions", order: 0 },
  watch: { label: "Watch", description: "Stay alert", order: 1 },
  warning: { label: "Warning", description: "Prepare to move", order: 2 },
  danger: { label: "Danger", description: "Evacuate now", order: 3 },
}

// The valley our fictional hillside town sits in.
export const TOWN = {
  name: "Rasdale Valley",
  center: [30.7, 78.45] as [number, number],
  zoom: 13,
}

export type Sensor = {
  id: string
  name: string
  type: "river" | "rain" | "slope"
  position: [number, number]
  // 0-100 normalized reading
  level: number
  severity: Severity
  unit: string
  reading: string
  updatedMinsAgo: number
}

export type Hotspot = {
  id: string
  name: string
  position: [number, number]
  severity: Severity
  note: string
}

export type Shelter = {
  id: string
  name: string
  position: [number, number]
  capacity: number
  occupied: number
  distanceKm: number
  address: string
  amenities: string[]
  status: "open" | "full" | "standby"
}

export type EvacRoute = {
  id: string
  name: string
  path: [number, number][]
  status: "clear" | "congested" | "blocked"
  toShelterId: string
}

export type Alert = {
  id: string
  severity: Severity
  title: string
  body: string
  area: string
  issuedMinsAgo: number
}

export type IncidentReport = {
  id: string
  type: string
  description: string
  location: string
  severity: Severity
  reportedMinsAgo: number
  status: "new" | "verified"
}

export const SENSORS: Sensor[] = [
  {
    id: "s1",
    name: "Rasdale Bridge Gauge",
    type: "river",
    position: [30.708, 78.452],
    level: 78,
    severity: "warning",
    unit: "m",
    reading: "3.9 m",
    updatedMinsAgo: 2,
  },
  {
    id: "s2",
    name: "Upper Ridge Rain Station",
    type: "rain",
    position: [30.715, 78.44],
    level: 88,
    severity: "danger",
    unit: "mm/h",
    reading: "62 mm/h",
    updatedMinsAgo: 1,
  },
  {
    id: "s3",
    name: "Millbrook Slope Sensor",
    type: "slope",
    position: [30.695, 78.462],
    level: 54,
    severity: "watch",
    unit: "%",
    reading: "12° tilt",
    updatedMinsAgo: 4,
  },
  {
    id: "s4",
    name: "Lower Creek Gauge",
    type: "river",
    position: [30.69, 78.44],
    level: 41,
    severity: "watch",
    unit: "m",
    reading: "2.1 m",
    updatedMinsAgo: 3,
  },
  {
    id: "s5",
    name: "East Valley Rain Station",
    type: "rain",
    position: [30.702, 78.472],
    level: 22,
    severity: "safe",
    unit: "mm/h",
    reading: "8 mm/h",
    updatedMinsAgo: 5,
  },
]

export const HOTSPOTS: Hotspot[] = [
  {
    id: "h1",
    name: "Rasdale Bridge Underpass",
    position: [30.706, 78.451],
    severity: "danger",
    note: "Rapid water rise, avoid completely",
  },
  {
    id: "h2",
    name: "Millbrook Road Bend",
    position: [30.697, 78.46],
    severity: "warning",
    note: "Debris flow risk on slope",
  },
  {
    id: "h3",
    name: "Old Market Square",
    position: [30.701, 78.455],
    severity: "watch",
    note: "Surface water pooling",
  },
]

export const SHELTERS: Shelter[] = [
  {
    id: "sh1",
    name: "Rasdale Community Hall",
    position: [30.712, 78.458],
    capacity: 320,
    occupied: 145,
    distanceKm: 0.8,
    address: "14 Hilltop Rd",
    amenities: ["Medical", "Food", "Pet-friendly"],
    status: "open",
  },
  {
    id: "sh2",
    name: "St. Mary's School Gym",
    position: [30.699, 78.468],
    capacity: 200,
    occupied: 188,
    distanceKm: 1.6,
    address: "3 Church Ln",
    amenities: ["Food", "Power"],
    status: "open",
  },
  {
    id: "sh3",
    name: "Valley Sports Centre",
    position: [30.688, 78.45],
    capacity: 500,
    occupied: 500,
    distanceKm: 2.9,
    address: "88 Riverside Ave",
    amenities: ["Medical", "Food", "Power", "Showers"],
    status: "full",
  },
]

export const EVAC_ROUTES: EvacRoute[] = [
  {
    id: "r1",
    name: "North Ridge Route",
    status: "clear",
    toShelterId: "sh1",
    path: [
      [30.701, 78.455],
      [30.705, 78.457],
      [30.712, 78.458],
    ],
  },
  {
    id: "r2",
    name: "East Church Route",
    status: "congested",
    toShelterId: "sh2",
    path: [
      [30.701, 78.455],
      [30.7, 78.462],
      [30.699, 78.468],
    ],
  },
  {
    id: "r3",
    name: "Riverside Route",
    status: "blocked",
    toShelterId: "sh3",
    path: [
      [30.701, 78.455],
      [30.695, 78.451],
      [30.688, 78.45],
    ],
  },
]

export const ALERTS: Alert[] = [
  {
    id: "a1",
    severity: "danger",
    title: "HQ DISPATCH - Rasdale Bridge Breach",
    body: "Immediate extraction required at Rasdale Bridge. Water levels critical. Deployment of swift-water rescue teams authorized.",
    area: "Rasdale Bridge & Riverside",
    issuedMinsAgo: 6,
  },
  {
    id: "a2",
    severity: "warning",
    title: "TACTICAL ADVISORY - Millbrook Slope",
    body: "Ground saturation reaching critical threshold (87%). Standby heavy clearance machinery for potential landslide response.",
    area: "Millbrook",
    issuedMinsAgo: 18,
  },
  {
    id: "a3",
    severity: "watch",
    title: "MET DATA - Valley Precipitation Spike",
    body: "Radar indicates sustained 40mm/hr rainfall for next 3 hours. Adjust response protocols to Level 2.",
    area: "Valley-wide",
    issuedMinsAgo: 42,
  },
]

export const INITIAL_REPORTS: IncidentReport[] = [
  {
    id: "ir1",
    type: "Road flooding",
    description: "Water over the road near the old mill, about knee deep.",
    location: "Millbrook Rd",
    severity: "warning",
    reportedMinsAgo: 9,
    status: "verified",
  },
  {
    id: "ir2",
    type: "Fallen tree",
    description: "Large tree blocking one lane after the bend.",
    location: "Church Ln",
    severity: "watch",
    reportedMinsAgo: 25,
    status: "new",
  },
]

export const INCIDENT_TYPES = [
  "Road flooding",
  "Rising water level",
  "Landslide / debris",
  "Fallen tree",
  "Blocked drain",
  "Trapped / needs rescue",
  "Other",
]

export function overallSeverity(sensors: Sensor[]): Severity {
  return sensors.reduce<Severity>((max, s) => {
    return SEVERITY_META[s.severity].order > SEVERITY_META[max].order
      ? s.severity
      : max
  }, "safe")
}

export function timeAgo(mins: number): string {
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const h = Math.floor(mins / 60)
  return `${h} hr ago`
}
