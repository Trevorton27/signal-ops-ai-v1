import { Shield, ShieldAlert, ShieldX } from "lucide-react";
import type { GuardrailsResult } from "@/agents/state";

interface GuardrailsBadgeProps {
  result: GuardrailsResult;
  compact?: boolean;
}

export function GuardrailsBadge({ result, compact = false }: GuardrailsBadgeProps) {
  const blockingFlags = result.flags.filter((f) => f.severity === "block");
  const warnFlags = result.flags.filter((f) => f.severity === "warn");

  if (result.passed && result.flags.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400">
        <Shield className="w-4 h-4" />
        {!compact && <span className="text-xs font-medium">Guardrails passed</span>}
      </div>
    );
  }

  if (blockingFlags.length > 0) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <ShieldX className="w-4 h-4" />
          {!compact && <span className="text-xs font-medium">{blockingFlags.length} blocking flag{blockingFlags.length !== 1 ? "s" : ""}</span>}
        </div>
        {!compact && blockingFlags.map((flag, i) => (
          <div key={i} className="text-xs bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-md px-3 py-2 space-y-0.5">
            <div className="font-medium text-red-700 dark:text-red-300 capitalize">{flag.type.replace(/_/g, " ")}</div>
            <div className="text-red-600 dark:text-red-400">{flag.description}</div>
            {flag.location && <div className="text-red-400 dark:text-red-500 font-mono text-xs">{flag.location}</div>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
        <ShieldAlert className="w-4 h-4" />
        {!compact && <span className="text-xs font-medium">{warnFlags.length} warning{warnFlags.length !== 1 ? "s" : ""}</span>}
      </div>
      {!compact && warnFlags.map((flag, i) => (
        <div key={i} className="text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2 space-y-0.5">
          <div className="font-medium text-amber-700 dark:text-amber-300 capitalize">{flag.type.replace(/_/g, " ")}</div>
          <div className="text-amber-600 dark:text-amber-400">{flag.description}</div>
          {flag.location && <div className="text-amber-400 dark:text-amber-500 font-mono text-xs">{flag.location}</div>}
        </div>
      ))}
    </div>
  );
}
