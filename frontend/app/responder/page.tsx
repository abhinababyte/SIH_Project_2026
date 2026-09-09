"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  CloudRain,
  LogOut,
  MapPin,
  Phone,
  Radio,
  Settings,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppSidebar } from "@/components/AppSidebar";
import { AlertsFeed } from "@/components/alerts-feed";
import { AuthGuard } from "@/components/auth-guard";
import CitizenSafetyChat from "@/components/CitizenSafetyChat";
import IncidentPanel from "@/components/IncidentPanel";
import ReportPanel from "@/components/ReportPanel";
import { RiskDashboard } from "@/components/risk-dashboard";
import { RiskDetails } from "@/components/risk-details";
import SheltersPanel from "@/components/SheltersPanel";
import { useSimulation } from "@/components/simulation-provider";
import { SosDetails } from "@/components/sos-details";
import { WhatIfSimulator } from "@/components/WhatIfSimulator";
import { useFloodWebsocket } from "@/hooks/use-flood-websocket";
import { clearSession, getUser } from "@/lib/auth";
import { overallSeverity, type Sensor } from "@/lib/flood-data";
import { cn } from "@/lib/utils";

const FloodMap = dynamic(() => import("@/components/flood-map"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 font-mono">
      INITIALIZING TACTICAL MAP...
    </div>
  ),
});

