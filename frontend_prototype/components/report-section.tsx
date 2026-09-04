"use client"

import { useState } from "react"
import { CheckCircle2, Send, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  INCIDENT_TYPES,
  INITIAL_REPORTS,
  SEVERITY_META,
  timeAgo,
  type IncidentReport,
  type Severity,
} from "@/lib/flood-data"
import { SeverityBadge, severityColor } from "@/components/severity-badge"

export function ReportSection() {
  const [reports, setReports] = useState<IncidentReport[]>(INITIAL_REPORTS)
  const [type, setType] = useState("")
  const [severity, setSeverity] = useState<Severity>("watch")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!type || !location.trim() || !description.trim()) {
      toast.error("Please fill in the type, location, and description.")
      return
    }
    const report: IncidentReport = {
      id: `ir-${Date.now()}`,
      type,
      severity,
      location: location.trim(),
      description: description.trim(),
      reportedMinsAgo: 0,
      status: "new",
    }
    setReports((prev) => [report, ...prev])
    toast.success("Report submitted", {
      description: "Thank you. Local responders have been notified.",
    })
    setType("")
    setSeverity("watch")
    setLocation("")
    setDescription("")
  }

  return (
    <section className="space-y-5" aria-label="Report an incident">
      <Card className="gap-4 p-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Report an incident</h2>
        </div>
        <p className="-mt-2 text-xs text-muted-foreground">
          Emergency? Call your local services first. Use this to report flooding,
          blockages, or hazards you can see.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Incident type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type" className="w-full">
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {INCIDENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Severity</Label>
            <div className="grid grid-cols-4 gap-2">
              {(["safe", "watch", "warning", "danger"] as Severity[]).map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSeverity(sev)}
                  className="flex flex-col items-center gap-1 rounded-lg border p-2 text-[11px] font-medium capitalize transition-colors"
                  style={{
                    borderColor:
                      severity === sev ? severityColor[sev] : "var(--border)",
                    background:
                      severity === sev ? `${severityColor[sev]}22` : "transparent",
                    color: severity === sev ? severityColor[sev] : undefined,
                  }}
                  aria-pressed={severity === sev}
                >
                  <span
                    className="size-3 rounded-full"
                    style={{ background: severityColor[sev] }}
                  />
                  {SEVERITY_META[sev].label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g. Millbrook Rd, near the mill"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">What&apos;s happening?</Label>
            <Textarea
              id="description"
              placeholder="Describe the hazard, water depth, people affected, etc."
              value={description}
              rows={3}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full gap-2">
            <Send className="size-4" />
            Submit report
          </Button>
        </form>
      </Card>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Recent community reports</h2>
        </div>
        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold leading-tight">{r.type}</h3>
                  <p className="text-xs text-muted-foreground">{r.location}</p>
                </div>
                <SeverityBadge severity={r.severity} showDot={false} />
              </div>
              <p className="text-sm text-muted-foreground">{r.description}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span
                  className="rounded-full px-2 py-0.5 font-medium capitalize"
                  style={{
                    background:
                      r.status === "verified"
                        ? `${severityColor.safe}22`
                        : "var(--muted)",
                    color:
                      r.status === "verified" ? severityColor.safe : undefined,
                  }}
                >
                  {r.status}
                </span>
                <span>{timeAgo(r.reportedMinsAgo)}</span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
