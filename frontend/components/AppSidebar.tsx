"use client"

import React, { useState } from "react"
import { Shield, Sparkles, Activity, Tent, FileText, ChevronRight, Menu, Smartphone, Flag, Sliders, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AppSidebarProps {
  activePanel: "chat" | "shelters" | "incident" | "report" | "whatif" | null
  setActivePanel: (v: "chat" | "shelters" | "incident" | "report" | "whatif" | null) => void
  isExpanded: boolean
  setIsExpanded: (v: boolean) => void
}

export function AppSidebar({ activePanel, setActivePanel, isExpanded, setIsExpanded }: AppSidebarProps) {
  const handleItemClick = (panel: "chat" | "shelters" | "incident" | "report" | "whatif") => {
    setActivePanel(activePanel === panel ? null : panel)
    // Always collapse sidebar after selecting an item
    setIsExpanded(false)
  }

  return (
    <>
      {/* Backdrop when sidebar is expanded */}
      {isExpanded && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Collapsed state: ONLY the menu button, hidden if sidebar is expanded OR if an active panel window is open */}
      {!isExpanded && !activePanel && (
        <div className="absolute top-20 left-3 z-50 pointer-events-auto">
          <button 
            onClick={() => setIsExpanded(true)}
            className="p-2.5 sm:p-3 rounded-xl bg-[#0E1626]/95 backdrop-blur-xl border border-white/10 hover:bg-white/10 transition-colors text-slate-300 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5 sm:size-6" />
          </button>
        </div>
      )}

      {/* Expanded sidebar panel — slides in from the left, inside viewport */}
      <div 
        className={cn(
          "fixed top-16 left-0 bottom-14 sm:bottom-16 bg-[#0E1626]/95 backdrop-blur-xl border-r border-white/5 z-50 flex flex-col pb-6 pointer-events-auto shadow-[4px_0_24px_rgba(0,0,0,0.5)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-y-auto no-scrollbar w-[280px] sm:w-[320px] max-w-[85vw]",
          isExpanded ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none"
        )}
      >
        {/* Header with close button */}
        <div className="flex items-center px-5 sm:px-6 justify-between py-3 sm:py-4 sticky top-0 bg-[#0E1626]/95 z-10 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">Menu</span>
          </div>
          <button 
            onClick={() => setIsExpanded(false)}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 shrink-0"
            aria-label="Close navigation menu"
          >
            <X className="size-5 sm:size-6" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex flex-col gap-2.5 sm:gap-3 w-full px-3 sm:px-4 mt-4">
          <button 
            onClick={() => handleItemClick("chat")}
            className="group flex flex-row items-center gap-3 sm:gap-4 rounded-xl hover:bg-white/5 p-2 transition-colors w-full"
          >
            <div className={cn(
              "flex items-center justify-center size-12 shrink-0 rounded-[18px] transition-colors border shadow-[0_0_15px_rgba(59,130,246,0.15)] relative",
              activePanel === "chat" ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 border-blue-500/20"
            )}>
              <Sparkles className="size-5" />
            </div>
            <span className="text-sm text-slate-200 group-hover:text-white font-medium transition-colors text-left">
              Ask Shield
            </span>
          </button>

          <button 
            onClick={() => handleItemClick("shelters")}
            className="group flex flex-row items-center gap-3 sm:gap-4 rounded-xl hover:bg-white/5 p-2 transition-colors w-full"
          >
            <div className={cn(
              "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
              activePanel === "shelters" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
            )}>
              <Tent className="size-5" />
            </div>
            <span className="text-sm text-slate-200 group-hover:text-white font-medium transition-colors text-left">
              Shelters
            </span>
          </button>

          <button 
            onClick={() => handleItemClick("incident")}
            className="group flex flex-row items-center gap-3 sm:gap-4 rounded-xl hover:bg-white/5 p-2 transition-colors w-full"
          >
            <div className={cn(
              "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
              activePanel === "incident" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
            )}>
              <Activity className="size-5" />
            </div>
            <span className="text-sm text-slate-200 group-hover:text-white font-medium transition-colors text-left">
              Incident
            </span>
          </button>

          <button 
            onClick={() => handleItemClick("report")}
            className="group flex flex-row items-center gap-3 sm:gap-4 rounded-xl hover:bg-white/5 p-2 transition-colors w-full"
          >
            <div className={cn(
              "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
              activePanel === "report" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
            )}>
              <Flag className="size-5" />
            </div>
            <span className="text-sm text-slate-200 group-hover:text-white font-medium transition-colors text-left">
              Report
            </span>
          </button>

          <button 
            onClick={() => handleItemClick("whatif")}
            className="group flex flex-row items-center gap-3 sm:gap-4 rounded-xl hover:bg-white/5 p-2 transition-colors w-full"
          >
            <div className={cn(
              "flex items-center justify-center size-10 shrink-0 rounded-xl transition-colors",
              activePanel === "whatif" ? "bg-white/10 text-white" : "text-slate-400 group-hover:text-slate-300 group-hover:bg-white/5"
            )}>
              <Sliders className="size-5" />
            </div>
            <span className="text-sm text-slate-200 group-hover:text-white font-medium transition-colors text-left">
              What-If
            </span>
          </button>
        </div>

        <div className="h-px bg-white/10 my-4 shrink-0 mx-4 w-auto" />

        {/* Operational Brief */}
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

      </div>
    </>
  )
}
