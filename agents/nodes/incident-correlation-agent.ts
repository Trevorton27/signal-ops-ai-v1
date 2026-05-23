import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { fetchIncidents } from "../tools/incident-tool";
import { getSentryAdapter } from "@/lib/integrations/sentry";
import type { InvestigationState } from "../state";

const logger = createLogger("incident-correlation-agent");

export async function incidentCorrelationAgent(
  state: InvestigationState
): Promise<Partial<InvestigationState>> {
  const stepStart = Date.now();

  const step = await prisma.agentStep.create({
    data: {
      investigationRunId: state.runId,
      agentName: "incident-correlation",
      status: "running",
      input: {
        affectedProduct: state.classification?.affectedProduct,
        region: state.customer?.region,
      },
    },
  });

  try {
    const incidents = fetchIncidents({
      affectedProduct: state.classification?.affectedProduct,
      region: state.customer?.region,
      ticketCreatedAt: state.ticket.createdAt.toISOString(),
    });

    // Phase 5: Supplement with Sentry issues
    const sentryAdapter = getSentryAdapter();
    const sentryIssues = await Promise.resolve(
      sentryAdapter.getIssues("demo-org", "payment-service")
    );

    const output = {
      incidentsFound: incidents.length,
      incidents: incidents.map((i) => ({
        id: i.id,
        title: i.title,
        status: i.status,
        severity: i.severity,
        startTime: i.startTime,
        rootCause: i.rootCause,
      })),
      sentryIssues: sentryIssues.slice(0, 3).map((s) => ({
        id: s.id,
        title: s.title,
        level: s.level,
        count: s.count,
        lastSeen: s.lastSeen,
      })),
    };

    logger.info("Incident correlation complete", {
      incidentsFound: incidents.length,
      sentryIssues: sentryIssues.length,
    });

    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "complete",
        output,
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
      },
    });

    return { incidents };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.agentStep.update({
      where: { id: step.id },
      data: { status: "failed", errorMessage: msg, completedAt: new Date(), durationMs: Date.now() - stepStart },
    });
    logger.error("Incident correlation agent failed", { error: msg });
    throw error;
  }
}