export default function TacticalCommandCenter() {
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isRiskOpen, setIsRiskOpen] = useState(false);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<
    "chat" | "shelters" | "incident" | "report" | "whatif" | null
  >(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [userName, setUserName] = useState("Responder Node 01");

  useEffect(() => {
    const user = getUser();
    if (user?.full_name) setUserName(user.full_name);

    // DEMO: Transient Toast Notifications for Critical Real-Time Events (Looping every 30 minutes)
    let t1: NodeJS.Timeout, t2: NodeJS.Timeout, t3: NodeJS.Timeout, t4: NodeJS.Timeout;

    const showToasts = () => {
      // Popup 1: Urgent Warning
      t1 = setTimeout(() => {
        toast.error("Flash Flood Imminent", {
          description: "Water levels at Rasdale Bridge exceeded critical thresholds.",
          duration: 6000,
          position: "top-center",
        });
      }, 2000);

      // Popup 2: Dispatch Update
      t2 = setTimeout(() => {
        toast.info("HQ Dispatch", {
          description: "Evacuation Helicopter En Route to Sector 4.",
          duration: 6000,
          position: "top-center",
        });
      }, 8000);

      // Popup 3: Infrastructure Alert
      t3 = setTimeout(() => {
        toast.warning("Infrastructure Alert", {
          description: "Debris flow detected near Millbrook Road Bend.",
          duration: 6000,
          position: "top-center",
        });
      }, 14000);

      // Popup 4: Weather Update
      t4 = setTimeout(() => {
        toast.info("Weather Advisory", {
          description: "Heavy rainfall expected to continue for next 2 hours.",
          duration: 6000,
          position: "top-center",
        });
      }, 20000);
    };

    // Run once initially, then loop every 30 minutes
    showToasts();
    const cycleInterval = setInterval(showToasts, 1800000);

    return () => {
      clearInterval(cycleInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);
  const {
    simulatedSensors,
    rain,
    setRain,
    soil,
    setSoil,
    river,
    setRiver,
    isLiveOsiris,
    toggleOsiris,
  } = useSimulation();
  const { isConnected } = useFloodWebsocket();

  const severity = overallSeverity(simulatedSensors);
  const isEmergency = severity === "danger" || severity === "warning";

  return (
    <AuthGuard requiredRole="responder">
      <main className="relative h-screen w-screen overflow-hidden bg-slate-950 text-slate-50 font-sans select-none">
        {/* BASE LAYER: FULLSCREEN TACTICAL MAP */}
        <div className="absolute inset-0 z-0">
          <FloodMap
            sensors={simulatedSensors}
            blockedRoutes={[
              {
                id: "1",
                lat: 30.738,
                lng: 78.595,
                title: "Fallen Tree on River Road",
              },
            ]}
            onSensorClick={(s) => {
              setSelectedSensor(s);
              setIsRiskOpen(true);
            }}
            showUserLocation={true}
          />
        </div>

        {/* VIGNETTE OVERLAY */}
        <div className="absolute inset-0 z-10 pointer-events-none bg-radial-gradient from-transparent via-slate-950/20 to-slate-950/90" />

        {/* EXTREME LEFT APP SIDEBAR */}
        <AppSidebar
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          isExpanded={isSidebarExpanded}
          setIsExpanded={setIsSidebarExpanded}
        />

        {/* SLIDING PANELS */}
        <div
          className={cn(
            "absolute top-16 bottom-14 sm:bottom-16 left-0 w-full sm:w-[420px] z-[35] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activePanel === "chat"
              ? "translate-x-0 shadow-2xl opacity-100 pointer-events-auto"
              : "-translate-x-full opacity-0 pointer-events-none",
          )}
        >
          <CitizenSafetyChat isOpen={activePanel === "chat"} onClose={() => setActivePanel(null)} />
        </div>

        <div
          className={cn(
            "absolute top-16 bottom-14 sm:bottom-16 left-0 w-full sm:w-[420px] z-[35] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activePanel === "shelters"
              ? "translate-x-0 shadow-2xl opacity-100 pointer-events-auto"
              : "-translate-x-full opacity-0 pointer-events-none",
          )}
        >
          <SheltersPanel isOpen={activePanel === "shelters"} onClose={() => setActivePanel(null)} />
        </div>

        <div
          className={cn(
            "absolute top-16 bottom-14 sm:bottom-16 left-0 w-full sm:w-[420px] z-[35] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activePanel === "incident"
              ? "translate-x-0 shadow-2xl opacity-100 pointer-events-auto"
              : "-translate-x-full opacity-0 pointer-events-none",
          )}
        >
          <IncidentPanel isOpen={activePanel === "incident"} onClose={() => setActivePanel(null)} />
        </div>

        <div
          className={cn(
            "absolute top-16 bottom-14 sm:bottom-16 left-0 w-full sm:w-[420px] z-[35] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activePanel === "report"
              ? "translate-x-0 shadow-2xl opacity-100 pointer-events-auto"
              : "-translate-x-full opacity-0 pointer-events-none",
          )}
        >
          <ReportPanel isOpen={activePanel === "report"} onClose={() => setActivePanel(null)} />
        </div>

        <div
          className={cn(
            "absolute top-16 bottom-14 sm:bottom-16 left-0 w-full sm:w-[420px] z-[35] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            activePanel === "whatif"
              ? "translate-x-0 shadow-2xl opacity-100 pointer-events-auto"
              : "-translate-x-full opacity-0 pointer-events-none",
          )}
        >
          <WhatIfSimulator onClose={() => setActivePanel(null)} />
        </div>

        {/* TOP HEADER BAR */}
        <header className="absolute top-0 left-0 right-0 h-16 z-50 bg-[#0E1626]/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-2.5 sm:px-6 pointer-events-auto">
          <div className="flex items-center h-full min-w-0">
            <div className="h-16 w-auto shrink-0 flex items-center justify-center border-r border-white/5 pr-2 sm:pr-4">
              <img
                src="/HillShield.png"
                alt="HillShield Logo"
                className="h-9 sm:h-12 w-auto object-contain"
              />
            </div>

            <div className="pl-2 sm:pl-4 flex items-center gap-1.5 sm:gap-4 min-w-0">
              <h1 className="text-xs sm:text-sm font-bold text-orange-500 tracking-wide uppercase font-serif whitespace-nowrap">
                <span className="hidden sm:inline">HILLSHIELD: </span>
                <span>RESPONDER</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* OSIRIS Live Toggle */}
            <button
              onClick={toggleOsiris}
              className={cn(
                "px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-colors text-white text-[9px] sm:text-[10px] font-mono tracking-wider font-bold uppercase flex items-center gap-1 sm:gap-1.5 border focus:outline-none shrink-0",
                isLiveOsiris
                  ? "bg-indigo-600/90 hover:bg-indigo-500 border-indigo-400 shadow-[0_0_12px_rgba(79,70,229,0.6)]"
                  : "bg-slate-800 hover:bg-slate-700 border-slate-600",
              )}
              title={
                isLiveOsiris
                  ? "OSIRIS Satellite Telemetry: LIVE"
                  : "OSIRIS Satellite Telemetry: OFF"
              }
            >
              <CloudRain className="size-3" />
              <span className="hidden xs:inline">OSIRIS: </span>
              {isLiveOsiris ? "LIVE" : "OFF"}
            </button>

            {/* SOS Button */}
            <button
              onClick={() => setIsSosOpen(!isSosOpen)}
              className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-500 transition-colors text-white text-[9px] sm:text-[10px] font-mono tracking-widest font-bold uppercase flex items-center gap-1 sm:gap-1.5 shadow-[0_0_12px_rgba(225,29,72,0.6)] border border-rose-400 focus:outline-none shrink-0"
            >
              <Phone className="size-3 hidden sm:block" />
              SOS
            </button>

            {/* Connection Uplink */}
            <div
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-1 rounded bg-white/5 border border-white/5 shrink-0"
              title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
            >
              <Radio
                className={cn(
                  "size-3 sm:size-3.5",
                  isConnected ? "text-emerald-400" : "text-rose-500",
                )}
              />
              <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-slate-300">
                <span className="hidden md:inline">Uplink: </span>
                {isConnected ? (
                  <span className="text-emerald-400 font-bold hidden xs:inline">SECURE</span>
                ) : (
                  <span className="text-rose-500 font-bold animate-pulse hidden xs:inline">
                    OFFLINE
                  </span>
                )}
              </span>
            </div>

            <div className="w-px h-4 bg-white/10 hidden md:block" />

            <div className="hidden md:flex items-center gap-2">
              <Activity className="size-4 text-neon-blue" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                Sensors: <span className="text-neon-blue font-bold">14</span>
              </span>
            </div>

            <div className="w-px h-6 bg-white/10 hidden md:block" />

            {/* Alerts Notification */}
            <button
              onClick={() => setIsAlertsOpen(!isAlertsOpen)}
              className="relative flex items-center justify-center p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors text-slate-300 shrink-0"
              aria-label="Alerts"
            >
              <Bell className="size-4 sm:size-5" />
              {isEmergency && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 size-2 sm:size-2.5 rounded-full bg-rose-500 ring-2 ring-[#0E1626] animate-pulse" />
              )}
            </button>

            {/* User Account */}
            <div className="relative shrink-0">
              <button
                onClick={() => setIsAccountOpen(!isAccountOpen)}
                className="flex items-center justify-center p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors border border-white/10 bg-slate-900 shadow-inner text-slate-300 shrink-0"
                aria-label="User Account"
              >
                <User className="size-4 sm:size-5" />
              </button>

              {/* Account Dropdown */}
              {isAccountOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsAccountOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-white/10 bg-[#0E1626] shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-white/5 bg-white/5">
                      <p className="text-sm font-medium text-white">{userName}</p>
                      <p className="text-xs text-slate-400">HQ Authorised User</p>
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
                    </div>
                    <div className="p-1 border-t border-white/5">
                      <button
                        onClick={() => {
                          clearSession();
                          window.location.replace("/login");
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 rounded-lg flex items-center gap-2 transition-colors"
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

        {/* Floating Active Alerts Window */}
        {isAlertsOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsAlertsOpen(false)} />
            <div className="absolute top-20 right-4 sm:right-6 z-40 pointer-events-auto glass-panel w-[calc(100vw-2rem)] sm:w-[420px] max-h-[80vh] sm:max-h-[600px] flex flex-col rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 p-4 sm:p-6">
              <AlertsFeed />
            </div>
          </>
        )}

        {/* Floating Risk Details Window */}
        {isRiskOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsRiskOpen(false)} />
            <div className="absolute top-20 right-4 sm:right-[280px] z-40 pointer-events-auto glass-panel w-[calc(100vw-2rem)] sm:w-[420px] max-h-[80vh] overflow-y-auto flex flex-col rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 p-4 sm:p-6">
              <RiskDetails
                rain={rain}
                soil={soil}
                river={river}
                severity={severity}
                selectedSensor={selectedSensor}
              />
            </div>
          </>
        )}

        {/* Floating SOS Details Window */}
        {isSosOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsSosOpen(false)} />
            <div className="absolute top-20 right-4 sm:right-[350px] z-40 pointer-events-auto glass-panel w-[calc(100vw-2rem)] max-w-[320px] max-h-[80vh] overflow-y-auto flex flex-col rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200 p-4 sm:p-6">
              <SosDetails />
            </div>
          </>
        )}

        {/* MAP LEGEND (BOTTOM RIGHT) */}
        <div className="hidden md:flex absolute bottom-20 right-6 z-30 pointer-events-auto glass-panel px-4 sm:px-5 py-3 sm:py-4 rounded-xl shadow-xl border border-white/10 flex-col gap-3 sm:gap-4 max-w-[calc(100vw-6rem)]">
          <h4 className="text-[10px] font-mono tracking-wider text-slate-400 uppercase border-b border-white/5 pb-2">
            Tactical Legend
          </h4>

          <div className="grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-3 sm:gap-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                Routes & Paths
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-4 h-1 bg-emerald-500/80 rounded-full" />{" "}
                <span className="min-w-[60px]">Clear</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-4 h-1 bg-amber-500/80 rounded-full" />{" "}
                <span className="min-w-[60px]">Congested</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <div className="w-4 h-1 bg-rose-500/80 rounded-full border-t border-dashed border-rose-300" />{" "}
                <span className="min-w-[60px]">Blocked</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">
                Map Nodes
              </span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-3 bg-white/20 p-0.5 rounded-sm border border-slate-300"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>{" "}
                <span>Shelter (House)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-3 rounded-full bg-white/10 border border-slate-300" />{" "}
                <span>Sensor (Circle)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-3 rounded-full bg-amber-500/30 border border-amber-500/50 animate-pulse" />{" "}
                <span>Alert Hotspot</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-3 rounded-full bg-rose-500/30 border border-rose-500/50 animate-pulse" />{" "}
                <span>Danger Hotspot</span>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <footer className="absolute bottom-0 left-0 right-0 h-14 sm:h-16 z-[55] bg-slate-950/98 backdrop-blur-xl border-t border-white/5 px-4 sm:px-6 lg:px-12 flex items-center justify-between pointer-events-auto shadow-[0_-4px_24px_rgba(0,0,0,0.5)] safe-bottom">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-8 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase text-slate-500">
            <span>&copy; {new Date().getFullYear()} HILLSHIELD SYSTEMS</span>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Privacy Protocol
            </a>
            <a href="#" className="hover:text-slate-300 transition-colors">
              Terms of Access
            </a>
          </div>

          <div className="text-[10px] font-mono tracking-wider text-slate-500 flex items-center">
            <span className="flex items-center gap-1.5 text-slate-400 text-center">
              Created By {" "}
              <strong className="text-orange-500 font-bold tracking-widest">Codex Gigas</strong>
            </span>
          </div>
        </footer>
      </main>
    </AuthGuard>
  );
}
