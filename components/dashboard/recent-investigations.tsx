import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { InvestigationRun, Ticket, Customer, AgentStep } from "@prisma/client";

type RecentInvestigation = InvestigationRun & {
  ticket: Ticket & { customer: Customer };
  steps: AgentStep[];
};

export function RecentInvestigations({ investigations }: { investigations: RecentInvestigation[] }) {
  if (investigations.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-slate-500 text-sm">
          No completed investigations yet. Run one from any ticket.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {investigations.map((run) => (
        <Link key={run.id} href={`/investigations/${run.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {run.ticket.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {run.ticket.customer.company} · {run.ticket.customer.plan} plan
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-xs">
                    {run.steps.length} steps
                  </Badge>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {run.completedAt ? formatRelativeTime(run.completedAt) : "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
