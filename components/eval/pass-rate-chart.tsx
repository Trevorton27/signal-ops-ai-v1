import { formatRelativeTime } from "@/lib/utils";

interface RunSummary {
  id: string;
  name: string;
  passRate: number | null;
  avgScore: number | null;
  startedAt: Date;
  status: string;
}

interface PassRateChartProps {
  runs: RunSummary[];
}

export function PassRateChart({ runs }: PassRateChartProps) {
  const completed = runs.filter((r) => r.status === "complete" && r.passRate !== null);
  if (completed.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No completed runs yet.</p>;
  }

  const maxBarHeight = 80;

  return (
    <div className="space-y-3">
      {/* Bar chart */}
      <div className="flex items-end gap-2 h-24">
        {completed.slice(-12).map((run) => {
          const pct = (run.passRate ?? 0) * 100;
          const height = Math.max(4, (pct / 100) * maxBarHeight);
          const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";

          return (
            <div
              key={run.id}
              className="flex-1 flex flex-col items-center gap-1 group"
              title={`${run.name}: ${pct.toFixed(0)}% pass rate`}
            >
              <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                {pct.toFixed(0)}%
              </div>
              <div
                className={`w-full ${color} rounded-t transition-all`}
                style={{ height: `${height}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* Baseline */}
      <div className="border-t border-slate-200 dark:border-slate-700" />

      {/* X labels */}
      <div className="flex gap-2">
        {completed.slice(-12).map((run) => (
          <div key={run.id} className="flex-1 text-xs text-slate-400 dark:text-slate-500 text-center truncate">
            {formatRelativeTime(run.startedAt)}
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 pt-2">
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {((completed[completed.length - 1]?.passRate ?? 0) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">Latest Pass Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {((completed.reduce((s, r) => s + (r.passRate ?? 0), 0) / completed.length) * 100).toFixed(0)}%
          </div>
          <div className="text-xs text-slate-500">Avg Pass Rate</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">{completed.length}</div>
          <div className="text-xs text-slate-500">Total Runs</div>
        </div>
      </div>
    </div>
  );
}
