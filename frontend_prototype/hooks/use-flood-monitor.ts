"use client"

import { useEffect, useState } from "react"
import {
  SENSORS,
  type Sensor,
  type Severity,
} from "@/lib/flood-data"

function severityFromLevel(level: number): Severity {
  if (level >= 80) return "danger"
  if (level >= 60) return "warning"
  if (level >= 35) return "watch"
  return "safe"
}

function readingFromLevel(sensor: Sensor, level: number): string {
  switch (sensor.type) {
    case "river":
      return `${(0.5 + (level / 100) * 4.5).toFixed(1)} m`
    case "rain":
      return `${Math.round((level / 100) * 70)} mm/h`
    case "slope":
      return `${Math.round((level / 100) * 25)}° tilt`
  }
}

// Simulates a live monitoring feed by nudging sensor readings on an interval.
export function useFloodMonitor() {
  const [sensors, setSensors] = useState<Sensor[]>(SENSORS)
  const [lastUpdate, setLastUpdate] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => {
      setSensors((prev) =>
        prev.map((s) => {
          // Random walk within a plausible band, biased toward the seed level.
          const drift = (Math.random() - 0.48) * 6
          const pull = (s.level - 50) * -0.02
          const level = Math.max(5, Math.min(97, s.level + drift + pull))
          return {
            ...s,
            level,
            severity: severityFromLevel(level),
            reading: readingFromLevel(s, level),
            updatedMinsAgo: 0,
          }
        }),
      )
      setLastUpdate(Date.now())
    }, 3500)
    return () => clearInterval(id)
  }, [])

  return { sensors, lastUpdate }
}
