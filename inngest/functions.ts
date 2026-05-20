import { inngest } from "./client";
import { runInvestigation } from "@/agents/graph";
import { createLogger } from "@/lib/logger";

const logger = createLogger("inngest-function");

export const runInvestigationFunction = inngest.createFunction(
  {
    id: "run-investigation",
    name: "Run Support Ticket Investigation",
    retries: 2,
    timeouts: { finish: "10m" },
  },
  { event: "investigation/run.requested" },
  async ({ event, step }) => {
    const { ticketId, runId } = event.data;

    logger.info("Inngest function triggered", { ticketId, runId });

    await step.run("execute-investigation-graph", async () => {
      await runInvestigation(ticketId, runId);
    });

    return { ticketId, runId, status: "complete" };
  }
);
