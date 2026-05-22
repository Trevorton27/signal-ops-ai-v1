"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, ExternalLink, Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";
import type { Ticket, InvestigationRun, AgentStep } from "@prisma/client";

type RunWithSteps = InvestigationRun & { steps: AgentStep[] };

interface InvestigationPanelProps {
  ticket: Ticket;
  latestRun: RunWithSteps | null;
}

const runStatusStyles: Record<string, string> = {
  pending: "text-slate-600 bg-slate-50 border-slate-200",
  running: "text-blue-600 bg-blue-50 border-blue-200",
  complete: "text-green-700 bg-green-50 border-green-200",
  failed: "text-red-600 bg-red-50 border-red-200",
};

export function InvestigationPanel({ ticket, latestRun }: InvestigationPanelProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRun() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: ticket.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to start investigation");
      }
      const { runId } = await res.json();
      router.push(`/investigations/${runId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start");
      setRunning(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Investigation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {latestRun ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">Latest run</span>
              <Badge
                variant="outline"
                className={`text-xs capitalize ${runStatusStyles[latestRun.status] ?? ""}`}
              >
                {latestRun.status}
              </Badge>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatRelativeTime(latestRun.startedAt)}
              <span>· {latestRun.steps.length} steps</span>
            </div>

            {latestRun.status === "complete" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/investigations/${latestRun.id}`)}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                View Full Report
              </Button>
            )}

            {latestRun.status === "running" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => router.push(`/investigations/${latestRun.id}`)}
              >
                View Live Progress
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">No investigation run yet.</p>
        )}

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded px-2 py-1.5">
            {error}
          </p>
        )}

        <Button
          className="w-full"
          onClick={handleRun}
          disabled={running}
          size="sm"
        >
          <Play className="w-3.5 h-3.5 mr-1.5" />
          {running ? "Starting..." : "Run Investigation"}
        </Button>
      </CardContent>
    </Card>
  );
}
