/**
 * Phase 4: Export approved ApprovalAudit records into EvalExample rows.
 * Run: npx tsx scripts/export-eval-data.ts
 */
import { PrismaClient } from "@prisma/client";
import type { Hypothesis, KnowledgeChunk } from "../agents/state";

const prisma = new PrismaClient();

async function main() {
  const approvals = await prisma.approvalAudit.findMany({
    where: { action: "approved" },
    include: {
      investigationRun: {
        include: {
          ticket: true,
          steps: { orderBy: { startedAt: "asc" } },
        },
      },
    },
  });

  console.log(`Found ${approvals.length} approved audits`);
  let created = 0;

  for (const audit of approvals) {
    const run = audit.investigationRun;
    if (!run.hypotheses) continue;

    const hypotheses = run.hypotheses as unknown as Hypothesis[];
    const topHypothesis = hypotheses[0];
    if (!topHypothesis) continue;

    // Skip if already exported
    const existing = await prisma.evalExample.findFirst({
      where: { sourceRunId: run.id },
    });
    if (existing) continue;

    // Extract knowledge chunks from the knowledge-retrieval step
    const knowledgeStep = run.steps.find((s) => s.agentName === "knowledge-retrieval");
    const knowledgeOutput = (knowledgeStep?.output ?? {}) as Record<string, unknown>;
    const evidenceChunks: KnowledgeChunk[] = Array.isArray(knowledgeOutput.chunks)
      ? (knowledgeOutput.chunks as KnowledgeChunk[])
      : [];

    await prisma.evalExample.create({
      data: {
        sourceRunId: run.id,
        ticketTitle: run.ticket.title,
        ticketDescription: run.ticket.description,
        expectedRootCause: topHypothesis.title,
        expectedSeverity: run.ticket.severity,
        expectedEvidenceKeywords: JSON.parse(JSON.stringify(
          topHypothesis.evidence.flatMap((e) => e.split(" ").filter((w) => w.length > 5)).slice(0, 10)
        )),
        approvedReply: audit.finalDraft || audit.originalDraft,
        evidenceChunks: JSON.parse(JSON.stringify(evidenceChunks.slice(0, 5))),
      },
    });

    created++;
    console.log(`Created eval example from run ${run.id}`);
  }

  console.log(`Done. Created ${created} new eval examples.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
