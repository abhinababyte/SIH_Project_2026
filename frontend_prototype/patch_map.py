import re
import os

with open('app/resident/page.tsx', 'r', encoding='utf-8') as f:
    source = f.read()

# Extract top part (Header + Ticker)
# It starts at the beginning and ends right before {/* 1. HERO SECTION */}
match_top = re.search(r'^(.*?)\s*\{\/\*\ 1\.\ HERO\ SECTION\ \*\/\}', source, re.DOTALL)
top_part = match_top.group(1) if match_top else ""

# Extract bottom part (AI Button + Footer)
# It starts at {/* Persistent Ask AI Floating Button */} and goes to the end
match_bottom = re.search(r'(\{\/\*\ Persistent\ Ask\ AI\ Floating\ Button\ \*\/\}[\s\S]*)$', source)
bottom_part = match_bottom.group(1) if match_bottom else ""

# Ensure we have useSimulation in the top part imports
if 'useSimulation' not in top_part:
    top_part = top_part.replace('import { useFloodWebsocket } from "@/hooks/use-flood-websocket";',
                                'import { useFloodWebsocket } from "@/hooks/use-flood-websocket";\nimport { useSimulation } from "@/components/simulation-provider";')

# Ensure dynamic is imported
if 'import dynamic from "next/dynamic";' not in top_part:
    top_part = top_part.replace('import Link from "next/link";', 'import Link from "next/link";\nimport dynamic from "next/dynamic";')

# Inject FloodMap import
if 'const FloodMap' not in top_part:
    top_part = top_part.replace('export default function ResidentDashboard() {', '''const FloodMap = dynamic(() => import("@/components/flood-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 font-mono text-xs">INITIALIZING LIVE MAP...</div>
});\n\nexport default function ResidentLiveMap() {''')
else:
    top_part = top_part.replace('export default function ResidentDashboard() {', 'export default function ResidentLiveMap() {')


map_middle = '''
      {/* MAIN CONTENT (MAP & LEGEND) */}
      <style>{.leaflet-control-zoom { display: none !important; }}</style>
      <main className="flex-1 relative w-full h-[calc(100vh-160px)] min-h-[600px] bg-slate-950 z-0">
        <div className="absolute inset-0 z-0">
          <FloodMap sensors={simulatedSensors} onSensorClick={() => {}} />
        </div>

        {/* You are here marker (centered in screen) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-20">
          <div className="size-4 rounded-full bg-rose-500 animate-ping absolute"></div>
          <div className="size-4 rounded-full bg-rose-500 border-2 border-[#0a0f18] z-10 relative shadow-[0_0_15px_rgba(244,63,94,0.6)]"></div>
          <span className="text-[10px] font-bold text-white mt-2 bg-black/70 px-3 py-1 rounded-full backdrop-blur border border-white/10 shadow-xl">You are here</span>
        </div>

        {/* MAP LEGEND (COPIED FROM RESPONDER, MOVED TO LEFT TO AVOID AI CHAT) */}
        <div className="absolute bottom-6 left-6 z-30 pointer-events-auto bg-[#0a0f18]/90 backdrop-blur-md px-5 py-4 rounded-xl shadow-xl border border-white/10 flex flex-col gap-4 max-w-[200px]">
          <h4 className="text-[10px] font-mono tracking-wider text-slate-400 uppercase border-b border-white/5 pb-2">Tactical Legend</h4>
          
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Sensor Status</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Normal
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span> Elevated
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] animate-pulse"></span> Critical
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <span className="size-2 rounded-full bg-slate-500 border border-slate-400"></span> Offline
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500">Map Nodes</span>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3 bg-white/20 p-0.5 rounded-sm border border-slate-300"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> <span>Shelter (House)</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-3 bg-red-500/20 p-0.5 rounded-sm border border-red-500 text-red-500"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg> <span>Incident (Hazard)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
'''

with open('app/resident/map/page.tsx', 'w', encoding='utf-8') as f:
    f.write(top_part + "\n" + map_middle + "\n" + bottom_part)

print("Patch applied to app/resident/map/page.tsx")
