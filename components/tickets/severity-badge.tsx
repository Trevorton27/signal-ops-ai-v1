import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  critical: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-950/50",
  high: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-950/50",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-950/50",
  low: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-800",
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
