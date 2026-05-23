import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentStep } from "@prisma/client";

interface EvidencePanelProps {
  step: AgentStep;
}

function RerankScore({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(1, score));
  const color = pct > 0.7 ? "bg-green-500" : pct > 0.4 ? "bg-amber-500" : "bg-slate-300";
  return (
    <div className="flex items-center gap-1.5" title={`Rerank score: ${score.toFixed(3)}`}>
      <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct * 100}%` }} />
      </div>
      <span className="text-xs text-slate-400 font-mono tabular-nums">{score.toFixed(2)}</span>
    </div>
  );
}

export function EvidencePanel({ step }: EvidencePanelProps) {
  const output = step.output as Record<string, unknown> | null;
  if (!output) return null;

  const agentName = step.agentName;

  if (agentName === "knowledge-retrieval") {
    const sources = Array.isArray(output.sources) ? (output.sources as string[]) : [];
    const rerankScores = Array.isArray(output.rerankScores) ? (output.rerankScores as (number | null)[]) : [];
    const chunksRetrieved = typeof output.chunksRetrieved === "number" ? output.chunksRetrieved : 0;

    return (
      <div className="space-y-3">
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {chunksRetrieved} chunks retrieved from knowledge base
          {rerankScores.some((s) => s !== null) && " · reranked via HuggingFace cross-encoder"}
        </div>
        {sources.map((src, i) => (
          <div key={i} className="flex items-start justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div className="text-xs text-slate-700 dark:text-slate-300 font-mono truncate flex-1">
              {src.split("/").pop() ?? src}
            </div>
            {rerankScores[i] !== null && rerankScores[i] !== undefined && (
              <RerankScore score={rerankScores[i] as number} />
            )}
          </div>
        ))}
      </div>
    );
  }

  if (agentName === "incident-correlation") {
    const sentryIssues = Array.isArray(output.sentryIssues)
      ? (output.sentryIssues as Array<Record<string, unknown>>)
      : [];

    if (sentryIssues.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">Sentry Issues</div>
        {sentryIssues.map((issue, i) => (
          <div key={i} className="text-xs p-2 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-800/50 rounded-md">
            <div className="font-medium text-red-800 dark:text-red-300 truncate">{String(issue.title)}</div>
            <div className="text-red-600 dark:text-red-400 mt-0.5">
              {String(issue.level).toUpperCase()} · {Number(issue.count).toLocaleString()} events
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (agentName === "log-analysis") {
    const datadogCount = typeof output.datadogCount === "number" ? output.datadogCount : 0;
    if (datadogCount === 0) return null;
    return (
      <div className="text-xs text-slate-500 dark:text-slate-400 p-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-800/50 rounded-md">
        Also analyzed {datadogCount} Datadog log entries
      </div>
    );
  }

  return null;
}

export function EvidenceCard({ step }: EvidencePanelProps) {
  const content = <EvidencePanel step={step} />;
  if (!content) return null;

  return (
    <Card className="border-slate-100 dark:border-slate-800">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Evidence Sources</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3">
        <EvidencePanel step={step} />
      </CardContent>
    </Card>
  );
}
