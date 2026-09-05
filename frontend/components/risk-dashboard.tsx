"use client"

import { Droplets, Mountain, CloudRain, Waves } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  SEVERITY_META,
  overallSeverity,
  type Sensor,
  type Severity,
} from "@/lib/flood-data"
import {
  SeverityBadge,
  severityColor,
  severityText,
} from "@/components/severity-badge"
import { cn } from "@/lib/utils"

const typeIcon = {
  river: Waves,
  rain: CloudRain,
  slope: Mountain,
}

function RiskGauge({ level, severity }: { level: number; severity: Severity }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (level / 100) * circ
  return (
    <div className="relative flex size-36 items-center justify-center rounded-full bg-black/40 border border-white/5 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
      {/* Background ambient glow */}
      <div 
        className="absolute inset-0 rounded-full blur-[20px] opacity-20 transition-all duration-1000"
        style={{ background: severityColor[severity] }}
      />
      <svg viewBox="0 0 120 120" className="size-full -rotate-90 relative z-10">
        <circle
          cx="60"
          cy="60"
          r={r}
          className="fill-none stroke-white/5 stroke-[4]"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          className="fill-none stroke-[4] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
          stroke={severityColor[severity]}
          strokeDasharray={circ}
          strokeDashoffset={circ - dash}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${severityColor[severity]})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center z-10">
        <span className="text-4xl font-semibold tracking-tight text-white">
          {Math.round(level)}
        </span>
        <span className="text-[10px] text-white/50 linear-label mt-1">
          INDEX
        </span>
      </div>
    </div>
  )
}

export function RiskDashboard({ sensors }: { sensors: Sensor[] }) {
  const overall = overallSeverity(sensors)
  const avg =
    sensors.reduce((sum, s) => sum + s.level, 0) / Math.max(1, sensors.length)

  return (
    <section className="space-y-6" aria-label="Live risk overview">
      <div className="linear-card relative p-0 overflow-hidden">
        {/* Subtle accent glow at top */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-[#5E6AD2]/50 to-transparent" />
        
        <div className="flex flex-col items-center gap-6 p-8 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <div className="flex items-center gap-6">
            <RiskGauge level={avg} severity={overall} />
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <p className="linear-label linear-text-muted">
                  CURRENT STATUS
                </p>
              </div>
              <SeverityBadge severity={overall} className="text-sm bg-white/5 border border-white/10" showDot={true} />
              <p className="max-w-56 text-sm linear-text-muted leading-relaxed mt-2 font-normal">
                {SEVERITY_META[overall].description}. Evaluated from {sensors.length} telemetry points.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {sensors.map((s) => {
          const Icon = typeIcon[s.type]
          return (
            <div key={s.id} className="linear-card p-5 group cursor-default">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                <div className="flex size-8 items-center justify-center rounded-xl bg-white/5 border border-white/5">
                  <Icon className="size-4 linear-text-muted group-hover:text-white transition-colors" />
                </div>
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight text-white mb-1">{s.reading}</p>
                <p className="linear-label linear-text-muted text-[10px]">
                  {s.name}
                </p>
              </div>
              <div className="h-[2px] w-full bg-white/5 mt-5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-700"
                  style={{
                    width: `${s.level}%`,
                    background: severityColor[s.severity],
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
