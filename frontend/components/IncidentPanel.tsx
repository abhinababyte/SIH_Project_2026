// components/IncidentBoard.tsx
"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Droplets,
  MapPin,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Users,
  Zap,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Incident {
  id: string;
  title: string;
  location: string;
  severity: Severity;
  detectedAt: string;
  waterLevel: number;
  populationAffected: number;
  description: string;
}

type ColumnKey = "detected" | "acknowledged" | "evacuating";

interface Column {
  key: ColumnKey;
  label: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  bgColor: string;
  badgeVariant: "destructive" | "default" | "secondary";
}

// ─── Dummy Data ──────────────────────────────────────────────────────────────

const INITIAL_INCIDENTS: Record<ColumnKey, Incident[]> = {
  detected: [
    {
      id: "INC-001",
      title: "Flash Flood – Sunder Nagar Nullah",
      location: "Sunder Nagar, Mandi District, HP",
      severity: "danger",
      detectedAt: "2025-01-15T14:32:00Z",
      waterLevel: 4.2,
      populationAffected: 1200,
      description:
        "Sudden water surge detected. Nullah breached at 2 points. Immediate evacuation required for low-lying settlements.",
    },
    {
      id: "INC-002",
      title: "Landslide Risk – NH-21 Near Aut",
      location: "Aut, Mandi District, HP",
      severity: "warning",
      detectedAt: "2025-01-15T15:10:00Z",
      waterLevel: 1.8,
      populationAffected: 340,
      description:
        "Soil moisture sensors reporting saturation > 85%. Road blockage likely within 2 hours.",
    },
    {
      id: "INC-003",
      title: "River Swelling – Beas at Pandoh",
      location: "Pandoh Dam, Mandi District, HP",
      severity: "watch",
      detectedAt: "2025-01-15T15:45:00Z",
      waterLevel: 2.5,
      populationAffected: 80,
      description:
        "Water level rising steadily. Dam operators notified. Monitoring continues.",
    },
  ],
  acknowledged: [
    {
      id: "INC-004",
      title: "Drainage Overflow – Joginder Nagar",
      location: "Joginder Nagar, Mandi District, HP",
      severity: "warning",
      detectedAt: "2025-01-15T13:20:00Z",
      waterLevel: 3.1,
      populationAffected: 560,
      description:
        "NDRF team dispatched. Evacuation shelters activated at Government Senior Secondary School.",
    },
  ],
  evacuating: [
    {
      id: "INC-005",
      title: "Embankment Breach – Chauntra",
      location: "Chauntra, Mandi District, HP",
      severity: "danger",
      detectedAt: "2025-01-15T12:00:00Z",
      waterLevel: 5.0,
      populationAffected: 2100,
      description:
        "62% of affected population evacuated. 3 NDRF boats operational. Medical camp set up.",
    },
  ],
};

// ─── Column Config ───────────────────────────────────────────────────────────

const COLUMNS: Column[] = [
  {
    key: "detected",
    label: "Detected",
    icon: <Zap className="h-4 w-4" />,
    color: "text-red-500",
    borderColor: "border-red-500/30",
    bgColor: "bg-red-500/5",
    badgeVariant: "destructive",
  },
  {
    key: "acknowledged",
    label: "Acknowledged",
    icon: <CheckCircle2 className="h-4 w-4" />,
    color: "text-amber-500",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/5",
    badgeVariant: "default",
  },
  {
    key: "evacuating",
    label: "Evacuating",
    icon: <Truck className="h-4 w-4" />,
    color: "text-emerald-500",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/5",
    badgeVariant: "secondary",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { SeverityBadge } from "@/components/severity-badge"
import { Severity } from "@/lib/flood-data"

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function IncidentPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [incidents, setIncidents] = useState<Record<ColumnKey, Incident[]>>(INITIAL_INCIDENTS);
  
  const totalIncidents = Object.values(incidents).flat().length;

  const acknowledgeIncident = (incidentToMove: Incident) => {
    setIncidents(prev => ({
      ...prev,
      detected: prev.detected.filter(i => i.id !== incidentToMove.id),
      acknowledged: [incidentToMove, ...prev.acknowledged]
    }));
  };

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
                        <SeverityBadge severity={incident.severity} showDot={false} className="scale-90 origin-right border border-white/5 bg-white/5" />
                      </div>
                      
                      <p className="text-[13px] text-slate-400 leading-relaxed mb-4">
                        {incident.description}
                      </p>

                      {/* Meta Row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] linear-label text-slate-500 mb-4">
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="size-3" />
                          {incident.location.split(",")[0]}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="size-3" />
                          {formatTime(incident.detectedAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Droplets className="size-3" />
                          {incident.waterLevel}m
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="size-3" />
                          {incident.populationAffected.toLocaleString("en-IN")}
                        </span>
                      </div>

                      {/* Status Action */}
                      {col.key === "detected" ? (
                        <button 
                          onClick={() => acknowledgeIncident(incident)}
                          className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-bold bg-orange-500/20 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg border border-orange-500/50 tracking-wide mt-2 transition-all shadow-[0_0_10px_rgba(249,115,22,0.2)] hover:shadow-[0_0_15px_rgba(249,115,22,0.4)]"
                        >
                          <AlertTriangle className="size-3" />
                          ACKNOWLEDGE & DISPATCH
                        </button>
                      ) : (
                        <div className="w-full h-8 flex items-center justify-center gap-1.5 text-[11px] font-medium bg-[#5E6AD2]/10 text-[#5E6AD2] rounded-lg border border-[#5E6AD2]/20 tracking-wide mt-2">
                          {col.key === "acknowledged" && (
                            <>
                              <Truck className="size-3" />
                              Rescuers dispatched
                            </>
                          )}
                          {col.key === "evacuating" && (
                            <>
                              <CheckCircle2 className="size-3" />
                              Evacuation in progress
                            </>
                          )}
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
