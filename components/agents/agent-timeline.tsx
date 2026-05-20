"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check, X, Loader2, Clock } from "lucide-react";
import { AgentOutputCard } from "./agent-output-card";
import { formatDuration } from "@/lib/utils";
import type { AgentStep } from "@prisma/client";

const agentLabels: Record<string, string> = {
  intake: "Ticket Classification",
  "customer-context": "Customer Context",
  "log-analysis": "Log Analysis",
  "knowledge-retrieval": "Knowledge Retrieval",
  "incident-correlation": "Incident Correlation",
  "deployment-correlation": "Deployment Correlation",
  "root-cause": "Root Cause Analysis",
  "response-drafting": "Response Drafting",
  escalation: "Escalation Note",
};

function StepIcon({ status }: { status: string }) {
  if (status === "complete") return <Check className="w-3.5 h-3.5 text-green-600" />;
  if (status === "failed") return <X className="w-3.5 h-3.5 text-red-600" />;
  if (status === "running") return <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin" />;
  return <Clock className="w-3.5 h-3.5 text-slate-400" />;
}

const stepBg: Record<string, string> = {
  complete: "bg-green-50 border-green-200",
  failed: "bg-red-50 border-red-200",
  running: "bg-blue-50 border-blue-200",
  pending: "bg-slate-50 border-slate-200",
};

interface AgentTimelineProps {
  steps: AgentStep[];
  runId: string;
  runStatus: string;
}

export function AgentTimeline({ steps, runId, runStatus }: AgentTimelineProps) {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll while running
  useEffect(() => {
    if (runStatus !== "running" && runStatus !== "pending") return;

    intervalRef.current = setInterval(() => {
      router.refresh();
    }, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [runStatus, router]);

  return (
    <div className="space-y-1">
      <h2 className="text-base font-semibold text-slate-900 mb-3">Agent Pipeline</h2>
      {steps.length === 0 && (runStatus === "pending" || runStatus === "running") && (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Starting agents...
        </div>
      )}
      {steps.map((step, index) => (
        <div key={step.id} className="flex gap-3">
          {/* Timeline connector */}
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${stepBg[step.status] ?? stepBg.pending}`}>
              <StepIcon status={step.status} />
            </div>
            {index < steps.length - 1 && (
              <div className="w-px flex-1 bg-slate-200 my-1" />
            )}
          </div>

          {/* Step content */}
          <div className="flex-1 pb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-slate-900">
                {agentLabels[step.agentName] ?? step.agentName}
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                {step.durationMs && <span>{formatDuration(step.durationMs)}</span>}
                {step.status === "failed" && (
                  <span className="text-red-500">Failed</span>
                )}
              </div>
            </div>

            {step.errorMessage && (
              <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1 mb-2">
                {step.errorMessage}
              </p>
            )}

            {step.output && (
              <AgentOutputCard
                title="Output"
                output={step.output}
                defaultOpen={false}
              />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
