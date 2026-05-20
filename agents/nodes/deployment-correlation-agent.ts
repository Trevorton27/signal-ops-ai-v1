import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { fetchDeployments } from "../tools/customer-tool";
import type { InvestigationState, Deployment } from "../state";

const logger = createLogger("deployment-correlation-agent");

export async function deploymentCorrelationAgent(
  state: InvestigationState
): Promise<Partial<InvestigationState>> {
  const stepStart = Date.now();

  const step = await prisma.agentStep.create({
    data: {
      investigationRunId: state.runId,
      agentName: "deployment-correlation",
      status: "running",
      input: {
        region: state.customer?.region,
        affectedProduct: state.classification?.affectedProduct,
      },
    },
  });

  try {
    const allDeployments = fetchDeployments({ region: state.customer?.region });

    // Find deployments within 48 hours of the ticket
    const ticketTime = new Date(state.ticket.createdAt).getTime();
    const window = 48 * 60 * 60 * 1000;
    const relevantDeployments = allDeployments.filter((d: Deployment) => {
      const deployTime = new Date(d.timestamp).getTime();
      return Math.abs(ticketTime - deployTime) <= window;
    });

    const output = {
      totalDeployments: allDeployments.length,
      relevantDeployments: relevantDeployments.length,
      deployments: relevantDeployments.map((d: Deployment) => ({
        id: d.id,
        service: d.service,
        version: d.version,
        timestamp: d.timestamp,
        status: d.status,
        changedEnvVars: d.changedEnvVars,
        notes: d.notes,
      })),
    };

    logger.info("Deployment correlation complete", { relevantDeployments: relevantDeployments.length });

    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "complete",
        output,
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
      },
    });

    return { deployments: relevantDeployments };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.agentStep.update({
      where: { id: step.id },
      data: { status: "failed", errorMessage: msg, completedAt: new Date(), durationMs: Date.now() - stepStart },
    });
    logger.error("Deployment correlation agent failed", { error: msg });
    throw error;
  }
}
