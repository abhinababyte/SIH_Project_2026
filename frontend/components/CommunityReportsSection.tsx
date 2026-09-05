"use client";

import React, { useEffect, useState } from "react";
import { Mountain, Droplets, AlertTriangle, Activity, ShieldAlert, User, MapPin } from "lucide-react";

const API_BASE = "http://localhost:8000";

const HAZARD_TYPES = [
  { value: "Landslide", label: "Landslide", icon: Mountain, activeClasses: "bg-rose-500/20 border-rose-500/50 text-rose-400" },
  { value: "Flood", label: "Flood", icon: Droplets, activeClasses: "bg-blue-500/20 border-blue-500/50 text-blue-400" },
  { value: "Blocked Road", label: "Blocked Road", icon: AlertTriangle, activeClasses: "bg-amber-500/20 border-amber-500/50 text-amber-400" },
  { value: "Other", label: "Other", icon: Activity, activeClasses: "bg-white/10 border-white/30 text-white" },
] as const;

const TYPE_ICON: Record<string, React.ElementType> = {
  Landslide: Mountain,
  Flood: Droplets,
  "Blocked Road": AlertTriangle,
};

const TYPE_COLOR: Record<string, string> = {
  Landslide: "text-rose-400 bg-rose-500",
  Flood: "text-blue-400 bg-blue-500",
  "Blocked Road": "text-amber-400 bg-amber-500",
};

interface Report {
  id: string;
  report_type: string;
  description: string;
  location: string | null;
  status: string;
  reported_by: string | null;
  timestamp: string;
}

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
}

export function CommunityReportsSection({ userName }: { userName?: string }) {
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hazardType, setHazardType] = useState<string>("Landslide");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reports`);
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError("Please describe the hazard.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report_type: hazardType,
          description: description.trim(),
          location: location.trim() || null,
          reported_by: userName || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit report");
      const created: Report = await res.json();
      setReports((prev) => [created, ...prev]);
      setDescription("");
      setLocation("");
      setHazardType("Landslide");
    } catch (err) {
      console.error(err);
      setError("Could not submit your report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Submit Report Form */}
      <div className="bg-[#121923] border border-white/5 rounded-3xl p-6 lg:p-8 flex flex-col">
        <h3 className="text-xl font-serif text-white mb-2">Report a Hazard</h3>
        <p className="text-xs text-slate-400 mb-6">
          Help your community navigate safely. Report blocked roads, landslides, or rising water immediately.
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 block">Hazard Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {HAZARD_TYPES.map(({ value, label, icon: Icon, activeClasses }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setHazardType(value)}
                  className={`border rounded-lg p-2 flex flex-col items-center gap-1 text-[10px] font-bold uppercase transition-colors ${
                    hazardType === value ? activeClasses : "border-white/10 bg-black/30 text-slate-400"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 block">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Near the old mill, Millbrook Rd"
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-rose-500/50"
            />
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-1 block">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details (e.g. Tree fell on main road near post office)..."
              className="w-full bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-rose-500/50 resize-none"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-slate-950 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldAlert className="size-4" />
              {isSubmitting ? "Broadcasting..." : "Broadcast Hazard Alert"}
            </button>
          </div>
        </form>
      </div>

      {/* Recent Reports List */}
      <div className="bg-[#0a0f18] border border-white/5 rounded-3xl p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-serif text-white">Recent Reports</h3>
          <span className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            Live Updates
          </span>
        </div>

        <div className="space-y-4 max-h-[520px] overflow-y-auto no-scrollbar">
          {isLoading ? (
            <p className="text-sm text-slate-500 text-center py-8">Loading reports...</p>
          ) : reports.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">No reports yet. Be the first to report a hazard.</p>
          ) : (
            reports.map((r) => {
              const Icon = TYPE_ICON[r.report_type] ?? Activity;
              const [textColor, barColor] = (TYPE_COLOR[r.report_type] ?? "text-white bg-white/50").split(" ");
              return (
                <div key={r.id} className="bg-[#121923] p-4 rounded-xl border border-white/5 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1 h-full ${barColor}`}></div>
                  <div className="flex justify-between items-start mb-2">
                    <div className={`flex items-center gap-2 font-bold text-sm ${textColor}`}>
                      <Icon className="size-4" /> {r.report_type}
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase">{timeAgo(r.timestamp)}</span>
                  </div>
                  <p className="text-slate-300 text-sm mb-3">{r.description}</p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-slate-400">
                    {r.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3" /> {r.location}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="size-3" /> {r.reported_by ? `Reported by ${r.reported_by}` : "Anonymous report"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
