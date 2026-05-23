import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { runInvestigation } from "@/agents/graph";
import { suggestClusters } from "@/lib/incident-clustering";
import { getSlackAdapter } from "@/lib/integrations/slack";
import { createLogger } from "@/lib/logger";

const logger = createLogger("inngest-function");

// Phase 3: HITL Approval — restructured with step.waitForEvent
export const runInvestigationFunction = inngest.createFunction(
  {
    id: "run-investigation",
    name: "Run Support Ticket Investigation",
    retries: 2,
    timeouts: { finish: "72h" }, // Extended for HITL 72h wait window
  },
  { event: "investigation/run.requested" },
  async ({ event, step }) => {
    const { ticketId, runId } = event.data as { ticketId: string; runId: string };

    logger.info("Inngest function triggered", { ticketId, runId });

    // Step 1: Run the full investigation graph (all agents including guardrails)
    await step.run("execute-investigation-graph", async () => {
      await runInvestigation(ticketId, runId);
    });

    // Step 2: Mark as awaiting human approval
    await step.run("set-awaiting-approval", async () => {
      await prisma.investigationRun.update({
        where: { id: runId },
        data: {
          status: "awaiting_approval",
          approvalStatus: "pending",
        },
      });
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: "in_progress" },
      });
    });

    // Step 3: Wait up to 72h for a human approval decision
    const approvalEvent = await step.waitForEvent("wait-for-approval", {
      event: "investigation/approval.submitted",
      match: "data.runId",
      timeout: "72h",
    });

    // Step 4: Process the approval (or handle timeout)
    await step.run("execute-approved-actions", async () => {
      if (!approvalEvent) {
        // Timeout — auto-complete without approval
        await prisma.investigationRun.update({
          where: { id: runId },
          data: {
            status: "complete",
            completedAt: new Date(),
            approvalStatus: "timeout",
          },
        });
        logger.info("Investigation auto-completed after approval timeout", { runId });
        return;
      }

      const { action, editedReply, note, actorId, originalDraft } = approvalEvent.data as {
        action: string;
        editedReply?: string;
        note?: string;
        actorId: string;
        originalDraft: string;
      };

      // Write audit trail
      await prisma.approvalAudit.create({
        data: {
          investigationRunId: runId,
          action,
          actorId,
          originalDraft: originalDraft || "",
          finalDraft: editedReply || originalDraft || null,
          note: note || null,
        },
      });

      // Update run with approval outcome
      await prisma.investigationRun.update({
        where: { id: runId },
        data: {
          status: "complete",
          completedAt: new Date(),
          approvalStatus: action,
          approvedAt: new Date(),
          approvedBy: actorId,
          editedReply: action === "approved" ? (editedReply || null) : null,
          reviewerNote: note || null,
        },
      });

      // Phase 5: Post Slack notification on approval
      const run = await prisma.investigationRun.findUnique({
        where: { id: runId },
        include: { ticket: true },
      });

      if (run) {
        const slack = getSlackAdapter();
        await slack.postApprovalSummary(runId, action, run.ticket.title);
      }

      logger.info("Investigation approval processed", { runId, action, actorId });
    });

    return { ticketId, runId, status: "complete" };
  }
);

// Phase 6: Cluster tickets into incidents when a ticket is created
export const clusterTicketsFunction = inngest.createFunction(
  {
    id: "cluster-tickets",
    name: "Cluster Related Tickets into Incidents",
    retries: 1,
    timeouts: { finish: "5m" },
  },
  { event: "ticket/created" },
  async ({ step }) => {
    const clusters = await step.run("find-clusters", async () => {
      return suggestClusters();
    });

    logger.info("Ticket clustering complete", { clustersFound: clusters.length });

    // Auto-create incidents for clusters with 3+ tickets
    for (const cluster of clusters) {
      if (cluster.ticketIds.length < 3) continue;

      await step.run(`create-incident-${cluster.affectedProduct}`, async () => {
        const existing = await prisma.incident.findFirst({
          where: {
            affectedProduct: cluster.affectedProduct,
            affectedRegion: cluster.affectedRegion,
            status: { not: "resolved" },
          },
        });

        if (existing) {
          // Add new tickets to existing incident
          const existingTicketIds = (await prisma.incidentTicket.findMany({
            where: { incidentId: existing.id },
            select: { ticketId: true },
          })).map((it) => it.ticketId);

          const newTicketIds = cluster.ticketIds.filter((id) => !existingTicketIds.includes(id));
          if (newTicketIds.length > 0) {
            await prisma.incidentTicket.createMany({
              data: newTicketIds.map((ticketId) => ({ incidentId: existing.id, ticketId })),
              skipDuplicates: true,
            });
          }
        } else {
          const incident = await prisma.incident.create({
            data: {
              title: `${cluster.affectedProduct} issues in ${cluster.affectedRegion}`,
              severity: "P1",
              affectedProduct: cluster.affectedProduct,
              affectedRegion: cluster.affectedRegion,
              internalTimeline: JSON.parse(JSON.stringify([{
                timestamp: new Date().toISOString(),
                event: `Auto-detected: ${cluster.ticketIds.length} related tickets clustered`,
                author: "system",
              }])),
            },
          });

          await prisma.incidentTicket.createMany({
            data: cluster.ticketIds.map((ticketId) => ({ incidentId: incident.id, ticketId })),
            skipDuplicates: true,
          });

          logger.info("Auto-created incident from cluster", {
            incidentId: incident.id,
            ticketCount: cluster.ticketIds.length,
          });
        }
      });
    }

    return { clustersFound: clusters.length };
  }
);
