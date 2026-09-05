"use client"
import React, { useState } from "react"
import { Loader2, BrainCircuit } from "lucide-react"
import { Droplets, Thermometer, Waves, ShieldAlert, Activity, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import { type Sensor } from "@/lib/flood-data"

interface RiskDetailsProps {
  rain: number
  soil: number
  river: number
  severity: "normal" | "warning" | "danger"
  selectedSensor?: Sensor | null
}

export function RiskDetails({ rain, soil, river, severity, selectedSensor }: RiskDetailsProps) {
  const [xaiData, setXaiData] = useState<any>(null);
  const [isLoadingXai, setIsLoadingXai] = useState(false);

  // Clear XAI data when switching between sensors or global view
  React.useEffect(() => {
    setXaiData(null);
  }, [selectedSensor?.id, rain, soil, river]);

  const fetchXaiExplanation = async () => {
    setIsLoadingXai(true);
    try {
      const response = await fetch("http://localhost:8000/api/predict/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sensor_id: selectedSensor ? selectedSensor.id : "global-sensor",
          rain_1h_mm: selectedSensor?.type === "rain" ? selectedSensor.level : rain,
          soil_moisture_pct: selectedSensor?.type === "slope" ? selectedSensor.level : soil,
          river_water_level_m: selectedSensor?.type === "river" ? selectedSensor.level : river
        })
      });
      const data = await response.json();
      setXaiData(data);
    } catch (e) {
      console.error("XAI fetch failed", e);
    }
    setIsLoadingXai(false);
  };
  const effectiveSeverity = selectedSensor ? selectedSensor.severity : severity;
  
  // Calculate dynamic risk score based on the specific sensor or overall
  let riskScore = 24;
  if (effectiveSeverity === "danger") {
    riskScore = selectedSensor ? Math.min(99, 90 + (selectedSensor.level * 2)) : 92;
  } else if (effectiveSeverity === "warning") {
    riskScore = selectedSensor ? Math.min(89, 60 + (selectedSensor.level * 2)) : 65;
  } else {
    riskScore = selectedSensor ? Math.max(10, 20 + selectedSensor.level) : 24;
  }

  // Ensure riskScore is an integer
  riskScore = Math.floor(riskScore);
  
  return (
    <div className="flex flex-col gap-6" aria-label="Risk Details">
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <ShieldAlert className={cn(
          "size-5", 
          effectiveSeverity === "danger" ? "text-rose-500" :
          effectiveSeverity === "warning" ? "text-amber-500" : "text-emerald-500"
        )} />
        <h2 className="text-sm font-semibold tracking-wider uppercase text-white">
          {selectedSensor ? "Local Area Intelligence" : "Overall Risk Intelligence"}
        </h2>
      </div>

      <div className={cn(
        "flex items-center justify-between p-4 rounded-xl border relative overflow-hidden",
        effectiveSeverity === "danger" ? "bg-rose-500/10 border-rose-500/30" :
        effectiveSeverity === "warning" ? "bg-amber-500/10 border-amber-500/30" :
        "bg-emerald-500/10 border-emerald-500/30"
      )}>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/20 to-transparent" />
        
        <div className="flex flex-col gap-1 z-10">
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            {selectedSensor ? "Local Risk Score (10m Radius)" : "Aggregate Risk Score"}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-4xl font-bold tracking-tighter",
              effectiveSeverity === "danger" ? "text-rose-400" :
              effectiveSeverity === "warning" ? "text-amber-400" : "text-emerald-400"
            )}>
              {riskScore}
            </span>
            <span className="text-sm font-medium text-slate-500">/ 100</span>
          </div>
        </div>

        <Activity className={cn(
          "size-12 opacity-20 z-10",
          effectiveSeverity === "danger" ? "text-rose-500" :
          effectiveSeverity === "warning" ? "text-amber-500" : "text-emerald-500"
        )} />
      </div>

      {selectedSensor ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              <MapPin className="size-4" />
              <span className="text-xs font-mono uppercase tracking-widest">Target Location</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-slate-200">
                {selectedSensor.position[0].toFixed(4)}, {selectedSensor.position[1].toFixed(4)}
              </span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-slate-400">
              {selectedSensor.type === "rain" ? <Droplets className="size-4" /> : 
               selectedSensor.type === "river" ? <Waves className="size-4" /> : 
               <Thermometer className="size-4" />}
              <span className="text-xs font-mono uppercase tracking-widest">{selectedSensor.type} Sensor</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-200">{selectedSensor.level.toFixed(1)}</span>
              <span className="text-xs font-medium text-slate-500">
                {selectedSensor.type === "rain" ? "mm/h" : selectedSensor.type === "river" ? "m" : "%"}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Rainfall</span>
              <Droplets className="size-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-slate-200">{rain.toFixed(1)}</span>
              <span className="text-[10px] font-medium text-slate-500">mm/h</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">Soil Sat.</span>
              <Thermometer className="size-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-slate-200">{soil.toFixed(0)}</span>
              <span className="text-[10px] font-medium text-slate-500">%</span>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-widest">River Stage</span>
              <Waves className="size-4" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-semibold text-slate-200">{river.toFixed(1)}</span>
              <span className="text-[10px] font-medium text-slate-500">m</span>
            </div>
          </div>
        </div>
      )}

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono uppercase tracking-widest text-slate-400">Impact Analysis</h3>
          <button 
            onClick={fetchXaiExplanation}
            disabled={isLoadingXai}
            className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-500/20 transition-colors"
          >
            {isLoadingXai ? <Loader2 className="size-3 animate-spin" /> : <BrainCircuit className="size-3" />}
            Explain with AI
          </button>
        </div>
        
        {xaiData ? (
          <div className="flex flex-col gap-3 mt-3 border-t border-white/10 pt-3">
            <p className="text-xs text-slate-400 italic mb-1">{xaiData.explanation}</p>
            
            {Object.entries(xaiData.feature_impacts).map(([feature, impact]: [string, any]) => (
              <div key={feature} className="flex flex-col gap-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300 font-medium">{feature.replace("_", " ")}</span>
                  <span className={impact > 0 ? "text-rose-400" : "text-emerald-400"}>
                    {impact > 0 ? "+" : ""}{impact.toFixed(3)}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex">
                  {impact > 0 ? (
                    <div className="h-full bg-rose-500/70" style={{ width: Math.min(Math.abs(impact) * 100, 100) + '%' }} />
                  ) : (
                    <div className="h-full bg-emerald-500/70 ml-auto" style={{ width: Math.min(Math.abs(impact) * 100, 100) + '%' }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-300 leading-relaxed">
            {effectiveSeverity === "danger" 
              ? "Critical thresholds exceeded. High probability of immediate infrastructure damage and life-threatening conditions in low-lying areas. Mandatory evacuation protocols should be active."
              : effectiveSeverity === "warning"
              ? "Elevated readings detected. Potential for localized flooding and minor structural impacts. Prepare swift-water rescue teams for deployment if conditions degrade."
              : "Metrics are within normal operating parameters. No immediate threat detected. Continue standard monitoring protocols."
            }
          </p>
        )}
      </div>
    </div>
  )
}



