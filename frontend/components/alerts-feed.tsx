"use client"

import React, { useState, useEffect, useMemo } from "react"
import { AlertTriangle, Bell, MapPin, Globe } from "lucide-react"
import { ALERTS, timeAgo } from "@/lib/flood-data"
import {
  SeverityBadge,
  severityText,
} from "@/components/severity-badge"
import { cn } from "@/lib/utils"

export function AlertsFeed({ userType = "responder" }: { userType?: "resident" | "responder" }) {
  const [language, setLanguage] = useState<"en" | "hi" | "bn">("en");
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  const sorted = useMemo(() => [...ALERTS].sort((a, b) => a.issuedMinsAgo - b.issuedMinsAgo), [])

  // Custom mock alerts for the resident view
  const residentAlerts = useMemo(() => [
    {
      id: "r1",
      title: "New Safe Shelter Opened",
      body: "Govt. School (North Wing) is now open and accepting evacuees. Capacity currently at 30%.",
      area: "North Sector",
      issuedMinsAgo: 5,
      severity: "safe",
    },
    {
      id: "r2",
      title: "Route Blocked: River Road",
      body: "Community verified: Bridge washout at River Road. DO NOT use this route.",
      area: "River Road",
      issuedMinsAgo: 12,
      severity: "warning",
    },
    {
      id: "r3",
      title: "Flash Flood Warning Upgraded",
      body: "Water levels rising rapidly in the Lower Basin. Prepare for immediate evacuation.",
      area: "Lower Basin",
      issuedMinsAgo: 24,
      severity: "danger",
    }
  ], []);

  const activeAlerts = useMemo(() => userType === "resident" ? residentAlerts : sorted, [userType, residentAlerts, sorted]);

  // Bhashini API Translation fetch
  useEffect(() => {
    if (language === "en") return;
    
    setIsTranslating(true);
    
    // We fetch translations for all visible titles and bodies
    const textsToTranslate = activeAlerts.flatMap(a => [a.title, a.body, a.area, "Community Alerts"]);
    
    Promise.all(textsToTranslate.map(text => 
      fetch("http://127.0.0.1:8000/api/bhashini/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, target_language: language })
      })
      .then(r => r.json())
      .catch(e => ({ original_text: text, translated_text: text }))
    )).then(results => {
      const newTranslations: Record<string, string> = {};
      results.forEach(res => {
        if (res.original_text) {
          newTranslations[res.original_text] = res.translated_text;
        }
      });
      setTranslations(newTranslations);
      setIsTranslating(false);
    });
  }, [language, activeAlerts]);

  const t = (text: string) => {
    if (language === "en") return text;
    return translations[text] || text;
  };

  return (
    <section className="space-y-4 h-full min-h-0 flex flex-col" aria-label="Active alerts">
      <div className="flex items-center justify-between mb-2 shrink-0 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[#5E6AD2]" />
          <h2 className="linear-label linear-text-muted">{t("Community Alerts")}</h2>
          <span className="rounded-full bg-[#5E6AD2]/10 px-2 py-0.5 text-xs font-mono text-[#5E6AD2] border border-[#5E6AD2]/20 shadow-[0_0_10px_rgba(94,106,210,0.2)]">
            {activeAlerts.length}
          </span>
        </div>
        
        {/* Bhashini Translation Dropdown */}
        {userType === "resident" && (
          <div className="flex items-center gap-2">
            <Globe className={cn("size-3", isTranslating ? "text-amber-500 animate-spin" : "text-slate-400")} />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-black/40 border border-white/10 rounded-md text-[10px] text-slate-300 font-mono tracking-widest px-2 py-1 outline-none"
            >
              <option value="en">ENGLISH</option>
              <option value="hi">HINDI (Bhashini)</option>
              <option value="bn">BENGALI (Bhashini)</option>
            </select>
          </div>
        )}
      </div>

      <div className="space-y-6 overflow-y-auto pr-2 no-scrollbar flex-1 relative">
        {isTranslating && (
          <div className="absolute inset-0 z-10 bg-[#0E1626]/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl">
             <div className="bg-black/80 text-white font-mono text-[10px] uppercase tracking-widest px-4 py-2 rounded-full border border-white/10 shadow-xl flex items-center gap-2">
               <span className="size-2 rounded-full bg-amber-500 animate-ping" />
               Translating via Bhashini API...
             </div>
          </div>
        )}
        
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
                   <h3 className="text-sm font-semibold tracking-tight text-[#EDEDEF] leading-snug group-hover:text-white transition-colors">{t(a.title)}</h3>
                   <p className="text-xs text-[#8A8F98] mt-1.5 leading-relaxed font-normal">{t(a.body)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
              <div className="flex items-center gap-3 text-[10px] linear-label linear-text-muted min-w-0">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="size-3 shrink-0" />
                  <span className="truncate">{t(a.area)}</span>
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
