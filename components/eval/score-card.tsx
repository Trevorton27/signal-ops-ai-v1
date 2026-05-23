interface ScoreBarProps {
  label: string;
  score: number | null;
  weight?: string;
}

function ScoreBar({ label, score, weight }: ScoreBarProps) {
  const pct = score !== null ? Math.round(score * 100) : null;
  const color = pct === null ? "bg-slate-200 dark:bg-slate-700"
    : pct >= 80 ? "bg-green-500"
    : pct >= 60 ? "bg-yellow-500"
    : "bg-red-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-700 dark:text-slate-300">{label}</span>
        <div className="flex items-center gap-2">
          {weight && <span className="text-slate-400">{weight}</span>}
          <span className={`font-mono tabular-nums font-medium ${
            pct === null ? "text-slate-400" : pct >= 80 ? "text-green-600 dark:text-green-400" : pct >= 60 ? "text-yellow-600" : "text-red-600 dark:text-red-400"
          }`}>
            {pct !== null ? `${pct}%` : "—"}
          </span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}

interface ScoreCardProps {
  rootCauseScore: number | null;
  evidenceScore: number | null;
  toneScore: number | null;
  hallucinationScore: number | null;
  overallScore: number | null;
  passed: boolean;
}

export function ScoreCard({
  rootCauseScore,
  evidenceScore,
  toneScore,
  hallucinationScore,
  overallScore,
  passed,
}: ScoreCardProps) {
  const overallPct = overallScore !== null ? Math.round(overallScore * 100) : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Overall: {overallPct !== null ? `${overallPct}%` : "—"}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
          passed
            ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800"
            : "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800"
        }`}>
          {passed ? "PASS" : "FAIL"}
        </span>
      </div>

      <div className="space-y-2">
        <ScoreBar label="Root Cause Accuracy" score={rootCauseScore} weight="35%" />
        <ScoreBar label="Evidence Quality" score={evidenceScore} weight="25%" />
        <ScoreBar label="Response Tone" score={toneScore} weight="20%" />
        <ScoreBar label="No Hallucinations" score={hallucinationScore} weight="20%" />
      </div>
    </div>
  );
}
