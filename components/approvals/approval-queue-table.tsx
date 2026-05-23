import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { InvestigationRun, Ticket, Customer } from "@prisma/client";

type RunWithRelations = InvestigationRun & {
  ticket: Ticket & { customer: Customer };
};

interface ApprovalQueueTableProps {
  runs: RunWithRelations[];
}

const severityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  high: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-slate-100 text-slate-600 border-slate-200",
};

const planStyles: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800",
  pro: "bg-blue-100 text-blue-700 border-blue-200",
  free: "bg-slate-100 text-slate-500 border-slate-200",
};

function SlaTimer({ startedAt }: { startedAt: Date }) {
  const ageHours = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60);
  const slaHours = 24;
  const remaining = slaHours - ageHours;
  const overdue = remaining < 0;

  return (
    <div className={`text-xs font-mono tabular-nums ${overdue ? "text-red-600 dark:text-red-400" : remaining < 4 ? "text-amber-600" : "text-slate-500"}`}>
      {overdue ? `${Math.abs(remaining).toFixed(0)}h overdue` : `${remaining.toFixed(0)}h left`}
    </div>
  );
}

export function ApprovalQueueTable({ runs }: ApprovalQueueTableProps) {
  if (runs.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500 dark:text-slate-400 text-sm">
        No investigations pending approval.
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {runs.map((run) => (
        <Link
          key={run.id}
          href={`/approvals/${run.id}`}
          className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                {run.ticket.title}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{run.ticket.customer.company}</span>
              <span>·</span>
              <span>{formatRelativeTime(run.startedAt)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="outline" className={`text-xs capitalize ${severityStyles[run.ticket.severity] ?? ""}`}>
              {run.ticket.severity}
            </Badge>
            <Badge variant="outline" className={`text-xs capitalize ${planStyles[run.ticket.customer.plan] ?? ""}`}>
              {run.ticket.customer.plan}
            </Badge>
            <SlaTimer startedAt={run.startedAt} />
          </div>
        </Link>
      ))}
    </div>
  );
}
