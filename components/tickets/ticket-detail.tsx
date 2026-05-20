import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SeverityBadge } from "./severity-badge";
import { Badge } from "@/components/ui/badge";
import { formatRelativeTime } from "@/lib/utils";
import { Building2, MapPin, CreditCard, Calendar } from "lucide-react";
import type { Ticket, Customer } from "@prisma/client";

type TicketWithCustomer = Ticket & { customer: Customer };

const statusStyles: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border-blue-200",
  in_progress: "bg-purple-50 text-purple-700 border-purple-200",
  resolved: "bg-green-50 text-green-700 border-green-200",
  archived: "bg-slate-50 text-slate-500 border-slate-200",
};

export function TicketDetail({ ticket }: { ticket: TicketWithCustomer }) {
  return (
    <div className="space-y-4">
      {/* Ticket Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-slate-400">{ticket.externalId}</span>
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
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {ticket.description}
          </p>
          <p className="text-xs text-slate-400 mt-3">
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
            <p className="text-sm font-medium text-slate-900">{ticket.customer.name}</p>
            <p className="text-xs text-slate-500">{ticket.customer.email}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
            <div className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {ticket.customer.company}
            </div>
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-slate-400" />
              <span className="capitalize">{ticket.customer.plan} plan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {ticket.customer.region}
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              {ticket.customer.accountAge}mo account
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Industry: {ticket.customer.industry}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
