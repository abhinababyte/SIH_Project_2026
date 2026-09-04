"use client";

import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  Siren, 
  MapPin, 
  Clock, 
  ArrowRight 
} from "lucide-react";

type IncidentStatus = "detected" | "acknowledged" | "evacuating";

interface Incident {
  id: string;
  title: string;
  location: string;
  time: string;
  severity: "Critical" | "High" | "Medium";
  status: IncidentStatus;
}

const initialIncidents: Incident[] = [
  {
    id: "INC-001",
    title: "Flash Flood Alert - Zone A",
    location: "Lower Valley Road, Sector 4",
    time: "2 mins ago",
    severity: "Critical",
    status: "detected",
  },
  {
    id: "INC-002",
    title: "Landslide Risk - Hillside",
    location: "North Ridge Highway",
    time: "15 mins ago",
    severity: "High",
    status: "detected",
  },
  {
    id: "INC-003",
    title: "Waterlogging - Urban Drain",
    location: "Main Street Junction",
    time: "45 mins ago",
    severity: "Medium",
    status: "acknowledged",
  },
];

const statusConfig = {
  detected: { label: "Detected", icon: AlertTriangle, color: "bg-red-500/10 text-red-500 border-red-500/20" },
  acknowledged: { label: "Acknowledged", icon: CheckCircle, color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  evacuating: { label: "Evacuating", icon: Siren, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

export default function IncidentBoard() {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);

  const updateStatus = (id: string, newStatus: IncidentStatus) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === id ? { ...inc, status: newStatus } : inc))
    );
  };

  const renderColumn = (status: IncidentStatus) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    const columnIncidents = incidents.filter((inc) => inc.status === status);

    return (
      <div className="flex flex-col gap-4 flex-1 min-w-[300px]">
        {/* Column Header */}
        <div className="flex items-center gap-2 px-2">
          <div className={`p-1.5 rounded-md ${config.color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200">
            {config.label}
          </h3>
          <Badge variant="secondary" className="ml-auto rounded-full">
            {columnIncidents.length}
          </Badge>
        </div>

        {/* Cards */}
        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-1">
          {columnIncidents.map((incident) => (
            <Card key={incident.id} className="shadow-sm hover:shadow-md transition-shadow border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {incident.title}
                  </CardTitle>
                  <Badge 
                    variant="outline" 
                    className={
                      incident.severity === "Critical" ? "border-red-500 text-red-500" : 
                      incident.severity === "High" ? "border-orange-500 text-orange-500" : 
                      "border-slate-500 text-slate-500"
                    }
                  >
                    {incident.severity}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                  <MapPin className="h-3 w-3" /> {incident.location}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="h-3 w-3" /> {incident.time}
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                {status === "detected" && (
                  <Button 
                    size="sm" 
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => updateStatus(incident.id, "acknowledged")}
                  >
                    Acknowledge <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {status === "acknowledged" && (
                  <Button 
                    size="sm" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => updateStatus(incident.id, "evacuating")}
                  >
                    Initiate Evacuation <Siren className="ml-2 h-4 w-4" />
                  </Button>
                )}
                {status === "evacuating" && (
                  <div className="w-full text-center text-xs text-blue-600 dark:text-blue-400 font-medium animate-pulse">
                    Rescue teams dispatched...
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
          {columnIncidents.length === 0 && (
            <div className="text-center text-sm text-slate-400 py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              No active incidents
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
      {renderColumn("detected")}
      {renderColumn("acknowledged")}
      {renderColumn("evacuating")}
    </div>
  );
}
