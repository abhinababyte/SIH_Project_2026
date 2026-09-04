"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  Bell,
  LayoutDashboard,
  LifeBuoy,
  Map as MapIcon,
  Megaphone,
  MountainSnow,
  Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { SeverityBadge, severityColor } from "@/components/severity-badge"
import CitizenSafetyChat from "@/components/CitizenSafetyChat"
import { useFloodWebsocket } from "@/hooks/use-flood-websocket"
import { useSimulation } from "@/components/simulation-provider"
import { ALERTS } from "@/lib/flood-data"
import { Toaster } from "@/components/ui/sonner"
import { useState } from "react"

const TABS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/map", label: "Hazard Map", icon: MapIcon },
  { href: "/alerts", label: "Live Alerts", icon: Bell },
  { href: "/shelters", label: "Evacuation", icon: LifeBuoy },
  { href: "/report", label: "Report", icon: Megaphone },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { isConnected } = useFloodWebsocket()
  const { severity } = useSimulation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-dvh bg-slate-50 text-slate-900 font-sans">
      
      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden flex-col border-r border-slate-200 bg-white shadow-sm z-30 transition-all duration-300 md:flex sticky top-0 h-screen",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-md">
              <MountainSnow className="size-5" />
            </div>
            {isSidebarOpen && <span className="text-lg font-bold tracking-tight text-slate-800 whitespace-nowrap">HillShield</span>}
          </div>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
             <Menu className="size-5" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1.5 p-3 overflow-y-auto">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href
            const showBadge = href === "/alerts"
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  active 
                    ? "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 shadow-sm border border-blue-100/50" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                  !isSidebarOpen && "justify-center px-0"
                )}
                title={label}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("shrink-0 transition-colors", isSidebarOpen ? "size-4.5" : "size-5", active ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                  {isSidebarOpen && <span>{label}</span>}
                </div>
                {showBadge && isSidebarOpen && (
                  <span className="ml-auto flex size-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                    {ALERTS.length}
                  </span>
                )}
                {showBadge && !isSidebarOpen && (
                  <span className="absolute top-2 right-2 flex size-2.5 rounded-full bg-red-500 shadow-sm" />
                )}
              </Link>
            )
          })}
        </nav>
        
        <div className="p-4 border-t border-slate-100">
          <div className={cn("flex items-center gap-2", isSidebarOpen ? "px-2" : "justify-center")}>
             <span className={cn("relative flex size-2.5")} title={isConnected ? "WebSocket Connected" : "WebSocket Disconnected"}>
                {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                <span className={cn("relative inline-flex rounded-full size-2.5", isConnected ? "bg-emerald-500" : "bg-red-500")}></span>
             </span>
             {isSidebarOpen && <span className="text-xs font-medium text-slate-500">Live API Link</span>}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:hidden z-20">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 text-white shadow-md">
              <MountainSnow className="size-5" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-800">HillShield</span>
          </div>
          <div className="flex items-center gap-3">
            <SeverityBadge severity={severity} />
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-slate-600">
              <Menu className="size-6" />
            </button>
          </div>
        </header>

        {/* Mobile Nav Dropdown */}
        {isMobileMenuOpen && (
          <nav className="border-b border-slate-200 bg-white p-4 shadow-lg md:hidden z-20 animate-in slide-in-from-top-2">
            <div className="space-y-1">
               {TABS.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                    pathname === href ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon className="size-5" />
                  {label}
                </Link>
              ))}
            </div>
          </nav>
        )}

        {/* Desktop Header */}
        <header className="hidden h-16 items-center justify-between border-b border-slate-200 bg-white/50 backdrop-blur px-8 md:flex z-10 sticky top-0">
          <h2 className="text-xl font-bold text-slate-800 capitalize">
             {TABS.find(t => t.href === pathname)?.label || "Dashboard"}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-500 font-medium">District Status:</span>
            <SeverityBadge severity={severity} />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </main>
      </div>

      {/* Floating Citizen Chat Widget */}
      <CitizenSafetyChat />
      
      <Toaster position="top-right" richColors />
    </div>
  )
}
