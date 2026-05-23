import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "./severity-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { Building2, MapPin, CreditCard, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";
import type { Ticket, Customer, Incident } from "@prisma/client";

type TicketWithCustomer = Ticket & { customer: Customer };

const statusStyles: Record<string, string> = {
  open:        "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  resolved:    "bg-green-50 text-green-700 border-green-200",
  archived:    "bg-slate-50 text-slate-500 border-slate-200",
};

const incidentSeverityStyles: Record<string, string> = {
  P0: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",
  P1: "bg-orange-100 text-orange-700 border-orange-200",
  P2: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export function TicketDetail({
  ticket,
  linkedIncident,
}: {
  ticket: TicketWithCustomer;
  linkedIncident?: Incident | null;
}) {
  return (
    <div className="space-y-4">
      {/* Incident banner */}
      {linkedIncident && (
        <Link href={`/incidents/${linkedIncident.id}`}>
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-red-800 dark:text-red-200 truncate">
                  {linkedIncident.title}
                </span>
                <Badge variant="outline" className={`text-xs shrink-0 ${incidentSeverityStyles[linkedIncident.severity] ?? ""}`}>
                  {linkedIncident.severity}
                </Badge>
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 capitalize">
                Part of an active incident · {linkedIncident.status}
              </p>
            </div>
            <span className="text-xs text-red-500 shrink-0">View →</span>
          </div>
        </Link>
      )}

      {/* Ticket Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{ticket.externalId}</span>
            <SeverityBadge severity={ticket.severity} />
            <Badge
              variant="outline"
              className={`text-xs capitalize ${statusStyles[ticket.status] ?? ""}`}
            >
              {ticket.status.replace("_", " ")}
            </Badge>
            {ticket.category && (
              <Badge variant="outline" className="text-xs capitalize">
                {ticket.category.replace("_", " ")}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
            Submitted {formatRelativeTime(ticket.createdAt)}
          </p>
        </CardContent>
      </Card>

      {/* Customer Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Customer</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{ticket.customer.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{ticket.customer.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {ticket.customer.company}
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span className="capitalize">{ticket.customer.plan} plan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {ticket.customer.region}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              {ticket.customer.accountAge}mo account
            </div>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Industry: {ticket.customer.industry}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
