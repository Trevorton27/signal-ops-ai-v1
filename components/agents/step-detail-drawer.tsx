"use client";

import { useState, useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TokenUsageBadge } from "./token-usage-badge";
import { EvidenceCard } from "./evidence-panel";
import { formatDuration } from "@/lib/utils";
import type { TokenUsage } from "@/lib/agent-utils";
import type { AgentStep } from "@prisma/client";

const MODEL_FOR_AGENT: Record<string, string> = {
  intake: "gpt-4o-mini",
  "log-analysis": "gpt-4o-mini",
  "knowledge-retrieval": "gpt-4o-mini",
  guardrails: "gpt-4o-mini",
  "root-cause": "gpt-4o",
  "response-drafting": "gpt-4o",
  escalation: "gpt-4o",
};

interface StepDetailDrawerProps {
  step: AgentStep | null;
  runId: string;
  onClose: () => void;
}

export function StepDetailDrawer({ step, runId, onClose }: StepDetailDrawerProps) {
  const [fullStep, setFullStep] = useState<AgentStep | null>(step);

  useEffect(() => {
    if (!step) return;
    setFullStep(step);

    // Fetch full step detail with all fields
    fetch(`/api/investigations/${runId}/steps/${step.id}`)
      .then((r) => r.json())
      .then((data: AgentStep) => setFullStep(data))
      .catch(() => { /* keep local step */ });
  }, [step, runId]);

  const isOpen = step !== null;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-over panel */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {fullStep && (
          <div className="p-6 space-y-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wide font-mono">
                    {fullStep.agentName}
                  </span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className={`text-xs font-medium ${
                    fullStep.status === "complete" ? "text-green-600" :
                    fullStep.status === "failed" ? "text-red-600" :
                    fullStep.status === "running" ? "text-blue-600" : "text-slate-400"
                  }`}>
                    {fullStep.status}
                  </span>
                </div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 capitalize">
                  {fullStep.agentName.replace(/-/g, " ")} Agent
                </h2>
              </div>
              <Button variant="outline" size="sm" onClick={onClose} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Metrics row */}
            <div className="flex flex-wrap gap-2">
              {fullStep.durationMs && (
                <Badge variant="outline" className="text-xs font-mono">
                  {formatDuration(fullStep.durationMs)}
                </Badge>
              )}
              {fullStep.tokenUsage && (
                <TokenUsageBadge
                  tokenUsage={fullStep.tokenUsage as unknown as TokenUsage}
                  model={MODEL_FOR_AGENT[fullStep.agentName] ?? "gpt-4o-mini"}
                />
              )}
              {fullStep.confidenceScore !== null && fullStep.confidenceScore !== undefined && (
                <Badge variant="outline" className="text-xs">
                  {(fullStep.confidenceScore * 100).toFixed(0)}% confidence
                </Badge>
              )}
            </div>

            {/* Evidence sources */}
            <EvidenceCard step={fullStep} />

            {/* Input */}
            {fullStep.input && (
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Input</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 rounded-md p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                    {JSON.stringify(fullStep.input, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Output */}
            {fullStep.output && (
              <Card>
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Output</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <pre className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 rounded-md p-3 overflow-auto max-h-80 whitespace-pre-wrap">
                    {JSON.stringify(fullStep.output, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Error */}
            {fullStep.errorMessage && (
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="px-4 py-3">
                  <p className="text-xs text-red-600 dark:text-red-400">{fullStep.errorMessage}</p>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <div className="text-xs text-slate-400 dark:text-slate-500 space-y-0.5">
              <div>Started: {new Date(fullStep.startedAt).toLocaleString()}</div>
              {fullStep.completedAt && (
                <div>Completed: {new Date(fullStep.completedAt).toLocaleString()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
