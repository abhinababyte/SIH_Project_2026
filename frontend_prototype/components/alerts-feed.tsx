"use client"

import { AlertTriangle, Bell, MapPin } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ALERTS, timeAgo } from "@/lib/flood-data"
import {
  SeverityBadge,
  severityBorder,
  severityText,
} from "@/components/severity-badge"
import { cn } from "@/lib/utils"

export function AlertsFeed({ userType = "responder" }: { userType?: "resident" | "responder" }) {
  const sorted = [...ALERTS].sort((a, b) => a.issuedMinsAgo - b.issuedMinsAgo)

  // Custom mock alerts for the resident view
  const residentAlerts = [
    {
      id: "r1",
      title: "New Safe Shelter Opened",
      body: "Govt. School (North Wing) is now open and accepting evacuees. Capacity currently at 30%.",
      area: "North Sector",
      issuedMinsAgo: 5,
      severity: "safe", // changed from info
    },
    {
      id: "r2",
      title: "Route Blocked: River Road",
      body: "Community verified: Bridge washout at River Road. DO NOT use this route.",
      area: "River Road",
      issuedMinsAgo: 12,
      severity: "warning", // changed from high
    },
    {
      id: "r3",
      title: "Flash Flood Warning Upgraded",
      body: "Water levels rising rapidly in the Lower Basin. Prepare for immediate evacuation.",
      area: "Lower Basin",
      issuedMinsAgo: 24,
      severity: "danger", // changed from critical
    }
  ];

  const activeAlerts = userType === "resident" ? residentAlerts : sorted;

  return (
    <section className="space-y-4 h-full min-h-0 flex flex-col" aria-label="Active alerts">
      <div className="flex items-center gap-2 mb-2 shrink-0">
        <Bell className="size-4 text-[#5E6AD2]" />
        <h2 className="linear-label linear-text-muted">Community Alerts</h2>
        <span className="ml-auto rounded-full bg-[#5E6AD2]/10 px-2 py-0.5 text-xs font-mono text-[#5E6AD2] border border-[#5E6AD2]/20 shadow-[0_0_10px_rgba(94,106,210,0.2)]">
          {activeAlerts.length} active
        </span>
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 no-scrollbar flex-1">
        {activeAlerts.map((a: any) => (
          <div
            key={a.id}
            className="linear-card p-4 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-white/5 border border-white/10">
                   <AlertTriangle className={cn("size-3.5", severityText[a.severity])} />
                </div>
                <div>
                   <h3 className="text-sm font-semibold tracking-tight text-[#EDEDEF] leading-snug group-hover:text-white transition-colors">{a.title}</h3>
                   <p className="text-xs text-[#8A8F98] mt-1.5 leading-relaxed font-normal">{a.body}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 text-[10px] linear-label linear-text-muted min-w-0">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{a.area}</span>
                </span>
                <span aria-hidden className="shrink-0">•</span>
                <span className="shrink-0 whitespace-nowrap">{timeAgo(a.issuedMinsAgo)}</span>
              </div>
              <SeverityBadge severity={a.severity} showDot={true} className="scale-90 origin-right border border-white/5 bg-white/5 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
