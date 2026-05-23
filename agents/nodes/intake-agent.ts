import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { extractTokenUsage } from "@/lib/agent-utils";
import type { InvestigationState } from "../state";

const logger = createLogger("intake-agent");

export async function intakeAgent(state: InvestigationState): Promise<Partial<InvestigationState>> {
  const stepStart = Date.now();
  const model = "gpt-4o-mini";

  const step = await prisma.agentStep.create({
    data: {
      investigationRunId: state.runId,
      agentName: "intake",
      status: "running",
      input: { ticketId: state.ticketId, title: state.ticket.title },
    },
  });

  try {
    const systemPrompt = readFileSync(
      join(process.cwd(), "agents/prompts/intake.md"),
      "utf-8"
    );

    const client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });

    const response = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Ticket Title: ${state.ticket.title}\n\nTicket Description: ${state.ticket.description}`,
        },
      ],
    });

    const classification = JSON.parse(response.choices[0].message.content || "{}");
    const tokenUsage = extractTokenUsage(response);
    logger.info("Intake classification complete", { classification });

    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "complete",
        output: classification,
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
        tokenUsage: tokenUsage ? JSON.parse(JSON.stringify(tokenUsage)) : null,
      },
    });

    return { classification };
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
    logger.error("Intake agent failed", { error: msg });
    throw error;
  }
}
