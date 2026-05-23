import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import type { Ticket, Customer, InvestigationRun } from "@prisma/client";

type TicketWithCustomer = Ticket & {
  customer: Customer;
  investigations: InvestigationRun[];
};

interface AffectedCustomersTableProps {
  tickets: TicketWithCustomer[];
}

const planStyles: Record<string, string> = {
  enterprise: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300",
  pro: "bg-blue-100 text-blue-700 border-blue-200",
  free: "bg-slate-100 text-slate-500 border-slate-200",
};

export function AffectedCustomersTable({ tickets }: AffectedCustomersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Affected Customers
          <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">
            ({tickets.length})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {tickets.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 px-6 pb-4">No tickets linked.</p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="px-6 py-3 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                    {ticket.customer.company}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {ticket.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className={`text-xs capitalize ${planStyles[ticket.customer.plan] ?? ""}`}>
                    {ticket.customer.plan}
                  </Badge>
                  <span className="text-xs text-slate-400 tabular-nums whitespace-nowrap">
                    {formatRelativeTime(ticket.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
