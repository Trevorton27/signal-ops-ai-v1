import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { getEnv } from "@/lib/env";
import { prisma } from "@/lib/db";
import { createLogger } from "@/lib/logger";
import { searchDocs } from "../tools/docs-tool";
import type { InvestigationState } from "../state";

const logger = createLogger("knowledge-agent");

export async function knowledgeAgent(
  state: InvestigationState
): Promise<Partial<InvestigationState>> {
  const stepStart = Date.now();

  const step = await prisma.agentStep.create({
    data: {
      investigationRunId: state.runId,
      agentName: "knowledge-retrieval",
      status: "running",
      input: { query: state.ticket.title },
    },
  });

  try {
    const query = state.classification
      ? `${state.ticket.title} ${state.classification.affectedProduct} ${state.classification.category}`
      : state.ticket.title;

    const chunks = await searchDocs(query, 5);

    const systemPrompt = readFileSync(
      join(process.cwd(), "agents/prompts/knowledge-retrieval.md"),
      "utf-8"
    );

    const client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });

    const chunksText = chunks
      .map((c, i) => `### Source: ${c.sourcePath} (chunk ${c.chunkIndex})\n${c.content}`)
      .join("\n\n---\n\n");

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Ticket Summary: ${state.classification?.summary || state.ticket.title}\n\nRetrieved Knowledge:\n${chunksText}`,
        },
      ],
    });

    const knowledge = JSON.parse(response.choices[0].message.content || "{}");
    logger.info("Knowledge retrieval complete", { chunksFound: chunks.length });

    await prisma.agentStep.update({
      where: { id: step.id },
      data: {
        status: "complete",
        output: { ...knowledge, chunksRetrieved: chunks.length, sources: chunks.map((c) => c.sourcePath) },
        completedAt: new Date(),
        durationMs: Date.now() - stepStart,
      },
    });

    return { knowledgeChunks: chunks };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    await prisma.agentStep.update({
      where: { id: step.id },
      data: { status: "failed", errorMessage: msg, completedAt: new Date(), durationMs: Date.now() - stepStart },
    });
    logger.error("Knowledge agent failed", { error: msg });
    throw error;
  }
}
