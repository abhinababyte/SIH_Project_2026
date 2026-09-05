"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShieldAlert, Activity, Navigation, CloudRain, Droplets, Mountain, Phone, Menu, User, Bell, BellRing, MessageCircle, ArrowRight, Settings, LogOut, Trash2, MapPin, AlertTriangle } from "lucide-react";
import { SosDetails } from "@/components/sos-details";
import { RiskDetails } from "@/components/risk-details";
import CitizenSafetyChat from "@/components/CitizenSafetyChat";
import { AlertsFeed } from "@/components/alerts-feed";
import { useFloodWebsocket } from "@/hooks/use-flood-websocket";
import { useSimulation } from "@/components/simulation-provider";

const FloodMap = dynamic(() => import("@/components/flood-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">INITIALIZING LIVE MAP...</div>
});

export default function ResidentLiveMap() {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [survivalMode, setSurvivalMode] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<any>(null);
  const [isRiskOpen, setIsRiskOpen] = useState(false);
  const [userName, setUserName] = useState("Resident");
  const { simulatedSensors, rain, soil, river, severity, isLiveOsiris, toggleOsiris } = useSimulation();

  useEffect(() => {
    const storedName = localStorage.getItem("hillshield_user_name");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // If survival mode is active, completely strip the UI down to the bare essentials (Cognitive Overload Shield)
  if (survivalMode) {
    return (
      <div className="min-h-screen bg-black text-white font-sans flex flex-col p-6 animate-in fade-in duration-500 relative z-[100]">
        <div className="flex-1 max-w-md mx-auto w-full flex flex-col justify-center space-y-8">
          
          <div className="bg-red-600 animate-pulse text-white p-4 rounded-2xl border-4 border-red-500 flex items-center justify-center gap-3 shadow-[0_0_50px_rgba(220,38,38,0.5)]">
            <ShieldAlert className="size-8" />
            <span className="text-4xl font-black tracking-widest">DANGER</span>
          </div>

          <div className="space-y-2 text-center">
            <h2 className="text-4xl font-black text-rose-500">EVACUATE NOW</h2>
            <p className="text-xl text-rose-200 font-mono">TIME TO IMPACT: 18 MINS</p>
          </div>

          <div className="bg-white/10 p-6 rounded-2xl border border-white/20">
            <h3 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-widest text-center">Safest Route</h3>
            <div className="flex flex-col items-center gap-2 mb-6">
              <span className="text-2xl font-bold">GOVT. SCHOOL SHELTER</span>
              <span className="text-emerald-400 font-bold">420m away • 6 min walk</span>
            </div>
            
            <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/30 text-center font-bold">
              🚫 DO NOT USE RIVER ROAD
            </div>
          </div>

          {/* Offline SMS Fallback (Dead-Zone Mode) */}
          <a href="sms:108?body=SOS! Flash Flood. Location: Lat 27.04, Long 88.26. 4 People." 
            className="w-full py-4 bg-transparent border-2 border-slate-600 text-slate-300 font-bold text-lg rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-transform">
            <Phone className="size-5" />
            SEND OFFLINE SOS (SMS)
          </a>

          <button onClick={() => setSurvivalMode(false)} className="text-slate-500 text-xs underline pt-4 text-center w-full">
            Exit Survival Mode (Simulation)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-[#070b14] text-slate-200 selection:bg-rose-500/30 font-sans flex flex-col relative pt-24">
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: flex;
          align-items: center;
          white-space: nowrap;
          animation: marquee 30s linear infinite;
          will-change: transform;
        }
      `}} />

      {/* TOP HEADER BAR */}
      <header className="fixed top-0 left-0 right-0 h-16 z-50 bg-[#0E1626]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between pr-6 pointer-events-auto">
        <div className="flex items-center h-full">
          <div className="h-16 w-[72px] shrink-0 flex items-center justify-center border-r border-white/5 overflow-hidden">
            <img src="/HillShield.png" alt="HillShield Logo" className="h-full w-full object-cover object-center" />
          </div>
          
          <div className="pl-6 flex items-center gap-6">
            <div>
              <h1 className="text-sm font-bold text-emerald-500 tracking-wide uppercase font-serif">HILLSHIELD: RESIDENT</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-5">
           {/* SOS Button */}
           <button 
             onClick={() => setIsSosOpen(!isSosOpen)}
             className="px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 transition-colors text-white text-[10px] font-mono tracking-widest font-bold uppercase flex items-center gap-2 shadow-[0_0_12px_rgba(225,29,72,0.6)] border border-rose-400 focus:outline-none"
           >
             <Phone className="size-3 hidden sm:block" />
             SOS
           </button>

           {/* Simulate Danger Button */}
           <button 
             onClick={() => setSurvivalMode(true)}
             className="px-3 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-[10px] font-mono tracking-widest font-bold uppercase transition-colors flex items-center gap-2"
           >
             <ShieldAlert className="size-3 hidden sm:block" />
             SIMULATE DANGER
           </button>
           
           <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block" />

           {/* Metrics */}
           <div className="hidden md:flex items-center gap-2">
              <Activity className="size-4 text-emerald-500" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                Uplink: <span className="text-emerald-500 font-bold">Secure</span>
              </span>
           </div>
           
           <div className="w-px h-4 bg-white/10 hidden md:block" />
           
           <div className="hidden md:flex items-center gap-2">
              <Activity className="size-4 text-white" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                Readings: <span className="text-white font-bold">14</span>
              </span>
           </div>

           <div className="w-px h-6 bg-white/10 hidden md:block" />

           {/* Notification Bell */}
           <button 
             onClick={() => setIsAlertsOpen(!isAlertsOpen)}
             className="relative flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors"
           >
             <Bell className="size-5 text-slate-300" />
             <span className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-rose-500 ring-2 ring-[#0E1626]" />
           </button>

           {/* Account Dropdown */}
           <div className="relative">
             <button 
               onClick={() => setIsAccountOpen(!isAccountOpen)}
               className="flex items-center justify-center p-2 rounded-full hover:bg-white/10 transition-colors border border-white/10 bg-slate-900 shadow-inner"
             >
               <User className="size-5 text-slate-300" />
             </button>

             {/* Dropdown Content */}
             {isAccountOpen && (
               <>
                 <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)} />
                 <div className="absolute right-0 mt-12 w-56 rounded-xl border border-white/10 bg-[#0E1626] shadow-xl z-50 overflow-hidden">
                   <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                     <p className="text-sm font-medium text-white">{userName}</p>
                     <p className="text-xs text-slate-400">ID: R-402</p>
                   </div>
                   <div className="p-1">
                     <button className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors">
                       <Settings className="size-3.5" />
                       Account Settings
                     </button>
                     <button className="w-full text-left px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 transition-colors mt-1">
                       <Trash2 className="size-3.5" />
                       Delete Account
                     </button>
                     <button 
                       onClick={() => window.location.href = '/login'}
                       className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors mt-1 border-t border-white/5 pt-2"
                     >
                       <LogOut className="size-3.5" />
                       Sign Out
                     </button>
                   </div>
                 </div>
               </>
             )}
           </div>
        </div>
      </header>

      {/* LIVE NEWS TICKER (FLOATING BELOW HEADER) */}
      <div className="fixed top-16 left-0 right-0 h-8 z-40 bg-[#0E1626] border-b border-rose-500/20 flex items-center overflow-hidden pointer-events-none shadow-md">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#0E1626] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#0E1626] to-transparent z-10" />
        
        <div className="animate-marquee h-full text-[10px] font-mono tracking-widest text-rose-300 uppercase gap-12 px-6">
          <span className="flex items-center gap-2 h-full">
            <span className="relative flex size-1.5 shrink-0"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span><span className="relative inline-flex rounded-full size-1.5 bg-rose-500"></span></span>
            <strong>HEAVY RAINFALL WARNING:</strong> 120mm expected in next 4 hours across Lower Basin.
          </span>
          <span className="opacity-30 h-full flex items-center">|</span>
          <span className="flex items-center gap-2 h-full">
            <Mountain className="size-3 text-orange-400 shrink-0" />
            <strong>SOIL INSTABILITY DETECTED:</strong> High risk of landslides in Sector 4 (Millbrook Slope). Avoid area.
          </span>
          <span className="opacity-30 h-full flex items-center">|</span>
          <span className="flex items-center gap-2 h-full">
            <ShieldAlert className="size-3 text-emerald-400 shrink-0" />
            <strong>SHELTER UPDATE:</strong> Govt. School (North Wing) is now OPEN for evacuees.
          </span>
          <span className="opacity-30 h-full flex items-center">|</span>
          <span className="flex items-center gap-2 h-full">
            <Activity className="size-3 text-blue-400 shrink-0" />
            <strong>UPLINK STATUS:</strong> Community Mesh Network is ONLINE and stable.
          </span>
        </div>
      </div>

      {/* Floating Active Alerts Window */}
      {isAlertsOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsAlertsOpen(false)} />
          <div className="fixed top-28 right-20 z-40 bg-[#0E1626]/95 backdrop-blur-xl border border-white/10 w-[420px] max-h-[600px] flex flex-col rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 p-6">
            <AlertsFeed userType="resident" />
          </div>
        </>
      )}

      {/* SOS Panel Overlay */}
      {isSosOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setIsSosOpen(false)} />
          <div className="fixed top-28 right-6 z-40 bg-[#0E1626]/95 backdrop-blur-xl border border-white/10 w-[320px] flex flex-col rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 p-6">
            <SosDetails userType="resident" />
          </div>
        </>
      )}
      {/* MAIN CONTENT (MAP & LEGEND) */}
      <style>{`.leaflet-control-zoom { display: none !important; }`}</style>
      <main className="flex-1 relative w-full h-full bg-slate-950 z-0">
        <div className="absolute inset-0 z-0">
          <FloodMap 
            sensors={simulatedSensors} 
            blockedRoutes={[{ id: "1", lat: 30.7380, lng: 78.5950, title: "Fallen Tree on River Road" }]}
            onSensorClick={(s: any) => { setSelectedSensor(s); setIsRiskOpen(true); }} 
            showUserLocation={true} 
          />
        </div>

        {/* Floating Risk Details Window */}
        {isRiskOpen && (
          <>
            <div 
              className="fixed inset-0 z-30" 
              onClick={() => setIsRiskOpen(false)} 
            />
            <div className="absolute top-6 right-6 z-40 pointer-events-auto bg-[#0a0f18]/95 backdrop-blur-xl border border-white/10 w-[420px] max-w-[calc(100vw-3rem)] flex flex-col rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 p-6">
              <RiskDetails rain={rain} soil={soil} river={river} severity={severity} selectedSensor={selectedSensor} />
            </div>
          </>
        )}

        {/* MAP LEGEND (COPIED EXACTLY FROM RESPONDER, MOVED TO LEFT TO AVOID AI CHAT) */}
        <div className="absolute bottom-6 left-6 z-30 pointer-events-auto bg-[#0a0f18]/90 backdrop-blur-md px-5 py-4 rounded-xl shadow-xl border border-white/10 flex flex-col gap-4">
          <h4 className="text-[10px] font-mono tracking-wider text-slate-400 uppercase border-b border-white/5 pb-2">Tactical Legend</h4>
          
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Routes & Paths</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-4 h-1 bg-emerald-500/80 rounded-full" /> <span className="min-w-[60px]">Clear</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-4 h-1 bg-amber-500/80 rounded-full" /> <span className="min-w-[60px]">Congested</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-4 h-1 bg-rose-500/80 rounded-full border-t border-dashed border-rose-300" /> <span className="min-w-[60px]">Blocked</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Map Nodes</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3 bg-white/20 p-0.5 rounded-sm border border-slate-300"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> <span>Shelter (House)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-3 rounded-full bg-white/10 border border-slate-300" /> <span>Sensor (Circle)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-3 rounded-full bg-amber-500/30 border border-amber-500/50 animate-pulse" /> <span>Alert Hotspot</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-3 rounded-full bg-rose-500/30 border border-rose-500/50 animate-pulse" /> <span>Danger Hotspot</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Persistent Ask AI Floating Button */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-4">
        {isAiChatOpen && (
          <div className="w-[350px] shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-[#0E1626]">
            <CitizenSafetyChat isOpen={isAiChatOpen} onClose={() => setIsAiChatOpen(false)} userType="resident" />
          </div>
        )}
        <button 
          onClick={() => setIsAiChatOpen(!isAiChatOpen)}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 p-4 rounded-full shadow-lg flex items-center gap-2 font-bold transition-transform hover:scale-105"
        >
          <MessageCircle className="size-6" />
          {!isAiChatOpen && <span>Shield AI</span>}
        </button>
      </div>

      <footer className="w-full bg-[#0a0f18]/95 backdrop-blur-xl border-t border-white/5 px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[10px] font-mono tracking-widest uppercase text-slate-500">
          <span>&copy; {new Date().getFullYear()} HILLSHIELD SYSTEMS</span>
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Protocol</a>
          <a href="#" className="hover:text-slate-300 transition-colors">Terms of Access</a>
        </div>
        
        <div className="text-[10px] font-mono tracking-wider text-slate-500 flex items-center">
          <span className="flex items-center gap-1.5 text-slate-400">
            Created with <span className="text-rose-500 text-sm">❤️</span> by <strong className="text-emerald-500 font-bold tracking-widest">Codex Gigas</strong> for India
          </span>
        </div>
      </footer>

    </div>
  );
}



