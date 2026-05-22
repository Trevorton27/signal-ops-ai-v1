import { Card, CardContent } from "@/components/ui/card";
import { Ticket, Search, Clock, AlertTriangle } from "lucide-react";
import { formatDuration } from "@/lib/utils";

interface KpiCardsProps {
  openTickets: number;
  criticalTickets: number;
  investigationsToday: number;
  avgResolutionMs: number;
}

export function KpiCards({ openTickets, criticalTickets, investigationsToday, avgResolutionMs }: KpiCardsProps) {
  const cards = [
    {
      label: "Open Tickets",
      value: openTickets,
      icon: Ticket,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Critical Unresolved",
      value: criticalTickets,
      icon: AlertTriangle,
      color: criticalTickets > 0 ? "text-red-600" : "text-slate-600",
      bg: criticalTickets > 0 ? "bg-red-50" : "bg-slate-50",
    },
    {
      label: "Investigations Today",
      value: investigationsToday,
      icon: Search,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Avg Resolution Time",
      value: avgResolutionMs > 0 ? formatDuration(avgResolutionMs) : "—",
      icon: Clock,
      color: "text-green-600",
      bg: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1">{card.value}</p>
              </div>
              <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
