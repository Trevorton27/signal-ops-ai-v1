import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Hypothesis } from "@/agents/state";

function ConfidenceBar({ confidence }: { confidence: number }) {
  const color =
    confidence >= 80 ? "bg-green-500" :
    confidence >= 60 ? "bg-yellow-500" :
    "bg-slate-300";

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
      <div
        className={cn("h-1.5 rounded-full transition-all", color)}
        style={{ width: `${confidence}%` }}
      />
    </div>
  );
}

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  rank: number;
}

export function HypothesisCard({ hypothesis, rank }: HypothesisCardProps) {
  return (
    <Card className={rank === 1 ? "border-blue-200 shadow-sm" : ""}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start gap-2">
          <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
            {rank}
          </span>
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-snug">{hypothesis.title}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Confidence</span>
            <span className="font-medium text-slate-700">{hypothesis.confidence}%</span>
          </div>
          <ConfidenceBar confidence={hypothesis.confidence} />
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{hypothesis.description}</p>

        {hypothesis.evidence.length > 0 && (
          <div>
            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Evidence</p>
            <ul className="space-y-1">
              {hypothesis.evidence.map((e, i) => (
                <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex gap-1.5">
                  <span className="text-slate-300 dark:text-slate-600 mt-0.5">•</span>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hypothesis.recommendedAction && (
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 rounded-md px-3 py-2">
            <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-0.5">Recommended Action</p>
            <p className="text-xs text-blue-700 dark:text-blue-400">{hypothesis.recommendedAction}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
