import React, { useState, useEffect } from "react";
import { X, Send, Helicopter, CheckCircle, Clock, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const API_BASE = "http://localhost:8000";

interface Escalation {
  id: string;
  resource_type: string;
  priority: string;
  location: string;
  description: string;
  status: string;
  timestamp: string;
}

const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-rose-500",
  Urgent: "bg-orange-500",
  Standard: "bg-[#5E6AD2]",
};

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
}

export default function ReportPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState("");
  const [priority, setPriority] = useState("Standard");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fetchEscalations = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/escalations`);
      if (!res.ok) throw new Error("Failed to load escalations");
      const data = await res.json();
      setEscalations(data);
      setLoadError(null);
    } catch (err) {
      console.error("Failed to fetch escalations", err);
      setLoadError("Could not reach the HQ server. Is the backend running?");
    }
  };

  useEffect(() => {
    fetchEscalations();
    const interval = setInterval(fetchEscalations, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/escalations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource_type: resourceType, priority, location, description }),
      });
      if (!res.ok) throw new Error("Failed to submit escalation");
      const created: Escalation = await res.json();
      setEscalations((prev) => [created, ...prev]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setResourceType("");
        setPriority("Standard");
        setLocation("");
        setDescription("");
      }, 4000);
    } catch (err) {
      console.error(err);
      setLoadError("Could not transmit the request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full w-[400px] flex-col overflow-hidden bg-[#0a101d] border-r border-white/5 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]">
            <Helicopter className="size-4 text-rose-500" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-200">Resource Escalation</h2>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
          <X className="size-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Active Escalations List */}
        <div className="px-6 py-6 border-b border-white/5 bg-white/[0.01]">
          <h3 className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-4">Active HQ Escalations</h3>
          {loadError && (
            <p className="text-xs text-rose-400 mb-4">{loadError}</p>
          )}
          <div className="space-y-3">
            {escalations.length === 0 && !loadError ? (
              <p className="text-xs text-slate-500 py-2">No active escalations.</p>
            ) : (
              escalations.map((req) => (
                <div key={req.id} className="bg-[#121826] border border-white/5 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-sm font-medium text-slate-200">{req.resource_type}</h4>
                    <div className={cn("px-2 py-0.5 rounded text-[9px] font-bold tracking-widest text-white", PRIORITY_BADGE[req.priority] ?? "bg-slate-500")}>
                      {req.priority.toUpperCase()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
                    <span className="font-medium text-orange-400/80">{req.location}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{req.description}</p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-white/5">
                    <div className="flex items-center gap-1"><Clock className="size-3"/> {timeAgo(req.timestamp)}</div>
                    <div className={cn("flex items-center gap-1 font-bold", req.status === "DISPATCHED" ? "text-emerald-400" : "text-amber-400")}>
                      {req.status === "DISPATCHED" ? <Helicopter className="size-3"/> : <ShieldAlert className="size-3"/>} {req.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Escalation Form */}
        <div className="px-6 py-6">
          <h3 className="text-[10px] font-mono tracking-widest uppercase text-slate-500 mb-6">Request Higher Authority Support</h3>

          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <CheckCircle className="size-12 text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium text-emerald-400 mb-2">Request Transmitted</h3>
              <p className="text-sm text-emerald-400/70 text-center px-6">HQ has received your escalation. Dispatch ETA will be updated shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Support Required</label>
                <div className="relative">
                  <select
                    required
                    value={resourceType}
                    onChange={(e) => setResourceType(e.target.value)}
                    className="w-full bg-[#121826] border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 appearance-none"
                  >
                    <option value="" disabled>Select resource...</option>
                    <option value="Helicopter Evacuation">Helicopter Evacuation</option>
                    <option value="Medical Airdrop">Medical Supplies Airdrop</option>
                    <option value="Heavy Machinery">Heavy Machinery (Excavator)</option>
                    <option value="Boat Rescue Team">NDRF Boat Rescue Team</option>
                    <option value="Additional Manpower">Additional Manpower Platoon</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Priority Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Standard", "Urgent", "Critical"].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setPriority(level)}
                      className={cn(
                        "py-2 rounded-lg text-[11px] font-bold tracking-wider uppercase border transition-all",
                        priority === level
                          ? level === "Critical" ? "bg-rose-500/20 border-rose-500 text-rose-400" :
                            level === "Urgent" ? "bg-orange-500/20 border-orange-500 text-orange-400" :
                            "bg-[#5E6AD2]/20 border-[#5E6AD2] text-[#5E6AD2]"
                          : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                      )}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Exact Coordinates / Location</label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. 31.52, 76.99 (Sector 4)"
                  className="w-full bg-[#121826] border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-mono tracking-widest uppercase text-slate-400">Situation Assessment</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe why local resources are insufficient..."
                  rows={4}
                  className="w-full bg-[#121826] border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(225,29,72,0.4)]"
              >
                {isSubmitting ? (
                  <>Transmitting to HQ...</>
                ) : (
                  <>
                    <Send className="size-4" />
                    Transmit Escalation Request
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
