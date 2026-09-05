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

export function IncidentBoard() {
  const [incidents, setIncidents] =
    useState<Record<ColumnKey, Incident[]>>(INITIAL_INCIDENTS);

  const moveCard = useCallback((incidentId: string, from: ColumnKey) => {
    setIncidents((prev) => {
      const cardIndex = prev[from].findIndex((i) => i.id === incidentId);
      if (cardIndex === -1) return prev;

      const card = prev[from][cardIndex];
      const columnOrder: ColumnKey[] = [
        "detected",
        "acknowledged",
        "evacuating",
      ];
      const nextIndex = columnOrder.indexOf(from) + 1;
      if (nextIndex >= columnOrder.length) return prev;

      const to = columnOrder[nextIndex];

      return {
        ...prev,
        [from]: prev[from].filter((i) => i.id !== incidentId),
        [to]: [...prev[to], card],
      };
    });
  }, []);

  const totalIncidents = Object.values(incidents).flat().length;

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(94,106,210,0.15)]">
            <AlertTriangle className="size-4 text-[#5E6AD2]" />
          </div>
          <div>
            <h2 className="linear-label linear-text-muted">
              Incident Command
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] linear-label text-[#5E6AD2]">
          <span className="inline-block size-1.5 rounded-full bg-[#5E6AD2] animate-pulse shadow-[0_0_8px_rgba(94,106,210,0.8)]" />
          Live
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-1 gap-4 overflow-y-auto no-scrollbar flex-1 pr-2 pb-2">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className="rounded-2xl border border-white/5 bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)] p-4 space-y-4"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[#5E6AD2] opacity-80">{col.icon}</span>
                <span className="linear-label text-white/70">
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
                <div className="flex flex-col items-center justify-center py-6 text-[#8A8F98]/50">
                  <CheckCircle2 className="size-5 mb-2 opacity-50" />
                  <p className="linear-label">Clear</p>
                </div>
              ) : (
                incidents[col.key].map((incident) => {
                  const isLastColumn = col.key === "evacuating";

                  return (
                    <div
                      key={incident.id}
                      className="linear-card p-4 transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-semibold text-[#EDEDEF] tracking-tight leading-snug group-hover:text-white transition-colors">
                          {incident.title}
                        </h3>
                        <SeverityBadge severity={incident.severity} showDot={false} className="scale-90 origin-right border border-white/5 bg-white/5" />
                      </div>
                      
                      <p className="text-xs text-[#8A8F98] leading-relaxed mb-4 font-normal">
                        {incident.description}
                      </p>

                      {/* Meta Row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[10px] linear-label linear-text-muted mb-4">
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

                      {/* Action Button */}
                      {!isLastColumn && (
                        <button
                          onClick={() => moveCard(incident.id, col.key)}
                          className="w-full h-8 text-xs font-medium bg-[#5E6AD2] hover:bg-[#6872D9] text-white rounded-lg shadow-[0_0_0_1px_rgba(94,106,210,0.5),0_4px_12px_rgba(94,106,210,0.3),inset_0_1px_0_0_rgba(255,255,255,0.2)] transition-all flex items-center justify-center active:scale-[0.98]"
                        >
                          {col.key === "detected"
                            ? "Acknowledge"
                            : "Begin Evacuation"}
                          <ArrowRight className="ml-1.5 size-3" />
                        </button>
                      )}

                      {isLastColumn && (
                        <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#5E6AD2] font-medium tracking-wide">
                          <Truck className="size-3" />
                          Evacuation in progress
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
