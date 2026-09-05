import type { Severity } from "@/lib/flood-data"
import { SEVERITY_META } from "@/lib/flood-data"
import { cn } from "@/lib/utils"

export const severityBg: Record<Severity, string> = {
  safe: "bg-safe text-safe-foreground",
  watch: "bg-watch text-watch-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-danger text-danger-foreground",
}

export const severityText: Record<Severity, string> = {
  safe: "text-safe",
  watch: "text-watch",
  warning: "text-warning",
  danger: "text-danger",
}

export const severityBorder: Record<Severity, string> = {
  safe: "border-safe/40",
  watch: "border-watch/50",
  warning: "border-warning/50",
  danger: "border-danger/50",
}

// Raw hex-ish values for the Leaflet canvas (which can't read CSS classes easily)
export const severityColor: Record<Severity, string> = {
  safe: "oklch(0.7 0.16 155)",
  watch: "oklch(0.82 0.16 90)",
  warning: "oklch(0.74 0.18 55)",
  danger: "oklch(0.62 0.24 25)",
}

export function SeverityBadge({
  severity,
  className,
  showDot = true,
}: {
  severity: Severity
  className?: string
  showDot?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide",
        severityBg[severity],
        className,
      )}
    >
      {showDot && (
        <span className="size-1.5 rounded-full bg-current opacity-80" />
      )}
      {SEVERITY_META[severity].label}
    </span>
  )
}
