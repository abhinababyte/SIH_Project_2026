"use client"

import React, { useState } from "react"
import { Shield, Sparkles, Activity, Tent, FileText, ChevronRight, Menu, Smartphone, Flag, Sliders } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  activePanel: "chat" | "shelters" | "incident" | "report" | "whatif" | null
  setActivePanel: (v: "chat" | "shelters" | "incident" | "report" | "whatif" | null) => void
  isExpanded: boolean
  setIsExpanded: (v: boolean) => void
}

export function AppSidebar({ activePanel, setActivePanel, isExpanded, setIsExpanded }: AppSidebarProps) {
  return (
    <div 
      className={cn(
        "absolute top-16 left-0 bottom-16 bg-[#0E1626]/90 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col pb-6 pointer-events-auto shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-all duration-300 ease-in-out overflow-y-auto no-scrollbar",
        isExpanded ? "w-[320px]" : "w-[72px] items-center"
      )}
    >
      <div className={cn("flex items-center mb-6 py-4 sticky top-0 bg-[#0E1626]/95 z-10 border-b border-white/5", isExpanded ? "px-6 justify-between" : "px-4 justify-center")}>
        {isExpanded && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Menu</span>
          </div>
        )}
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 shrink-0"
        >
          <Menu className="size-6" />
        </button>
      </div>

      <div className={cn("flex flex-col gap-3 w-full", isExpanded ? "px-4" : "items-center")}>
        <button 
          onClick={() => setActivePanel(activePanel === "chat" ? null : "chat")}
          className={cn(
            "group flex transition-colors w-full",
            isExpanded ? "flex-row items-center gap-4 rounded-xl hover:bg-white/5 p-2" : "flex-col items-center gap-1"
          )}
        >
          <div className={cn(
            "flex items-center justify-center size-12 shrink-0 rounded-[18px] transition-colors border shadow-[0_0_15px_rgba(59,130,246,0.15)] relative",
            activePanel === "chat" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 border-blue-500/20"
          )}>
            <Sparkles className="size-5" />
          </div>
          <span className={cn(
            "font-medium transition-colors text-left",
            isExpanded ? "text-sm text-slate-200 group-hover:text-white" : "text-[10px] text-slate-300 text-center leading-tight"
          )}>
            Ask Shield
          </span>
        </button>

        <button 
          onClick={() => setActivePanel(activePanel === "shelters" ? null : "shelters")}
          className={cn(
            "group flex transition-colors w-full",
            isExpanded ? "flex-row items-center gap-4 rounded-xl hover:bg-white/5 p-2" : "flex-col items-center gap-1"
          )}
        >
          <div className={cn(
            "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
            activePanel === "shelters" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
          )}>
            <Tent className="size-5" />
          </div>
          <span className={cn(
            "font-medium transition-colors text-left",
            isExpanded ? "text-sm text-slate-200 group-hover:text-white" : "text-[10px] text-slate-400 group-hover:text-slate-300"
          )}>
            Shelters
          </span>
        </button>

        <button 
          onClick={() => setActivePanel(activePanel === "incident" ? null : "incident")}
          className={cn(
            "group flex transition-colors w-full",
            isExpanded ? "flex-row items-center gap-4 rounded-xl hover:bg-white/5 p-2" : "flex-col items-center gap-1"
          )}
        >
          <div className={cn(
            "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
            activePanel === "incident" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
          )}>
            <Activity className="size-5" />
          </div>
          <span className={cn(
            "font-medium transition-colors text-left",
            isExpanded ? "text-sm text-slate-200 group-hover:text-white" : "text-[10px] text-slate-400 group-hover:text-slate-300"
          )}>
            Incident
          </span>
        </button>

        <button 
          onClick={() => setActivePanel(activePanel === "report" ? null : "report")}
          className={cn(
            "group flex transition-colors w-full",
            isExpanded ? "flex-row items-center gap-4 rounded-xl hover:bg-white/5 p-2" : "flex-col items-center gap-1"
          )}
        >
          <div className={cn(
            "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
            activePanel === "report" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
          )}>
            <Flag className="size-5" />
          </div>
          <span className={cn(
            "font-medium transition-colors text-left",
            isExpanded ? "text-sm text-slate-200 group-hover:text-white" : "text-[10px] text-slate-400 group-hover:text-slate-300"
          )}>
            Report
          </span>
        </button>

        <button 
          onClick={() => setActivePanel(activePanel === "whatif" ? null : "whatif")}
          className={cn(
            "group flex transition-colors w-full",
            isExpanded ? "flex-row items-center gap-4 rounded-xl hover:bg-white/5 p-2" : "flex-col items-center gap-1"
          )}
        >
          <div className={cn(
            "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
            activePanel === "whatif" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
          )}>
            <Sliders className="size-5" />
          </div>
          <span className={cn(
            "font-medium transition-colors text-left",
            isExpanded ? "text-sm text-slate-200 group-hover:text-white" : "text-[10px] text-slate-400 group-hover:text-slate-300"
          )}>
            What-If
          </span>
        </button>
      </div>

      <div className={cn("h-px bg-white/10 my-4 shrink-0", isExpanded ? "mx-4 w-auto" : "w-8 mx-auto")} />

      {isExpanded && (
        <div className="mx-6 mb-auto p-4 bg-white/[0.02] rounded-2xl border border-white/5 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
            <h4 className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase">Operational Brief</h4>
            <span className="text-[9px] font-mono text-emerald-500 animate-pulse">LIVE</span>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">INCIDENT</span>
              <span className="text-[11px] font-mono font-semibold text-rose-400">FLASH FLOOD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">PHASE</span>
              <span className="text-[11px] font-mono font-semibold text-orange-400">EVACUATION</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">THREAT</span>
              <span className="text-[11px] font-mono font-semibold text-rose-500">SEVERE [03]</span>
            </div>
          </div>
          
          <div className="h-px bg-white/5 my-1" />
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">FORECAST</span>
              <span className="text-[11px] font-mono text-slate-200">37 MIN</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">FOCUS SECTOR</span>
              <span className="text-[11px] font-mono text-slate-200">SECTOR-07</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">SAFE ROUTES</span>
              <span className="text-[11px] font-mono text-emerald-400">03 CLEAR</span>
            </div>
          </div>

          <div className="h-px bg-white/5 my-1" />

          <div className="flex flex-col gap-1 mt-1">
             <span className="text-[9px] font-mono text-slate-500 uppercase">Last Assessment</span>
             <span className="text-[10px] font-mono text-slate-400">{new Date().toLocaleTimeString('en-US', { hour12: false, timeZone: 'Asia/Kolkata' })} IST</span>
          </div>
        </div>
      )}

      <div className={cn("flex flex-col gap-6 w-full mb-4 mt-auto", isExpanded ? "px-4" : "items-center")}>
        <button className={cn(
          "group flex transition-colors w-full",
          isExpanded ? "flex-row items-center gap-4 rounded-xl hover:bg-white/5 p-2" : "flex-col items-center gap-1"
        )}>
          <div className="flex items-center justify-center size-10 shrink-0 rounded-xl text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5 transition-colors">
            <Smartphone className="size-5" />
          </div>
          <span className={cn(
            "font-medium transition-colors text-left",
            isExpanded ? "text-sm text-slate-200 group-hover:text-white" : "text-[10px] text-slate-400 group-hover:text-slate-300"
          )}>
            Get app
          </span>
        </button>
      </div>
    </div>
  )
}
