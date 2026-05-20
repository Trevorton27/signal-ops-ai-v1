import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { fetchLogs, fetchTraces } from "../tools/logs-tool";
import type { InvestigationState } from "../state";

const logger = createLogger("log-analysis-agent");

export async function logAnalysisAgent(
  state: InvestigationState
): Promise<Partial<InvestigationState>> {
  const stepStart = Date.now();

  const step = await prisma.agentStep.create({
    data: {
      investigationRunId: state.runId,
      agentName: "log-analysis",
      status: "running",
      input: { customerId: state.ticket.customerId },
    },
  });

  try {
    const logs = fetchLogs({ customerId: state.ticket.customerId });
    const traces = fetchTraces(state.ticket.customerId);

    const systemPrompt = readFileSync(
      join(process.cwd(), "agents/prompts/log-analysis.md"),
      "utf-8"
    );

    const client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });

    const logsText = logs.slice(0, 20).map((l) =>
      `[${l.timestamp}] ${l.level} ${l.service}: ${l.message} ${JSON.stringify(l.metadata || {})}`
    ).join("\n");

    const tracesText = traces.slice(0, 15).map((t) =>
      `${t.service} → ${t.operation}: ${t.duration}ms [${t.status}]`
    ).join("\n");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Ticket: ${state.ticket.title}\n\nLogs:\n${logsText}\n\nTraces:\n${tracesText}`,
        },
      ],
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    logger.info("Log analysis complete", { errorPatterns: analysis.errorPatterns?.length });

    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "complete",
        output: { ...analysis, logCount: logs.length, traceCount: traces.length },
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
      },
    });

    return { logs, traces };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.agentStep.update({
      where: { id: step.id },
      data: { status: "failed", errorMessage: msg, completedAt: new Date(), durationMs: Date.now() - stepStart },
    });
    logger.error("Log analysis agent failed", { error: msg });
    throw error;
  }
}
