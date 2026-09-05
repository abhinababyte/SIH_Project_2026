"use client";

import { useState, useEffect } from "react";
import { User, Radio, Eye, EyeOff, ArrowRight, ShieldCheck, ChevronDown, Activity, AlertTriangle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useSimulation } from "@/components/simulation-provider";

const FloodMap = dynamic(() => import("@/components/flood-map"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-slate-950 flex items-center justify-center text-slate-500 font-mono">INITIALIZING SECURE MAP...</div>
});

export default function LoginPage() {
  const router = useRouter();
  const { simulatedSensors } = useSimulation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("register");
  const [role, setRole] = useState<"resident" | "responder">("responder");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    localStorage.removeItem("hillshield_user_name");
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    
    const displayName = name.trim() || "Authorised User";

    try {
      const endpoint = activeTab === "register" ? "/api/auth/register" : "/api/auth/login";
      const payload = activeTab === "register" 
        ? { 
            full_name: displayName, 
            email: email.trim().toLowerCase(), 
            phone_number: mobileNumber.trim(), 
            password: password, 
            role: role 
          }
        : { 
            identifier: identifier.trim().toLowerCase(), 
            password: password 
          };

      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || "Authentication failed. Please check your credentials.");
        setIsLoading(false);
        return; // Stop navigation!
      }

      // Success
      localStorage.setItem("hillshield_user_name", data.full_name || (data.user && data.user.full_name) || displayName);
      
      const destinationRole = data.role || (data.user && data.user.role) || role;
      
      setIsLoading(false);
      if (destinationRole === "responder") {
        router.push("/responder");
      } else {
        router.push("/resident");
      }
    } catch (err) {
      setError("Cannot connect to the backend server.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-orange-500/30 flex flex-col relative overflow-x-hidden">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 h-16 bg-slate-950/80 backdrop-blur-md border-b border-white/5 flex flex-col justify-center">
        <div className="px-6 flex items-center justify-between w-full h-full">
          <div className="flex items-center h-full">
            <div className="h-12 w-auto shrink-0 flex items-center justify-center">
                <img src="/HillShield.png" alt="HillShield Logo" className="h-full w-auto object-contain" />
              </div>
            <div className="pl-4">
              <h1 className="text-sm font-bold text-white tracking-wide">HillShield</h1>
              <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase hidden sm:block">Natural Disaster Detection Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono tracking-widest uppercase text-slate-400">
            <span className="hidden sm:inline">District Helpline: <strong className="text-white">1077 / 112</strong></span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 font-bold">SECURE UPLINK</span>
            </div>
          </div>
        </div>
      </header>

      {/* LIVE FEED TICKER */}
      <div className="h-8 bg-rose-500/10 border-b border-rose-500/20 flex items-center overflow-hidden relative z-40">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-[#0f0a10] z-20 flex items-center pl-6 pr-4 shadow-[10px_0_15px_-3px_rgba(15,10,16,1)] border-r border-rose-500/20">
          <span className="text-[10px] font-mono font-bold text-rose-500 tracking-wider">LIVE FEED</span>
        </div>
        <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap text-[10px] font-mono tracking-widest pl-40 text-slate-300 relative z-10">
          <span className="text-amber-400">TEESTA</span> - RISE RATE 0.8M / HR [MONITOR] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span className="text-emerald-400">BEAS</span> - ACCESS ROUTE 04 CLEAR [STABLE] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span className="text-amber-400">CHAMOLI</span> - SOIL SATURATION 85% [ELEVATED RISK] &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span className="text-rose-500">KEDARNATH</span> - FLASH FLOOD WARNING ISSUED [EVACUATE]
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative flex flex-col lg:flex-row min-h-[800px]">
        
        {/* TRUE BACKGROUND MAP */}
        <div className="absolute inset-0 z-0">
          {/* Overlay to darken map behind the text */}
          <div className="absolute inset-0 bg-slate-950/60 z-10 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/70 to-transparent z-10 pointer-events-none w-2/3" />
          
          <div className="h-full w-full grayscale-[0.3] pointer-events-none">
            <FloodMap sensors={simulatedSensors} />
          </div>
        </div>

        {/* LEFT SIDE: Hero Content */}
        <div className="flex-1 p-8 lg:p-16 xl:p-24 relative z-20 flex flex-col justify-center pointer-events-none">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-12">
              <div className="h-px w-8 bg-orange-500" />
              <span className="text-xs font-mono font-bold tracking-widest text-orange-500 uppercase drop-shadow-md">
                Flash Flood Readiness Network &middot; India
              </span>
            </div>

            <h1 className="text-6xl xl:text-8xl font-extrabold text-white tracking-tight leading-[1.05] mb-6 font-playfair drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
              Stay ahead of <br />
              <span className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]">the surge.</span>
            </h1>

            <p className="text-lg text-slate-300 max-w-md leading-relaxed mb-16 font-medium drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              Empowering citizens and first responders with real-time flood intelligence, safe evacuation routing, and instant crisis coordination.
            </p>

            {/* Bottom Stats Floating over map */}
            <div className="flex flex-wrap items-center gap-8 mt-8 border-t border-white/20 pt-8 max-w-lg bg-slate-950/40 p-6 rounded-2xl backdrop-blur-sm border-l">
              <div>
                <div className="text-3xl font-bold text-white mb-1 drop-shadow-md">05</div>
                <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 drop-shadow-md">Hill Sectors<br/>Connected</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-1 drop-shadow-md">24/7</div>
                <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400 drop-shadow-md">Warning Channel<br/>Watching</div>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <ShieldCheck className="size-6 text-emerald-500 drop-shadow-md" />
                <div className="text-[9px] font-mono tracking-widest uppercase text-emerald-400 font-bold drop-shadow-md">Encrypted Local Access<br/>For Response Teams</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: Auth Form */}
        <div className="w-full lg:w-[500px] xl:w-[600px] flex items-center justify-center p-6 lg:p-12 relative z-20">
          <div className="w-full bg-slate-950/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl p-8 lg:p-10">
            <div className="flex items-center gap-2 mb-8">
              <span className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Secure Access Node</span>
              <div className="ml-auto flex items-center gap-1.5">
                <Lock className="size-3 text-emerald-500" />
                <span className="text-[9px] font-mono tracking-widest uppercase text-emerald-500">Encrypted</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-8">Enter the network</h2>

            <div className="flex items-center border-b border-white/10 mb-8">
              <button onClick={() => setActiveTab("login")} className={cn("flex-1 pb-4 text-sm font-semibold transition-colors relative", activeTab === "login" ? "text-white" : "text-slate-500 hover:text-slate-300")}>
                Log In
                {activeTab === "login" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              </button>
              <button onClick={() => setActiveTab("register")} className={cn("flex-1 pb-4 text-sm font-semibold transition-colors relative", activeTab === "register" ? "text-white" : "text-slate-500 hover:text-slate-300")}>
                Create profile
                {activeTab === "register" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500" />}
              </button>
            </div>

              <form onSubmit={handleAuth} className="flex flex-col gap-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="size-4 shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}
              {activeTab === "register" && (
                <>
                  <div className="flex flex-col gap-2 mb-2">
                    <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Access Role</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button type="button" onClick={() => setRole("resident")} className={cn("flex flex-col gap-2 p-4 rounded-xl border text-left transition-all relative overflow-hidden", role === "resident" ? "bg-white/5 border-orange-500/50" : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/5")}>
                        <div className="flex items-center gap-2">
                          <User className={cn("size-4", role === "resident" ? "text-orange-500" : "text-slate-400")} />
                          <span className="text-sm font-semibold text-white">Resident</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Evacuation alerts, shelter routes, and local river updates.</p>
                      </button>
                      
                      <button type="button" onClick={() => setRole("responder")} className={cn("flex flex-col gap-2 p-4 rounded-xl border text-left transition-all relative overflow-hidden", role === "responder" ? "bg-white/5 border-orange-500/50" : "bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/5")}>
                        <div className="flex items-center gap-2">
                          <Radio className={cn("size-4", role === "responder" ? "text-orange-500" : "text-slate-400")} />
                          <span className="text-sm font-semibold text-white">First Responder</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-relaxed">Rainfall radar, dam discharge, and village broadcast controls.</p>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Full Name</label>
                    <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#121826]/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600" placeholder="Enter your full name" />
                  </div>
                </>
              )}

              {activeTab === "register" ? (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Email Address</label>
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#121826]/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600" placeholder="name@example.com" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Mobile Number</label>
                    <input type="tel" required value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="w-full bg-[#121826]/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600" placeholder="+91..." />
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Email Address or Mobile Number</label>
                  <input type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} className="w-full bg-[#121826]/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600" placeholder="name@example.com or +91..." />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-mono tracking-widest uppercase text-slate-500">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#121826]/50 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all placeholder:text-slate-600" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none">
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>



              <button type="submit" disabled={isLoading} className="w-full mt-4 bg-orange-600 hover:bg-orange-500 text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-between transition-colors focus:outline-none shadow-[0_0_15px_rgba(234,88,12,0.4)] disabled:opacity-70">
                <span>{isLoading ? "Authenticating..." : (activeTab === "login" ? "Access Network" : "Create secure profile")}</span>
                <ArrowRight className="size-5" />
              </button>
            </form>

          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950/95 backdrop-blur-xl border-t border-white/5 py-8 px-6 lg:px-12 relative z-40 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 md:gap-8 text-[10px] font-mono tracking-widest uppercase text-slate-500">
            <span>&copy; {new Date().getFullYear()} HillShield Systems</span>
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy Protocol</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms of Access</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Emergency Contacts</a>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Systems Nominal &middot; Ready
          </div>
        </div>
        
        <div className="text-center md:text-left text-[11px] font-mono tracking-wider text-slate-500 flex flex-col md:flex-row items-center justify-between border-t border-white/5 pt-6">
          <span className="hidden md:inline-block">Central Emergency Node: <strong className="text-white">ACTIVE</strong></span>
          <span className="flex items-center justify-center gap-1.5 text-slate-400 mt-2 md:mt-0">
            Created with <span className="text-rose-500 text-sm">♥</span> by <strong className="text-orange-500 font-bold tracking-widest">Codex Gigas</strong> for India
          </span>
        </div>
      </footer>
    </div>
  );
}

