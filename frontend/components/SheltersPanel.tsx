import React from "react";
import { X, Navigation, Users, MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SheltersPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const routes = [
    { name: "North Ridge Route", dest: "to Rasdale Community Hall", status: "Clear", color: "bg-emerald-500", text: "text-emerald-500" },
    { name: "East Church Route", dest: "to St. Mary's School Gym", status: "Congested", color: "bg-amber-500", text: "text-amber-500" },
    { name: "Riverside Route", dest: "to Valley Sports Centre", status: "Blocked", color: "bg-rose-500", text: "text-rose-500" },
  ];

  const shelters = [
    {
      name: "Rasdale Community Hall",
      address: "14 Hilltop Rd • 0.8 km away",
      status: "OPEN",
      statusColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      capacity: 145,
      max: 320,
      pct: 45,
      barColor: "bg-emerald-500",
      tags: ["Medical", "Food", "Pet-friendly"]
    },
    {
      name: "St. Mary's School Gym",
      address: "3 Church Ln • 1.6 km away",
      status: "OPEN",
      statusColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      capacity: 188,
      max: 200,
      pct: 94,
      barColor: "bg-amber-500",
      tags: ["Food", "Power"]
    },
    {
      name: "Valley Sports Centre",
      address: "88 Riverside Ave • 2.9 km away",
      status: "FULL",
      statusColor: "bg-rose-500/20 text-rose-400 border border-rose-500/30",
      capacity: 500,
      max: 500,
      pct: 100,
      barColor: "bg-rose-500",
      tags: ["Medical", "Food", "Power", "Showers"]
    }
  ];

  return (
    <div className="flex h-full w-[400px] flex-col overflow-hidden bg-[#0a101d] border-r border-white/5  shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <h2 className="text-lg font-medium text-slate-200">Shelters & Routes</h2>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <Search className="size-5" />
          </button>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-6 pt-2 gap-8">
        
        {/* Evacuation Routes */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-semibold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
            <Navigation className="size-4 text-slate-400" />
            Evacuation routes
          </h3>
          <div className="flex flex-col gap-2">
            {routes.map((r, i) => (
              <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className={cn("size-2.5 rounded-full mt-1.5 shrink-0", r.color)} />
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-slate-200 leading-tight">{r.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5">{r.dest}</span>
                  </div>
                </div>
                <span className={cn("text-[13px] font-medium", r.text)}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Nearby Shelters */}
        <div className="flex flex-col gap-4">
          <h3 className="text-[13px] font-semibold text-slate-200 flex items-center gap-2 uppercase tracking-wide">
            <Users className="size-4 text-slate-400" />
            Nearby shelters
          </h3>
          <div className="flex flex-col gap-3">
            {shelters.map((s, i) => (
              <div key={i} className="flex flex-col bg-white/[0.03] border border-white/5 rounded-2xl p-4 hover:bg-white/[0.05] transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-[15px] font-medium text-slate-200 leading-tight">{s.name}</span>
                    <span className="text-xs text-slate-500 mt-0.5">{s.address}</span>
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", s.statusColor)}>
                    {s.status}
                  </span>
                </div>
                
                <div className="flex flex-col gap-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Capacity</span>
                    <span className="text-slate-400 font-mono text-[10px]">{s.capacity}/{s.max} ({s.pct}%)</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className={cn("h-full rounded-full", s.barColor)} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.map((t, j) => (
                      <span key={j} className="text-[10px] font-medium text-slate-300 bg-white/5 px-2 py-1 rounded-md">
                        {t}
                      </span>
                    ))}
                  </div>
                  <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (s.status !== "FULL") onClose();
                      }}
                      disabled={s.status === "FULL"}
                      className={cn(
                        "flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-full transition-colors ml-2 shrink-0",
                        s.status === "FULL" 
                          ? "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
                          : "bg-slate-200 text-slate-800 hover:bg-white"
                      )}
                    >
                      <Navigation className="size-3" />
                      Directions
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

