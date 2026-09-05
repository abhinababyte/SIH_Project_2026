"use client"

import { Navigation, Users, Route as RouteIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { EVAC_ROUTES, SHELTERS, TOWN } from "@/lib/flood-data"
import { severityColor } from "@/components/severity-badge"
import { cn } from "@/lib/utils"

const shelterStatus: Record<string, string> = {
  open: "bg-safe text-safe-foreground",
  standby: "bg-watch text-watch-foreground",
  full: "bg-danger text-danger-foreground",
}

const routeStatusColor: Record<string, string> = {
  clear: severityColor.safe,
  congested: severityColor.watch,
  blocked: severityColor.danger,
}

export function SheltersSection() {
  return (
    <section className="space-y-5" aria-label="Evacuation and shelters">
      <div>
        <div className="mb-3 flex items-center gap-2">
          <RouteIcon className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Evacuation routes</h2>
        </div>
        <div className="space-y-2">
          {EVAC_ROUTES.map((r) => {
            const shelter = SHELTERS.find((s) => s.id === r.toShelterId)
            return (
              <Card key={r.id} className="flex-row items-center gap-3 p-3">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: routeStatusColor[r.status] }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight">{r.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    to {shelter?.name}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold capitalize"
                  style={{ color: routeStatusColor[r.status] }}
                >
                  {r.status}
                </span>
              </Card>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Users className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Nearby shelters</h2>
        </div>
        <div className="space-y-3">
          {[...SHELTERS]
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .map((sh) => {
              const pct = Math.round((sh.occupied / sh.capacity) * 100)
              return (
                <Card key={sh.id} className="gap-3 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold leading-tight">
                        {sh.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {sh.address} · {sh.distanceKm} km away
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase",
                        shelterStatus[sh.status],
                      )}
                    >
                      {sh.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Capacity</span>
                      <span className="tabular-nums">
                        {sh.occupied}/{sh.capacity} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background:
                            pct >= 100
                              ? severityColor.danger
                              : pct >= 80
                                ? severityColor.warning
                                : severityColor.safe,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {sh.amenities.map((am) => (
                        <Badge key={am} variant="secondary" className="text-xs">
                          {am}
                        </Badge>
                      ))}
                    </div>
                    <a
                      className="ml-auto inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                      href={`https://www.openstreetmap.org/directions?from=${TOWN.center[0]},${TOWN.center[1]}&to=${sh.position[0]},${sh.position[1]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Navigation className="size-3" />
                      Directions
                    </a>
                  </div>
                </Card>
              )
            })}
        </div>
      </div>
    </section>
  )
}
