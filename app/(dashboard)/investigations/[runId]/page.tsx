import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { AgentTimeline } from "@/components/agents/agent-timeline";
import { HypothesisCard } from "@/components/agents/hypothesis-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatRelativeTime, formatDuration } from "@/lib/utils";
import Link from "next/link";
import type { Hypothesis } from "@/agents/state";

async function getRun(runId: string) {
  return prisma.investigationRun.findUnique({
    where: { id: runId },
    include: {
      ticket: { include: { customer: true } },
      steps: { orderBy: { startedAt: "asc" } },
    },
  });
}

const statusColor: Record<string, string> = {
  complete: "text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950/40 dark:border-green-800",
  running: "text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-400 dark:bg-blue-950/40 dark:border-blue-800",
  pending: "text-slate-700 bg-slate-50 border-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:border-slate-700",
  failed: "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/40 dark:border-red-800",
};

export default async function InvestigationRunPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { runId } = await params;
  const run = await getRun(runId);
  if (!run) notFound();

  const duration = run.completedAt
    ? run.completedAt.getTime() - run.startedAt.getTime()
    : null;

  const hypotheses = (run.hypotheses as unknown as Hypothesis[]) ?? [];

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="text-sm text-slate-500">
        <Link href="/investigations" className="hover:text-slate-900 dark:hover:text-slate-100">Investigations</Link>
        <span className="mx-2">/</span>
        <span className="font-mono text-xs">{run.id.slice(0, 8)}...</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{run.ticket.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-slate-500 dark:text-slate-400">
            <span>{run.ticket.customer.company}</span>
            <span>•</span>
            <span>{run.ticket.customer.plan} plan</span>
            <span>•</span>
            <span>{formatRelativeTime(run.startedAt)}</span>
            {duration && <span>• {formatDuration(duration)}</span>}
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${statusColor[run.status] ?? statusColor.pending}`}>
          {run.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Agent Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <AgentTimeline steps={run.steps} runId={run.id} runStatus={run.status} />

          {/* Customer Draft Reply */}
          {run.summary && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Drafted Customer Reply</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-slate dark:prose-invert max-w-none whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {run.summary}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Escalation Note */}
          {run.escalationNote && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  Internal Escalation Note
                  <Badge variant="outline" className="text-xs">Engineering</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 overflow-auto max-h-64 whitespace-pre-wrap">
                  {run.escalationNote}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Hypotheses */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Root Cause Hypotheses</h2>
          {hypotheses.length === 0 && run.status !== "complete" && (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {run.status === "running" ? "Analysis in progress..." : "No hypotheses yet."}
            </p>
          )}
          {hypotheses.map((h, i) => (
            <HypothesisCard key={h.id || i} hypothesis={h} rank={i + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}
