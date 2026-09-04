import { Phone, ShieldAlert, Activity, Radio, Wrench, AlertTriangle, Ambulance } from "lucide-react"

export function SosDetails({ userType = "responder" }: { userType?: "resident" | "responder" }) {
  if (userType === "resident") {
    return (
      <div className="flex flex-col gap-6" aria-label="Civilian Emergency Contacts">
        <div className="flex items-center gap-2 border-b border-white/5 pb-4">
          <div className="size-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
            <Phone className="size-4 text-rose-500" />
          </div>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-rose-500">Emergency SOS</h2>
        </div>

        <div className="flex flex-col gap-3">
          <a href="tel:108" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
                <Ambulance className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Ambulance</span>
                <span className="text-[10px] text-slate-400">Medical Emergency</span>
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-emerald-400 tracking-widest">108</span>
          </a>

          <a href="tel:100" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                <ShieldAlert className="size-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">Police</span>
                <span className="text-[10px] text-slate-400">Local Law Enforcement</span>
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-blue-400 tracking-widest">100</span>
          </a>

          <a href="tel:1078" className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30 transition-colors">
                <Activity className="size-4 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-rose-400">HillShield Rescue Center</span>
                <span className="text-[10px] text-rose-400/80">Critical Flood Evacuation Only</span>
              </div>
            </div>
            <span className="text-lg font-mono font-bold text-rose-400 tracking-widest">1078</span>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6" aria-label="Emergency Contacts">
      <div className="flex items-center gap-2 border-b border-white/5 pb-4">
        <div className="size-8 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
          <Phone className="size-4 text-rose-500" />
        </div>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-rose-500">Tactical SOS</h2>
      </div>

      <div className="flex flex-col gap-3">
        {/* Sector Command / HQ Operations */}
        <a href="tel:0001" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
              <Radio className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Sector Command / HQ</span>
              <span className="text-[10px] text-slate-400">Operations & Backup Routing</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-blue-400 tracking-widest">COM</span>
        </a>

        {/* Medevac / Air Extraction */}
        <a href="tel:0002" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/30 transition-colors">
              <Activity className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Medevac / Air Rescue</span>
              <span className="text-[10px] text-slate-400">Emergency Heli-Extraction</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-emerald-400 tracking-widest">MED</span>
        </a>

        {/* Heavy Engineering */}
        <a href="tel:0003" className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 group-hover:bg-amber-500/30 transition-colors">
              <Wrench className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Heavy Engineering</span>
              <span className="text-[10px] text-slate-400">Debris Clearing Unit</span>
            </div>
          </div>
          <span className="text-lg font-mono font-bold text-amber-400 tracking-widest">ENG</span>
        </a>

        {/* Broadcast SOS */}
        <button onClick={() => alert('SOS broadcast to all local units.')} className="w-full flex items-center justify-between p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-colors group">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 group-hover:bg-rose-500/30 transition-colors">
              <AlertTriangle className="size-4 animate-pulse" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-xs font-bold text-rose-400">BROADCAST SOS</span>
              <span className="text-[10px] text-rose-400/70">Alert all units in 5km radius</span>
            </div>
          </div>
        </button>
      </div>

      <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20">
        <p className="text-[10px] text-rose-300/80 leading-relaxed text-center uppercase tracking-wider">
          Do not use unless your unit is in immediate danger. GPS coordinates will be attached automatically.
        </p>
      </div>
    </div>
  )
}
