import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Incident } from "@prisma/client";

const statusStyles: Record<string, string> = {
  investigating: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  identified:    "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300",
  monitoring:    "bg-yellow-100 text-yellow-700 border-yellow-200",
  resolved:      "bg-green-100 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300",
};

const severityBg: Record<string, string> = {
  P0: "bg-red-600",
  P1: "bg-orange-500",
  P2: "bg-yellow-500",
};

interface IncidentHeaderProps {
  incident: Incident;
}

export function IncidentHeader({ incident }: IncidentHeaderProps) {
  return (
    <div className={`rounded-xl p-6 text-white ${severityBg[incident.severity] ?? "bg-slate-600"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-bold opacity-90">{incident.severity}</span>
            <span className="opacity-50">·</span>
            <span className="text-sm opacity-90">{incident.affectedProduct}</span>
            <span className="opacity-50">·</span>
            <span className="text-sm opacity-90">{incident.affectedRegion}</span>
          </div>
          <h1 className="text-xl font-bold leading-tight">{incident.title}</h1>
          <p className="text-sm opacity-80 mt-1">
            Started {formatRelativeTime(incident.startedAt)}
            {incident.resolvedAt && ` · Resolved ${formatRelativeTime(incident.resolvedAt)}`}
          </p>
        </div>
        <Badge
          variant="outline"
          className={`shrink-0 capitalize border-white/30 text-white bg-white/10 ${statusStyles[incident.status] ?? ""}`}
        >
          {incident.status}
        </Badge>
      </div>

      {incident.rootCauseHypothesis && (
        <div className="mt-4 p-3 bg-white/10 rounded-lg">
          <div className="text-xs font-medium opacity-70 mb-1">Root Cause</div>
          <p className="text-sm">{incident.rootCauseHypothesis}</p>
        </div>
      )}
    </div>
  );
}
