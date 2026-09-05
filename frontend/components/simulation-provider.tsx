"use client"

import React, { createContext, useContext, useState } from "react"
import { Severity } from "@/lib/flood-data"

type Mode = "disaster" | "peacetime"

interface SimulationContextType {
  mode: Mode
  setMode: (mode: Mode) => void
  rain: number
  setRain: (rain: number) => void
  soil: number
  setSoil: (soil: number) => void
  river: number
  setRiver: (river: number) => void
  severity: Severity
  simulatedSensors: any[]
  isLiveOsiris: boolean
  toggleOsiris: () => void
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined)

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("disaster")
  const [rain, setRain] = useState(50)
  const [soil, setSoil] = useState(60)
  const [river, setRiver] = useState(2)
  const [isLiveOsiris, setIsLiveOsiris] = useState(false)

  const fetchOsirisTelemetry = async () => {
    try {
      const lat = 30.73;
      const lng = 78.44;
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation,soil_moisture_0_to_7cm`);
      const data = await res.json();
      
      if (data.current) {
        const liveSoilPct = Math.min(100, (data.current.soil_moisture_0_to_7cm || 0.2) * 200); 
        const liveRain = data.current.precipitation || 0;
        
        setRain(liveRain);
        setSoil(liveSoilPct);
      }
    } catch (e) {
      console.error("Osiris Telemetry Failed", e);
    }
  };

  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLiveOsiris) {
      fetchOsirisTelemetry();
      interval = setInterval(fetchOsirisTelemetry, 60000);
    }
    return () => clearInterval(interval);
  }, [isLiveOsiris]);

  const toggleOsiris = () => setIsLiveOsiris(!isLiveOsiris);

  const calculatedRisk = (rain * 0.4) + (soil * 0.4) + ((river / 5) * 20)
  
  let severity: Severity = "safe"
  if (calculatedRisk > 75) severity = "danger"
  else if (calculatedRisk > 50) severity = "warning"
  else if (calculatedRisk > 25) severity = "watch"

  const simulatedSensors = [
    { id: "s1", type: "rain", name: "Rainfall (24h)", reading: `${rain} mm`, level: (rain / 200) * 100, severity, trend: "up", position: [30.708, 78.452] },
    { id: "s2", type: "slope", name: "Soil Moisture", reading: `${Math.round(soil)}%`, level: soil, severity, trend: "flat", position: [30.715, 78.44] },
    { id: "s3", type: "river", name: "River Level", reading: `${river.toFixed(1)} m`, level: (river / 5) * 100, severity, trend: "up", position: [30.695, 78.462] }
  ]

  return (
    <SimulationContext.Provider
      value={{
        mode, setMode, rain, setRain, soil, setSoil, river, setRiver, severity, simulatedSensors, isLiveOsiris, toggleOsiris
      }}
    >
      {children}
    </SimulationContext.Provider>
  )
}

export function useSimulation() {
  const context = useContext(SimulationContext)
  if (context === undefined) {
    throw new Error("useSimulation must be used within a SimulationProvider")
  }
  return context
}
