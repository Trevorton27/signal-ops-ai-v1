import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  high: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  low: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("capitalize text-xs font-medium", severityStyles[severity] ?? severityStyles.low)}
    >
      {severity}
    </Badge>
  );
}
