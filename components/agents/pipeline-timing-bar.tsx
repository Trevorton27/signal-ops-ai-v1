import { formatDuration } from "@/lib/utils";
import type { AgentStep } from "@prisma/client";

interface PipelineTimingBarProps {
  steps: AgentStep[];
}

const AGENT_COLORS: Record<string, string> = {
  "intake":                "bg-blue-400",
  "customer-context":      "bg-purple-400",
  "log-analysis":          "bg-amber-400",
  "knowledge-retrieval":   "bg-green-400",
  "incident-correlation":  "bg-orange-400",
  "deployment-correlation":"bg-rose-400",
  "root-cause":            "bg-blue-600",
  "response-drafting":     "bg-purple-600",
  "guardrails":            "bg-yellow-500",
  "escalation":            "bg-red-500",
};

export function PipelineTimingBar({ steps }: PipelineTimingBarProps) {
  const completedSteps = steps.filter((s) => s.status === "complete" && s.durationMs !== null);
  if (completedSteps.length === 0) return null;

  const totalMs = completedSteps.reduce((sum, s) => sum + (s.durationMs ?? 0), 0);
  if (totalMs === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span className="font-medium">Pipeline Timing</span>
        <span className="font-mono">{formatDuration(totalMs)} total</span>
      </div>

      {/* Gantt-style bar */}
      <div className="flex h-5 rounded-full overflow-hidden gap-px">
        {completedSteps.map((step) => {
          const pct = ((step.durationMs ?? 0) / totalMs) * 100;
          const color = AGENT_COLORS[step.agentName] ?? "bg-slate-400";
          return (
            <div
              key={step.id}
              className={`${color} relative group`}
              style={{ width: `${Math.max(pct, 1)}%` }}
              title={`${step.agentName}: ${formatDuration(step.durationMs ?? 0)}`}
            >
              <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity">
                {step.agentName}: {formatDuration(step.durationMs ?? 0)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-step duration list */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        {completedSteps.map((step) => {
          const pct = ((step.durationMs ?? 0) / totalMs) * 100;
          const color = AGENT_COLORS[step.agentName] ?? "bg-slate-400";
          return (
            <div key={step.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className={`w-2 h-2 rounded-full shrink-0 ${color}`} />
              <span className="truncate">{step.agentName}</span>
              <span className="ml-auto font-mono tabular-nums text-slate-400 dark:text-slate-500 shrink-0">
                {formatDuration(step.durationMs ?? 0)} ({pct.toFixed(0)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
