// components/IncidentBoard.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Zap,
  X,
} from "lucide-react";

const API_BASE = "http://localhost:8000";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Incident {
  id: string;
  title: string;
  location: string;
  priority: string;
  status: ColumnKey;
  reported_by: string | null;
  timestamp: string;
}

type ColumnKey = "detected" | "acknowledged" | "evacuating" | "completed";

interface Column {
  key: ColumnKey;
  label: string;
  icon: React.ReactNode;
}

// ─── Column Config ───────────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  { key: "detected", label: "Detected", icon: <Zap className="h-4 w-4" /> },
  { key: "acknowledged", label: "Rescuers Dispatched", icon: <Truck className="h-4 w-4" /> },
  { key: "evacuating", label: "Evacuation in Progress", icon: <AlertTriangle className="h-4 w-4" /> },
  { key: "completed", label: "Completed", icon: <CheckCircle2 className="h-4 w-4" /> },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { SeverityBadge } from "@/components/severity-badge"
import { Severity } from "@/lib/flood-data"

function priorityToSeverity(priority: string): Severity {
  switch (priority?.toLowerCase()) {
    case "critical": return "danger";
    case "high": return "warning";
    case "medium": return "watch";
    default: return "safe";
  }
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function emptyBoard(): Record<ColumnKey, Incident[]> {
  return { detected: [], acknowledged: [], evacuating: [], completed: [] };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IncidentPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [incidents, setIncidents] = useState<Record<ColumnKey, Incident[]>>(emptyBoard());
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/incidents`);
      if (!response.ok) throw new Error("Failed to load incidents");
      const data: Incident[] = await response.json();

      const board = emptyBoard();
      for (const incident of data) {
        (board[incident.status] ?? board.detected).push(incident);
      }
      setIncidents(board);
      setLoadError(null);
    } catch (err) {
      console.error("Failed to fetch incidents", err);
      setLoadError("Could not reach the incidents server. Is the backend running?");
    }
  };

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 2000);
    return () => clearInterval(interval);
  }, []);

  const moveIncident = (incident: Incident, from: ColumnKey, to: ColumnKey) => {
    setIncidents((prev) => ({
      ...prev,
      [from]: prev[from].filter((i) => i.id !== incident.id),
      [to]: [{ ...incident, status: to }, ...prev[to]],
    }));
  };

  const transition = async (incident: Incident, from: ColumnKey, to: ColumnKey, endpoint: string) => {
    // Update instantly, then persist — the next poll reconciles if this fails.
    moveIncident(incident, from, to);
    try {
      const res = await fetch(`${API_BASE}/api/incidents/${incident.id}/${endpoint}`, { method: "POST" });
      if (!res.ok) throw new Error(`Failed to ${endpoint} incident`);
    } catch (err) {
      console.error(err);
      setLoadError(`Could not update incident ${incident.id}. It will re-sync shortly.`);
    }
  };

  const acknowledgeIncident = (incident: Incident) => transition(incident, "detected", "acknowledged", "acknowledge");
  const startEvacuation = (incident: Incident) => transition(incident, "acknowledged", "evacuating", "start-evacuation");
  const completeIncident = (incident: Incident) => transition(incident, "evacuating", "completed", "complete");

  return (
    <div className="flex h-full w-[400px] flex-col overflow-hidden bg-[#0a101d] border-r border-white/5  shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(94,106,210,0.15)]">
            <AlertTriangle className="size-4 text-[#5E6AD2]" />
          </div>
          <div>
            <h2 className="text-lg font-medium text-slate-200">
              Incident Command
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] linear-label text-[#5E6AD2]">
            <span className="inline-block size-1.5 rounded-full bg-[#5E6AD2] animate-pulse shadow-[0_0_8px_rgba(94,106,210,0.8)]" />
            Live
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 text-slate-400 transition-colors">
            <X className="size-5" />
          </button>
        </div>
      </div>

      {loadError && (
        <p className="mx-6 mb-2 text-[11px] text-rose-400">{loadError}</p>
      )}

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 gap-6 overflow-y-auto no-scrollbar flex-1 p-6 pt-2 pb-6">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="flex flex-col gap-3"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#5E6AD2] opacity-80">{col.icon}</span>
                <span className="text-[13px] font-semibold text-slate-200 uppercase tracking-wide">
                  {col.label}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] px-2 py-0 border-white/10 bg-white/5 text-[#8A8F98]">
                {incidents[col.key].length}
              </Badge>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[50px]">
              {incidents[col.key].length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 text-[#8A8F98]/50 border border-white/5 bg-white/[0.02] rounded-2xl">
                  <CheckCircle2 className="size-5 mb-2 opacity-50" />
                  <p className="linear-label">Clear</p>
                </div>
              ) : (
                incidents[col.key].map((incident) => {
                  return (
                    <div
                      key={incident.id}
                      className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 transition-colors hover:bg-white/[0.05]"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-[15px] font-medium text-slate-200 leading-tight">
                          {incident.title}
                        </h3>
                        <SeverityBadge severity={priorityToSeverity(incident.priority)} showDot={false} className="scale-90 origin-right border border-white/5 bg-white/5" />
                      </div>

                      {/* Meta Row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] linear-label text-slate-500 mb-4">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3" />
                          {incident.location?.split(",")[0]}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {formatTime(incident.timestamp)}
                        </span>
                      </div>

                      {/* Status Action */}
                      {col.key === "detected" && (
                        <button
                          onClick={() => acknowledgeIncident(incident)}
                          className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg border border-orange-500/50 tracking-wide mt-2 transition-all shadow-[0_0_10px_rgba(249,115,22,0.2)] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        >
                          <AlertTriangle className="size-3" />
                          ACKNOWLEDGE & DISPATCH
                        </button>
                      )}

                      {col.key === "acknowledged" && (
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-medium bg-[#5E6AD2]/10 text-[#5E6AD2] rounded-lg border border-[#5E6AD2]/20 tracking-wide">
                            <Truck className="size-3" />
                            Rescuers dispatched
                          </div>
                          <button
                            onClick={() => startEvacuation(incident)}
                            className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg border border-emerald-500/30 tracking-wide transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          >
                            <AlertTriangle className="size-3" />
                            EVACUATION STARTED
                          </button>
                        </div>
                      )}

                      {col.key === "evacuating" && (
                        <div className="flex flex-col gap-2 mt-2">
                          <div className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-medium bg-[#5E6AD2]/10 text-[#5E6AD2] rounded-lg border border-[#5E6AD2]/20 tracking-wide">
                            <CheckCircle2 className="size-3" />
                            Evacuation in progress
                          </div>
                          <button
                            onClick={() => completeIncident(incident)}
                            className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg border border-emerald-500/30 tracking-wide transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                          >
                            <CheckCircle2 className="size-3" />
                            EVACUATION DONE
                          </button>
                        </div>
                      )}

                      {col.key === "completed" && (
                        <div className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20 tracking-wide mt-2">
                          <CheckCircle2 className="size-3" />
                          RESOLVED
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
