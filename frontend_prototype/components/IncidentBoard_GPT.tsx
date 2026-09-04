"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Siren, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type IncidentStatus = "detected" | "acknowledged" | "evacuating";

type Incident = {
  id: string;
  title: string;
  location: string;
  severity: "Critical" | "High" | "Medium";
  affected: number;
  rainfall: string;
  status: IncidentStatus;
};

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: "INC-001",
    title: "Flash Flood Warning",
    location: "Darjeeling Hills – Zone A",
    severity: "Critical",
    affected: 1250,
    rainfall: "184 mm/hr",
    status: "detected",
  },
  {
    id: "INC-002",
    title: "River Level Rising",
    location: "Teesta River – Checkpoint 04",
    severity: "High",
    affected: 420,
    rainfall: "96 mm/hr",
    status: "acknowledged",
  },
];

const COLUMNS: {
  id: IncidentStatus;
  title: string;
  icon: React.ReactNode;
}[] = [
  {
    id: "detected",
    title: "Detected",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  {
    id: "acknowledged",
    title: "Acknowledged",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  {
    id: "evacuating",
    title: "Evacuating",
    icon: <Siren className="h-4 w-4" />,
  },
];

const severityClasses: Record<Incident["severity"], string> = {
  Critical:
    "border-red-500/30 bg-red-500/10 text-red-400",
  High:
    "border-orange-500/30 bg-orange-500/10 text-orange-400",
  Medium:
    "border-yellow-500/30 bg-yellow-500/10 text-yellow-400",
};

export default function IncidentBoard() {
  const [incidents, setIncidents] =
    useState<Incident[]>(INITIAL_INCIDENTS);

  const moveIncident = (
    incidentId: string,
    nextStatus: IncidentStatus
  ) => {
    setIncidents((current) =>
      current.map((incident) =>
        incident.id === incidentId
          ? { ...incident, status: nextStatus }
          : incident
      )
    );
  };

  return (
    <section className="w-full">
      <div className="mb-5">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Incident Management
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Track AI-detected flood incidents through the emergency response
          lifecycle.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((column) => {
          const columnIncidents = incidents.filter(
            (incident) => incident.status === column.id
          );

          return (
            <div
              key={column.id}
              className="flex min-h-[460px] flex-col rounded-xl border border-white/10 bg-slate-950/50 p-3 backdrop-blur-sm"
            >
              {/* Column Header */}
              <div className="mb-3 flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.03] px-3 py-2">
                <div className="flex items-center gap-2">
                  {column.icon}
                  <span className="font-semibold text-white">
                    {column.title}
                  </span>
                </div>

                <Badge
                  variant="secondary"
                  className="border border-white/10 bg-white/5 text-slate-300"
                >
                  {columnIncidents.length}
                </Badge>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-3">
                {columnIncidents.map((incident) => (
                  <Card
                    key={incident.id}
                    className="overflow-hidden border-white/10 bg-slate-900/80 shadow-lg"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="mb-1 text-xs font-medium text-slate-500">
                            {incident.id}
                          </p>

                          <CardTitle className="text-base text-white">
                            {incident.title}
                          </CardTitle>
                        </div>

                        <Badge
                          variant="outline"
                          className={severityClasses[incident.severity]}
                        >
                          {incident.severity}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <MapPin className="h-4 w-4 shrink-0" />
                        {incident.location}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
                          <p className="text-[11px] uppercase tracking-wide text-slate-500">
                            Rainfall
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {incident.rainfall}
                          </p>
                        </div>

                        <div className="rounded-lg border border-white/5 bg-white/[0.03] p-2">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-slate-500" />
                            <p className="text-[11px] uppercase tracking-wide text-slate-500">
                              Affected
                            </p>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-white">
                            {incident.affected.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Workflow Actions */}
                      {column.id === "detected" && (
                        <Button
                          className="w-full bg-red-600 text-white hover:bg-red-700"
                          onClick={() =>
                            moveIncident(incident.id, "acknowledged")
                          }
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Acknowledge
                        </Button>
                      )}

                      {column.id === "acknowledged" && (
                        <Button
                          className="w-full bg-orange-600 text-white hover:bg-orange-700"
                          onClick={() =>
                            moveIncident(incident.id, "evacuating")
                          }
                        >
                          <Siren className="mr-2 h-4 w-4" />
                          Start Evacuation
                        </Button>
                      )}

                      {column.id === "evacuating" && (
                        <div className="flex items-center justify-center gap-2 rounded-md border border-green-500/20 bg-green-500/10 py-2 text-sm font-medium text-green-400">
                          <CheckCircle2 className="h-4 w-4" />
                          Evacuation Active
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {columnIncidents.length === 0 && (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 p-6 text-center text-sm text-slate-500">
                    No incidents in this stage
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
