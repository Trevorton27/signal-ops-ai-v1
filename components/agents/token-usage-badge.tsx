import { estimateCostUsd, formatCostUsd } from "@/lib/agent-utils";
import type { TokenUsage } from "@/lib/agent-utils";

interface TokenUsageBadgeProps {
  tokenUsage: TokenUsage;
  model: string;
}

export function TokenUsageBadge({ tokenUsage, model }: TokenUsageBadgeProps) {
  const cost = estimateCostUsd(tokenUsage, model);
  const totalK = (tokenUsage.totalTokens / 1000).toFixed(1);

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700 font-mono tabular-nums">
      {totalK}k tokens · {formatCostUsd(cost)}
    </span>
  );
}
