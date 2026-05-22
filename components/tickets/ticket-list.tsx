"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "./severity-badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Ticket, Customer, InvestigationRun } from "@prisma/client";

type TicketWithRelations = Ticket & {
  customer: Customer;
  investigations: InvestigationRun[];
};

const statusStyles: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
};

export function TicketList({ tickets }: { tickets: TicketWithRelations[] }) {
  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-slate-500">
          No tickets found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {tickets.map((ticket) => {
        const latestRun = ticket.investigations[0];
        return (
          <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{ticket.externalId}</span>
                      <SeverityBadge severity={ticket.severity} />
                      <Badge
                        variant="outline"
                        className={`text-xs capitalize ${statusStyles[ticket.status] ?? ""}`}
                      >
                        {ticket.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-1 truncate">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {ticket.customer.company} · {ticket.customer.plan} plan · {ticket.customer.region}
                    </p>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <p className="text-xs text-slate-400">{formatRelativeTime(ticket.createdAt)}</p>
                    {latestRun && (
                      <Badge variant="outline" className="text-xs">
                        {latestRun.status === "complete" ? "Investigated" : latestRun.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
