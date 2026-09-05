import React from "react"
import { useSimulation } from "@/components/simulation-provider"
import { Droplets, Mountain, CloudRain, Waves, AlertTriangle, ShieldAlert } from "lucide-react"

export function WhatIfSimulator() {
  const { rain, setRain, soil, setSoil, river, setRiver, isLiveOsiris } = useSimulation()

  // Calculate composite risk score
  const riskScore = Math.min(100, Math.round(( (rain / 200) * 40 ) + ( (soil / 100) * 20 ) + ( (river / 5) * 40 )))
  
  let riskColor = "text-emerald-400"
  let riskBg = "bg-emerald-500/10 border-emerald-500/20"
  let riskLabel = "LOW RISK"
  
  if (riskScore > 40) { 
    riskColor = "text-amber-400"
    riskBg = "bg-amber-500/10 border-amber-500/20"
    riskLabel = "ELEVATED RISK" 
  }
  if (riskScore > 75) { 
    riskColor = "text-rose-500 animate-pulse"
    riskBg = "bg-rose-500/10 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
    riskLabel = "CRITICAL FLOOD DANGER" 
  }

  return (
    <div className="flex flex-col h-full bg-[#0a0f18] text-white">
      <div className="p-6 border-b border-white/5">
        <h2 className="text-sm font-mono tracking-[0.2em] text-slate-400 uppercase">What-If Simulator</h2>
        <p className="text-xs text-slate-500 mt-2">Adjust variables manually to simulate flood conditions.</p>
      </div>

      <div className="p-6 flex-1 overflow-y-auto space-y-8 relative">
        {isLiveOsiris && (
          <div className="absolute inset-0 z-10 bg-[#0a0f18]/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="size-12 text-rose-500 mb-4 animate-pulse" />
            <h3 className="text-lg font-bold text-rose-400 font-mono tracking-widest mb-2">OSIRIS LIVE ACTIVE</h3>
            <p className="text-sm text-slate-300">The What-If Simulator is disabled while the system is locked to live satellite telemetry.</p>
            <p className="text-xs text-slate-500 mt-4 font-mono">Turn off OSIRIS in the top header to enable manual simulations.</p>
          </div>
        )}

        {/* RISK SCORE DISPLAY */}
        <div className={`rounded-2xl border p-4 flex items-center justify-between transition-all duration-500 ${riskBg}`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-1">Disaster Probability</span>
            <span className={`text-sm font-bold tracking-widest ${riskColor}`}>{riskLabel}</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-4xl font-black ${riskColor}`}>{riskScore}</span>
            <span className={`text-sm font-mono ${riskColor} opacity-70`}>%</span>
          </div>
        </div>

        {/* Rainfall */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain className="size-4 text-[#5E6AD2]" />
              <label className="text-sm font-medium">Rainfall (24h)</label>
            </div>
            <span className="text-xs font-mono text-slate-400">{Math.round(rain)} mm</span>
          </div>
          <input 
            type="range" 
            value={rain} 
            min={0} 
            max={200} 
            step={1} 
            onChange={(e) => setRain(Number(e.target.value))} 
            disabled={isLiveOsiris} 
            className="w-full accent-[#5E6AD2]" 
          />
        </div>

        {/* Soil Moisture */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mountain className="size-4 text-emerald-500" />
              <label className="text-sm font-medium">Soil Moisture</label>
            </div>
            <span className="text-xs font-mono text-slate-400">{Math.round(soil)}%</span>
          </div>
          <input 
            type="range" 
            value={soil} 
            min={0} 
            max={100} 
            step={1} 
            onChange={(e) => setSoil(Number(e.target.value))} 
            disabled={isLiveOsiris} 
            className="w-full accent-emerald-500" 
          />
        </div>

        {/* River Level */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Waves className="size-4 text-cyan-500" />
              <label className="text-sm font-medium">River Gauge Level</label>
            </div>
            <span className="text-xs font-mono text-slate-400">{river.toFixed(1)} m</span>
          </div>
          <input 
            type="range" 
            value={river} 
            min={0} 
            max={5} 
            step={0.1} 
            onChange={(e) => setRiver(Number(e.target.value))} 
            disabled={isLiveOsiris} 
            className="w-full accent-cyan-500" 
          />
        </div>
        
      </div>
    </div>
  )
}
