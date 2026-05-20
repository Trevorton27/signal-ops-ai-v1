import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { fetchCustomer, fetchDeployments } from "../tools/customer-tool";
import type { InvestigationState } from "../state";

const logger = createLogger("customer-context-agent");

export async function customerContextAgent(
  state: InvestigationState
): Promise<Partial<InvestigationState>> {
  const stepStart = Date.now();

  const step = await prisma.agentStep.create({
    data: {
      investigationRunId: state.runId,
      agentName: "customer-context",
      status: "running",
      input: { customerId: state.ticket.customerId },
    },
  });

  try {
    const customer = await fetchCustomer(state.ticket.customerId);

    const deployments = fetchDeployments({
      region: customer.region,
    });

    const output = {
      customer: {
        id: customer.id,
        name: customer.name,
        company: customer.company,
        plan: customer.plan,
        region: customer.region,
        industry: customer.industry,
        accountAge: customer.accountAge,
      },
      recentDeployments: JSON.parse(JSON.stringify(deployments.slice(0, 5))),
    };

    logger.info("Customer context loaded", { customerId: customer.id, plan: customer.plan });

    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "complete",
        output,
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
      },
    });

    return {
      customer,
      deployments,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "failed",
        errorMessage: msg,
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
      },
    });
    logger.error("Customer context agent failed", { error: msg });
    throw error;
  }
}
