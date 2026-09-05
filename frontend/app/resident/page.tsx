"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ShieldAlert, Activity, Navigation, CloudRain, Droplets, Mountain, Phone, Menu, User, Bell, BellRing, MessageCircle, ArrowRight, Settings, LogOut, Trash2, MapPin, AlertTriangle } from "lucide-react";
import { SosDetails } from "@/components/sos-details";
import CitizenSafetyChat from "@/components/CitizenSafetyChat";
import { AlertsFeed } from "@/components/alerts-feed";
import { CommunityReportsSection } from "@/components/CommunityReportsSection";
import { useFloodWebsocket } from "@/hooks/use-flood-websocket";
import { useSimulation } from "@/components/simulation-provider";

const FloodMap = dynamic(() => import("@/components/flood-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">INITIALIZING LIVE MAP...</div>
});

export default function ResidentDashboard() {
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [survivalMode, setSurvivalMode] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [userName, setUserName] = useState("Resident");
  const { simulatedSensors, rain: globalRain, soil: globalSoil, river, severity } = useSimulation();
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [localRain, setLocalRain] = useState<number | null>(null);
  const [localSoil, setLocalSoil] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);
  const [blockedRoutes, setBlockedRoutes] = useState<{id: string, lat: number, lng: number, title: string}[]>([{ id: '1', lat: 30.7380, lng: 78.5950, title: 'Fallen Tree on River Road' }]);

  const handleShareLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setUserLocation({lat, lng});
      
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=precipitation,soil_moisture_0_to_7cm`);
        const data = await res.json();
        setLocalRain(data.current.precipitation || 0);
        setLocalSoil(Math.min(100, (data.current.soil_moisture_0_to_7cm || 0.2) * 200));
        
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const geoData = await geoRes.json();
        setLocationName(geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || "Your Location");
      } catch (e) {
        console.error(e);
      }
      setIsLocating(false);
    }, () => {
      setIsLocating(false);
      alert("Location access denied. Using regional data.");
    });
  };

  const rain = localRain !== null ? localRain : globalRain;
  const soil = localSoil !== null ? localSoil : globalSoil;

  useEffect(() => {
    const storedName = localStorage.getItem("hillshield_user_name");
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  // Derived metrics and severities
  const rainSev = rain > 30 ? "danger" : rain > 15 ? "watch" : "safe";
  const soilSev = soil > 70 ? "danger" : soil > 40 ? "watch" : "safe";
  const slopeStability = Math.max(10, Math.round(100 - (soil * 0.9)));
  const slopeSev = slopeStability < 40 ? "danger" : slopeStability < 70 ? "watch" : "safe";
  const leadTime = Math.max(15, Math.round(120 - (river * 20)));
  const leadSev = leadTime < 30 ? "danger" : leadTime < 60 ? "watch" : "safe";
  
  // Make the composite index less aggressive so it doesn't instantly hit 100
  const compositeIndex = Math.min(100, Math.max(0, Math.round((rain * 1.2) + (soil * 0.4) + (river * 4))));
  const compositeSev = compositeIndex > 75 ? "danger" : compositeIndex > 40 ? "watch" : "safe";

  const getBgStyle = (sev: "safe" | "watch" | "danger" | string) => {
    switch (sev) {
      case "danger": return "bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.2)]";
      case "watch": return "bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.2)]";
      case "safe": return "bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]";
      default: return "bg-[#121923] border-white/5";
    }
  };

  const getTextColor = (sev: "safe" | "watch" | "danger" | string) => {
    switch (sev) {
      case "danger": return "text-rose-400";
      case "watch": return "text-amber-400";
      case "safe": return "text-emerald-400";
      default: return "text-white";
    }
  };

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
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-rose-500/30 font-sans flex flex-col relative pt-24">
      
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
          <div className="h-16 w-auto shrink-0 flex items-center justify-center border-r border-white/5 pr-4">
              <img src="/HillShield.png" alt="HillShield Logo" className="h-12 w-auto object-contain" />
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

      {/* 1. HERO SECTION */}
      <section className="relative px-6 pt-8 pb-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Background radial gradient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-900/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div className="flex-1 space-y-8 z-10">
          <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-500 mb-6 flex items-center gap-2">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            Live • Resident Safety Portal
          </div>
          
          <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight leading-[1.1]">
            Your Community's <span className="italic text-slate-400">Shield</span><br/>
            Against the Storm.
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
            Real-time flood alerts, active evacuation routes, and immediate shelter guidance tailored specifically to your village and elevation.
          </p>
          
          <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 pt-4">
            <button 
              onClick={() => document.getElementById('shelters-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 py-2.5 text-sm bg-[#e8e4dc] hover:bg-white text-slate-900 font-semibold rounded-full transition-colors whitespace-nowrap"
            >
              Find Nearest Shelter
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('micro-shelter-form');
                if (el) {
                  el.scrollIntoView({ behavior: 'smooth' });
                  // Focus the first input after scrolling
                  setTimeout(() => el.querySelector('input')?.focus(), 800);
                }
              }}
              className="px-4 py-2.5 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-full border border-emerald-500/20 transition-colors whitespace-nowrap"
            >
              Register Micro-Shelter
            </button>
            <button 
              onClick={() => {
                const nav = document.getElementById('landmark-navigation');
                if (nav) {
                  nav.scrollIntoView({ behavior: 'smooth' });
                    setTimeout(() => {
                      const form = document.getElementById('route-report-form');
                      if (form) {
                        form.classList.remove('hidden');
                        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                      }
                    }, 500);
                }
              }}
              className="px-4 py-2.5 text-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium rounded-full border border-rose-500/20 transition-colors whitespace-nowrap"
            >
              Report Blocked Route
            </button>
          </div>
        </div>

        {/* Hero Status Card */}
        <div className="w-full lg:w-[540px] bg-[#121923] border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden z-10 flex flex-col gap-6">
          
          {/* Header & Level */}
          <div className="flex items-start justify-between">
            <div className="w-full">
              {userLocation ? (
                <>
                  <span className={`inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full mb-3 border ${compositeSev === 'danger' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : compositeSev === 'watch' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
                    {compositeSev === 'danger' ? 'CRITICAL DANGER' : compositeSev === 'watch' ? 'ELEVATED RISK' : 'SAFE ZONE'}
                  </span>
                  <h2 className="text-2xl font-serif text-white mb-1">
                    {compositeSev === 'danger' ? 'Evacuate Immediately' : compositeSev === 'watch' ? 'Be Prepared' : 'Conditions Stable'}
                  </h2>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1 mb-3">
                    <MapPin className="size-3 inline-block mr-1 text-[#5E6AD2]" />
                    Localized for: <strong className="text-white">{locationName || "Your exact coordinates"}</strong>
                  </p>
                </>
              ) : (
                <>
                  <span className="inline-block px-3 py-1 bg-slate-500/20 text-slate-400 text-xs font-bold tracking-widest uppercase rounded-full mb-3 border border-slate-500/30">
                    Regional Alert
                  </span>
                  <h2 className="text-2xl font-serif text-white mb-1">Warning System Active</h2>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">Showing generalized regional data.</p>
                  
                  <button 
                    onClick={handleShareLocation}
                    disabled={isLocating}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#5E6AD2]/10 hover:bg-[#5E6AD2]/20 border border-[#5E6AD2]/30 text-[#5E6AD2] rounded-full text-xs font-bold tracking-widest uppercase transition-all shadow-[0_0_15px_rgba(94,106,210,0.15)]"
                  >
                    {isLocating ? (
                      <div className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                    Use Precise Location
                  </button>
                </>
              )}
            </div>
            
            <button className="p-2.5 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500/20 transition-colors shrink-0">
              <BellRing className="size-4" />
            </button>
          </div>

          {/* Predictive Safe Window & Evidence */}
          {userLocation ? (
            <>
              {/* Predictive Safe Window */}
              <div className="bg-black/30 rounded-2xl border border-white/5 p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
                  <div className={`h-full ${compositeSev === 'danger' ? 'bg-rose-500 w-[80%]' : compositeSev === 'watch' ? 'bg-amber-500 w-[50%]' : 'bg-emerald-500 w-[10%]'} animate-pulse`}></div>
                </div>
                
                <div className="flex items-end justify-between mb-3 mt-1">
                  <div>
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">Impact Window</div>
                    {compositeSev === 'danger' ? (
                        <div className="text-3xl font-black text-rose-400">12<span className="text-sm text-rose-400/70 ml-1 font-sans">mins left</span></div>
                    ) : compositeSev === 'watch' ? (
                        <div className="text-3xl font-black text-amber-400">45<span className="text-sm text-amber-400/70 ml-1 font-sans">mins left</span></div>
                    ) : (
                        <div className="text-3xl font-black text-emerald-400">Stable</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mb-1">Action</div>
                    {compositeSev === 'danger' ? (
                        <div className="text-sm font-bold text-rose-400 uppercase tracking-wider animate-pulse">Evacuate Now</div>
                    ) : compositeSev === 'watch' ? (
                        <div className="text-sm font-bold text-amber-400 uppercase tracking-wider animate-pulse">Prepare Kits</div>
                    ) : (
                        <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Stay Inside</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {compositeSev !== 'safe' ? (
                      <>
                      <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-xs text-slate-300 flex items-center gap-2"><div className="size-1.5 rounded-full bg-amber-500"></div> Secure Documents</span>
                        <span className="text-[10px] font-mono text-slate-400">~2 min ⏳</span>
                      </div>
                      <div className="flex items-center justify-between bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-xs text-emerald-400 font-bold flex items-center gap-2"><div className="size-1.5 rounded-full bg-emerald-500 animate-ping"></div> Walk to Shelter</span>
                        <span className="text-[10px] font-mono text-emerald-400 font-bold">~6 min 🏃</span>
                      </div>
                      </>
                  ) : (
                      <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                        <span className="text-xs text-slate-300 flex items-center gap-2"><div className="size-1.5 rounded-full bg-emerald-500"></div> All Clear</span>
                        <span className="text-[10px] font-mono text-slate-400">Local Area Safe</span>
                      </div>
                  )}
                </div>
              </div>

              {/* Alert Evidence Layer */}
              <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Why this alert?</span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <ShieldAlert className="size-3" />
                    Local Telemetry
                  </span>
                </div>
                <ul className="space-y-1.5">
                  <li className="text-[11px] text-slate-400 flex items-center gap-2"><CloudRain className="size-3 text-[#5E6AD2]"/> {Math.round(rain)}mm rainfall detected locally</li>
                  <li className="text-[11px] text-slate-400 flex items-center gap-2"><Droplets className="size-3 text-emerald-400"/> Local soil saturation at {Math.round(soil)}%</li>
                </ul>
              </div>
            </>
          ) : (
            <div className="bg-black/20 rounded-xl p-6 border border-white/5 flex flex-col items-center justify-center text-center mt-2">
                <ShieldAlert className="size-8 text-slate-600 mb-3" />
                <p className="text-sm text-slate-300 font-medium">Location Required</p>
                <p className="text-xs text-slate-500 mt-1 max-w-[280px]">To see precise evacuation windows and hyper-local sensor data, please share your location.</p>
            </div>
          )}
        </div>
      </section>

      {/* 2. LIVE SENSORS */}
      <section className="px-6 py-12 w-full max-w-7xl mx-auto border-t border-white/5">
        <div className="mb-8 w-full text-left">
          <div className="text-emerald-400 font-mono text-xs tracking-widest mb-2 uppercase">01 - Live Sensors</div>
          <h2 className="text-3xl md:text-4xl font-serif text-white">Regional readings</h2>
          <p className="text-slate-400 mt-2">Live telemetry from remote rainfall gauges and soil-moisture probes. Updated every 10 seconds.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Composite Risk Gauge */}
            <div className={`border rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 ${getBgStyle(compositeSev)}`}>
              {/* Concentric rings background */}
              <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
                <div className="w-[150%] aspect-square rounded-full border border-white/20 scale-75"></div>
                <div className="absolute w-[150%] aspect-square rounded-full border border-white/20 scale-100"></div>
                <div className="absolute w-[150%] aspect-square rounded-full border border-white/20 scale-125"></div>
              </div>
  
              <div className="text-sm text-slate-400 font-mono tracking-widest font-bold uppercase mb-1 z-10">Composite Risk Index</div>
              <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-6 z-10 opacity-70 bg-black/20 px-2 py-1 rounded">LOC: 30°42'N 78°27'E</div>
              
              {/* CSS Circular Gauge */}
              <div className="relative size-48 flex items-center justify-center z-10">
                <svg className="absolute inset-0 size-full transform -rotate-90">
                  <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
                  <circle cx="96" cy="96" r="80" fill="none" stroke="currentColor" strokeWidth="12" strokeDasharray="502" strokeDashoffset={502 - (502 * (compositeIndex / 100))} strokeLinecap="round" className={`transition-all duration-1000 ${getTextColor(compositeSev)}`} />
                </svg>
                <div className="text-center">
                  <div className={`text-5xl font-serif ${getTextColor(compositeSev)}`}>{compositeIndex}</div>
                  <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-1">Risk Index</div>
                </div>
              </div>
  
              <div className="mt-8 text-sm text-slate-400 z-10 text-center">
                Storm intensity <span className="text-white font-bold">{Math.min(100, Math.round(rain * 2.5))}%</span>
                <p className="mt-3 text-xs text-slate-500 leading-relaxed max-w-[200px] mx-auto hidden sm:block">
                  Aggregated in real-time from local AI models and ground telemetry.
                </p>
              </div>
            </div>

          {/* 4-Card Grid */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors duration-1000 ${getBgStyle(rainSev)}`}>
              <div className="flex items-start justify-between">
                <div className={`text-sm font-bold font-mono tracking-widest uppercase ${getTextColor(rainSev)} opacity-80`}>Rainfall</div>
                <CloudRain className={`size-4 ${getTextColor(rainSev)} opacity-60`} />
              </div>
              <div className="mt-8">
                <div className={`text-4xl font-serif ${getTextColor(rainSev)}`}>{Number(rain).toFixed(2)} <span className="text-sm font-sans opacity-70">mm/hr</span></div>
                <p className={`mt-3 text-xs leading-relaxed hidden sm:block ${getTextColor(rainSev)} opacity-70`}>
                  {rainSev === "danger" ? "Extreme downpour. Ground absorption halted. Immediate flash flood risk." : rainSev === "watch" ? "Steady downpour. Ground absorption is slowing down. Expected to continue." : "Light rain. Natural drainage systems are functioning normally."}
                </p>
              </div>
            </div>
            
            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors duration-1000 ${getBgStyle(soilSev)}`}>
              <div className="flex items-start justify-between">
                <div className={`text-sm font-bold font-mono tracking-widest uppercase ${getTextColor(soilSev)} opacity-80`}>Soil Moisture</div>
                <Droplets className={`size-4 ${getTextColor(soilSev)} opacity-60`} />
              </div>
              <div className="mt-8">
                <div className={`text-4xl font-serif ${getTextColor(soilSev)}`}>{Number(soil).toFixed(2)}<span className="text-xl font-sans ml-1 opacity-70">%</span></div>
                <p className={`mt-3 text-xs leading-relaxed hidden sm:block ${getTextColor(soilSev)} opacity-70`}>
                  {soilSev === "danger" ? "Critical saturation. Mudslides likely in steep areas. Avoid slopes." : soilSev === "watch" ? "Ground is heavily saturated. Approaching critical threshold for potential landslides." : "Optimal soil absorption levels. No immediate landslide threat."}
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors duration-1000 ${getBgStyle(slopeSev)}`}>
              <div className="flex items-start justify-between">
                <div className={`text-sm font-bold font-mono tracking-widest uppercase ${getTextColor(slopeSev)} opacity-80`}>Slope Stability</div>
                <Mountain className={`size-4 ${getTextColor(slopeSev)} opacity-60`} />
              </div>
              <div className="mt-8">
                <div className={`text-4xl font-serif ${getTextColor(slopeSev)}`}>{slopeStability}<span className="text-sm font-sans ml-1 opacity-70">/ 100</span></div>
                <p className={`mt-3 text-xs leading-relaxed hidden sm:block ${getTextColor(slopeSev)} opacity-70`}>
                  {slopeSev === "danger" ? "Critical instability. Active soil displacement detected in sectors 4 and 7." : slopeSev === "watch" ? "Moderate risk. Minor soil stress detected. Actively monitoring." : "Stable bedrock and soil structure. No displacement detected."}
                </p>
              </div>
            </div>

            <div className={`p-6 rounded-3xl border flex flex-col justify-between transition-colors duration-1000 ${getBgStyle(leadSev)}`}>
              <div className="flex items-start justify-between">
                <div className={`text-sm font-bold font-mono tracking-widest uppercase ${getTextColor(leadSev)} opacity-80`}>Lead Time</div>
                <Activity className={`size-4 ${getTextColor(leadSev)} opacity-60`} />
              </div>
              <div className="mt-8">
                <div className={`text-4xl font-serif ${getTextColor(leadSev)}`}>{leadTime} <span className="text-sm font-sans opacity-70">minutes</span></div>
                <p className={`mt-3 text-xs leading-relaxed hidden sm:block ${getTextColor(leadSev)} opacity-70`}>
                  {leadSev === "danger" ? "Imminent threat window. Prepare for immediate evacuation of low-lying areas." : leadSev === "watch" ? "Estimated window before critical flood levels are reached at the primary river basin." : "Sufficient time to secure property if conditions worsen."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VILLAGE MAP & EVACUATION (Landmark-Based Navigation) */}
      <section id="landmark-navigation" className="px-6 py-12 w-full max-w-7xl mx-auto border-t border-white/5 scroll-mt-24">
        <div className="mb-8 w-full text-left">
          <div className="text-emerald-400 font-mono text-xs tracking-widest mb-2 uppercase">02 - Evacuation Routing</div>
          <h2 className="text-3xl md:text-4xl font-serif text-white">Landmark Navigation</h2>
          <p className="text-slate-400 mt-2">GPS drifts in heavy rain. Follow verified local landmarks to the nearest shelter.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mini-Map Glimpse */}
          <style>{`.leaflet-control-zoom { display: none !important; }`}</style>
          <Link href="/resident/map" className="bg-[#121923] border border-white/5 rounded-3xl p-2 relative overflow-hidden group block min-h-[400px]">
            <div className="absolute inset-0 bg-black/20 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm cursor-pointer">
              <button className="bg-emerald-500 text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                <Navigation className="size-4" />
                Expand Live Map
              </button>
            </div>
            {/* Real Map UI disabled for the glimpse */}
            <div className="absolute inset-2 rounded-2xl bg-[#0a0f18] overflow-hidden pointer-events-none z-10">
              <div className="absolute inset-0 z-0">
                <FloodMap sensors={simulatedSensors} onSensorClick={() => {}} showUserLocation={true} blockedRoutes={blockedRoutes} />
              </div>
            </div>
          </Link>

          {/* Landmark Step-by-Step */}
          <div className="bg-[#121923] border border-white/5 rounded-3xl p-8 shadow-xl">
            <h3 className="text-xl font-serif text-white mb-6 flex items-center gap-2">
              <Navigation className="size-5 text-emerald-400" />
              Route to Safety
            </h3>
            
            <div className="relative border-l border-white/10 ml-4 space-y-8 pb-4">
              
              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20"></div>
                <div className="text-xs text-rose-400 font-mono mb-1">START • 0 MINS</div>
                <div className="text-lg font-medium text-white mb-1">Your Location</div>
                <p className="text-sm text-slate-400">Head north uphill towards the main village square.</p>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-amber-500 ring-4 ring-amber-500/20"></div>
                <div className="text-xs text-amber-400 font-mono mb-1">LANDMARK 1 • 2 MINS</div>
                <div className="text-lg font-medium text-white mb-1">The Big Peepal Tree</div>
                <div className="bg-black/30 rounded-xl p-3 border border-white/5 mt-2 flex gap-3 items-center">
                  <div className="size-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
                    <Mountain className="size-5 text-slate-500" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Turn LEFT immediately after passing the large peepal tree. <strong className="text-rose-400">DO NOT take the lower dirt path.</strong></p>
                </div>
              </div>

              <div className="relative pl-6">
                <div className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"></div>
                <div className="text-xs text-emerald-400 font-mono mb-1">DESTINATION • 6 MINS</div>
                <div className="text-lg font-medium text-emerald-400 mb-1">Govt. School Shelter</div>
                <div className="text-sm text-slate-300">
                  Enter through the main blue gates. Check in with the volunteer immediately to sync your family status.
                </div>
              </div>

            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-6">
              <button 
                onClick={() => {
                  const el = document.getElementById('route-report-form');
                  if (el) {
                    el.classList.toggle('hidden');
                    setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
                  }
                }}
                className="w-full py-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                <ShieldAlert className="size-5" />
                Report Blocked Route
              </button>
            </div>

            {/* Hidden inline form */}
            <div id="route-report-form" className="hidden mt-4 p-4 bg-black/40 border border-rose-500/30 rounded-2xl transition-all">
              <h4 className="text-rose-400 font-bold text-sm mb-3">Report Blockage on this Route</h4>
              <form onSubmit={(e) => { 
                e.preventDefault(); 
                alert("Route blockage reported to community and responders."); 
                document.getElementById('route-report-form')?.classList.add('hidden'); 
              }}>
                <select className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white mb-3 focus:outline-none focus:border-rose-500">
                  <option>Between Start & Landmark 1 (The Big Peepal Tree)</option>
                  <option>Between Landmark 1 & Destination (Govt. School)</option>
                  <option>At Destination</option>
                </select>
                <textarea rows={2} placeholder="What is blocking the path? (e.g. fallen tree, deep water)..." className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-white mb-3 focus:outline-none focus:border-rose-500 resize-none"></textarea>
                <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-xl transition-colors">
                  Submit Route Report
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SAFE ZONES (Shelters) */}
      <section id="shelters-section" className="px-6 py-12 w-full max-w-7xl mx-auto border-t border-white/5 scroll-mt-24">
        <div className="mb-8 w-full text-left">
          <div className="text-emerald-400 font-mono text-xs tracking-widest mb-2 uppercase">03 - Safe Zones</div>
          <h2 className="text-3xl md:text-4xl font-serif text-white">Shelter Status</h2>
          <p className="text-slate-400 mt-2">Real-time capacity tracking for verified community shelters and registered safe houses.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Shelters List */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Open Shelter */}
            <div className="bg-[#121923] border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center shadow-lg">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Govt. School (North Wing)
                  </h3>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono tracking-widest uppercase rounded-full border border-emerald-500/30 font-bold flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Open
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                  <MapPin className="size-4 text-slate-500" />
                  0.8 km away • 12 min walk
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Capacity: 30%</span>
                    <span>30 / 100 people</span>
                  </div>
              <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-emerald-500 w-[30%]"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
                <Link href="/resident/map" className="w-full px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Navigation className="size-4" />
                  Route
                </Link>
              </div>
            </div>

            {/* Near Capacity Shelter */}
            <div className="bg-[#121923] border border-amber-500/30 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center shadow-lg">
              <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    Community Hall (Sector 2)
                  </h3>
                  <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-mono tracking-widest uppercase rounded-full border border-amber-500/30 font-bold flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                    Filling Fast
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                  <MapPin className="size-4 text-slate-500" />
                  1.2 km away • 18 min walk
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>Capacity: 85%</span>
                    <span>42 / 50 people</span>
                  </div>
                  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-amber-500 w-[85%]"></div>
                  </div>
                </div>
              </div>
              
              <div className="w-full md:w-auto shrink-0 flex flex-col gap-2">
                <Link href="/resident/map" className="w-full px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Navigation className="size-4" />
                  Route
                </Link>
              </div>
            </div>

            {/* Full Shelter */}
            <div className="bg-[#121923] border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row gap-6 items-center opacity-75">
              <div className="absolute top-0 left-0 w-2 h-full bg-rose-500/50"></div>
              <div className="flex-1 w-full">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-white/70 line-through decoration-rose-500/50 flex items-center gap-2">
                    Primary Health Center
                  </h3>
                  <span className="px-3 py-1 bg-rose-500/10 text-rose-400 text-[10px] font-mono tracking-widest uppercase rounded-full border border-rose-500/20 font-bold flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-rose-500"></span>
                    Full Capacity
                  </span>
                </div>
                <p className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                  <MapPin className="size-4 text-slate-600" />
                  0.3 km away • Not accepting evacuees
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-mono text-rose-400/50">
                    <span>Capacity: 100%</span>
                    <span>20 / 20 people</span>
                  </div>
                  <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-rose-500/50 w-full"></div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Micro-Shelter Registration */}
          <div id="micro-shelter-form" className="bg-[#121923] border border-white/5 rounded-3xl p-6 relative overflow-hidden flex flex-col scroll-mt-24">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <User className="size-32" />
            </div>
            
            <h3 className="text-xl font-serif text-white mb-2 relative z-10">Register Micro-Shelter</h3>
            <p className="text-xs text-slate-400 mb-6 relative z-10">
              Have safe high ground? Open your doors to neighbors in need. Your location will be securely shared only with verified locals.
            </p>

            <form className="flex flex-col gap-4 relative z-10 mt-auto" onSubmit={(e) => { e.preventDefault(); alert("Micro-shelter registered successfully."); }}>
              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 block">Shelter Name / House Info</label>
                <input type="text" placeholder="e.g. Sharma Residence (2nd Floor)" className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 block">Capacity</label>
                  <input type="number" placeholder="No. of people" className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 block">Contact No.</label>
                  <input type="tel" placeholder="10-digit number" className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 block">Precise Location</label>
                <button type="button" className="w-full bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg p-3 text-sm text-emerald-400 flex items-center justify-center gap-2 transition-colors">
                  <MapPin className="size-4" />
                  Use Current Location
                </button>
              </div>

              <button type="submit" className="w-full py-4 mt-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl transition-colors">
                List as Safe House
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* 5. CROWDSOURCED INTEL (Reports) */}
      <section id="reports-section" className="px-6 py-12 w-full max-w-7xl mx-auto border-t border-white/5 scroll-mt-24">
        <div className="mb-8 w-full text-left">
          <div className="text-emerald-400 font-mono text-xs tracking-widest mb-2 uppercase">04 - Crowdsourced Intel</div>
          <h2 className="text-3xl md:text-4xl font-serif text-white">Community Incident Reports</h2>
          <p className="text-slate-400 mt-2">Live reports from your neighbors. Ground-truth data is critical when sensors fail.</p>
        </div>

        <CommunityReportsSection userName={userName} />
      </section>

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

      <footer className="w-full bg-[#0a0f18]/95 backdrop-blur-xl border-t border-white/5 px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.5)]">
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[10px] font-mono tracking-widest uppercase text-slate-500">
          <span>&copy; {new Date().getFullYear()} HillShield Systems</span>
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



