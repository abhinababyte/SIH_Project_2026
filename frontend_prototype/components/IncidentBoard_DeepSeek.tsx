// components/IncidentBoard_DeepSeek.tsx
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertTriangle } from "lucide-react";

// Define the type for an incident item
type Incident = {
  id: string;
  title: string;
  location: string;
  severity: "low" | "medium" | "high";
  description: string;
};

// Dummy data – replace with real API calls later
const initialDetected: Incident[] = [
  {
    id: "INC-001",
    title: "Flash Flood Warning",
    location: "Sector 12, Riverside",
    severity: "high",
    description: "Water level rising rapidly near main bridge.",
  },
  {
    id: "INC-002",
    title: "Landslide Risk",
    location: "Hill Road 5",
    severity: "medium",
    description: "Soil saturation exceeds threshold.",
  },
];

const initialAcknowledged: Incident[] = [
  {
    id: "INC-003",
    title: "River Overflow",
    location: "Lowland Ave",
    severity: "high",
    description: "River breached embankment at checkpoint 4.",
  },
];

const initialEvacuating: Incident[] = [
  {
    id: "INC-004",
    title: "Evacuation in Progress",
    location: "Old Town",
    severity: "critical",
    description: "Evacuation orders issued, residents moving to shelter.",
  },
];

export default function IncidentBoard() {
  const [detected, setDetected] = useState<Incident[]>(initialDetected);
  const [acknowledged, setAcknowledged] = useState<Incident[]>(initialAcknowledged);
  const [evacuating, setEvacuating] = useState<Incident[]>(initialEvacuating);

  // Move an incident from one column to another
  const moveIncident = (
    incident: Incident,
    from: "detected" | "acknowledged" | "evacuating",
    to: "detected" | "acknowledged" | "evacuating"
  ) => {
    // Remove from source
    let sourceArray: Incident[], setSource: React.Dispatch<React.SetStateAction<Incident[]>>;
    if (from === "detected") {
      sourceArray = detected;
      setSource = setDetected;
    } else if (from === "acknowledged") {
      sourceArray = acknowledged;
      setSource = setAcknowledged;
    } else {
      sourceArray = evacuating;
      setSource = setEvacuating;
    }
    const newSource = sourceArray.filter((item) => item.id !== incident.id);
    setSource(newSource);

    // Add to destination
    let destArray: Incident[], setDest: React.Dispatch<React.SetStateAction<Incident[]>>;
    if (to === "detected") {
      destArray = detected;
      setDest = setDetected;
    } else if (to === "acknowledged") {
      destArray = acknowledged;
      setDest = setAcknowledged;
    } else {
      destArray = evacuating;
      setDest = setEvacuating;
    }
    // Avoid duplicate if somehow present (shouldn't happen)
    if (!destArray.some((item) => item.id === incident.id)) {
      setDest([...destArray, incident]);
    }
  };

  // Helper to render a column
  const renderColumn = (
    title: string,
    incidents: Incident[],
    color: string,
    from: "detected" | "acknowledged" | "evacuating",
    nextAction?: { label: string; to: "detected" | "acknowledged" | "evacuating" }
  ) => (
    <div className="flex-1 min-w-[280px] bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <Badge variant="outline" className={`${color} border-current`}>
          {incidents.length}
        </Badge>
      </div>
      <div className="space-y-3">
        {incidents.map((incident) => (
          <Card key={incident.id} className="p-4 bg-gray-50 border border-gray-200">
            <CardHeader className="p-0 pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                {incident.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 space-y-2">
              <p className="text-xs text-gray-600">{incident.location}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {incident.severity}
                </Badge>
                <span className="text-xs text-gray-500">ID: {incident.id}</span>
              </div>
              <p className="text-xs text-gray-700">{incident.description}</p>
              {nextAction && (
                <Button
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => moveIncident(incident, from, nextAction.to)}
                >
                  {nextAction.label}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 overflow-x-auto p-4">
      {renderColumn("Detected", detected, "text-red-500", "detected", {
        label: "Acknowledge",
        to: "acknowledged",
      })}
      {renderColumn("Acknowledged", acknowledged, "text-amber-500", "acknowledged", {
        label: "Start Evacuation",
        to: "evacuating",
      })}
      {renderColumn("Evacuating", evacuating, "text-green-500", "evacuating")}
    </div>
  );
}
