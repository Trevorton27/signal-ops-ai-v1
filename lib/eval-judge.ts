import { readFileSync } from "fs";
import { join } from "path";
import OpenAI from "openai";
import { getEnv } from "./env";

export interface JudgeScores {
  rootCauseScore: number;    // 0–1: did the output name the correct root cause?
  evidenceScore: number;     // 0–1: are evidence items specific and correct?
  toneScore: number;         // 0–1: is the customer reply professional and empathetic?
  hallucinationScore: number;// 0–1: 1=no hallucination, 0=fabricated facts
  overallScore: number;      // weighted average
  passed: boolean;           // overall >= 0.7
  reasoning: string;
}

export interface JudgeInput {
  ticketTitle: string;
  ticketDescription: string;
  expectedRootCause: string;
  expectedSeverity: string;
  expectedEvidenceKeywords: string[];
  approvedReply: string;
  actualRootCause: string;
  actualReply: string;
  hypotheses: Array<{ title: string; confidence: number; evidence: string[] }>;
}

export async function judgeInvestigation(input: JudgeInput): Promise<JudgeScores> {
  const systemPrompt = readFileSync(
    join(process.cwd(), "agents/prompts/eval-judge.md"),
    "utf-8"
  );

  const client = new OpenAI({ apiKey: getEnv().OPENAI_API_KEY });

  const userContent = `
## Evaluation Input

### Ticket
Title: ${input.ticketTitle}
Description: ${input.ticketDescription}

### Expected Values
Root Cause: ${input.expectedRootCause}
Severity: ${input.expectedSeverity}
Evidence Keywords: ${input.expectedEvidenceKeywords.join(", ")}
Approved Reply Sample: ${input.approvedReply.slice(0, 300)}

### Actual Output
Top Hypothesis: ${input.actualRootCause}
Hypotheses:
${input.hypotheses.map((h, i) => `${i + 1}. [${h.confidence}%] ${h.title}`).join("\n")}
Evidence Items: ${input.hypotheses.flatMap((h) => h.evidence).slice(0, 5).join(" | ")}
Generated Reply: ${input.actualReply.slice(0, 400)}
`.trim();

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const result = JSON.parse(response.choices[0].message.content || "{}") as Record<string, unknown>;

  const rootCauseScore = typeof result.rootCauseScore === "number" ? Math.min(1, Math.max(0, result.rootCauseScore)) : 0;
  const evidenceScore = typeof result.evidenceScore === "number" ? Math.min(1, Math.max(0, result.evidenceScore)) : 0;
  const toneScore = typeof result.toneScore === "number" ? Math.min(1, Math.max(0, result.toneScore)) : 0;
  const hallucinationScore = typeof result.hallucinationScore === "number" ? Math.min(1, Math.max(0, result.hallucinationScore)) : 0.5;

  const overallScore = rootCauseScore * 0.35 + evidenceScore * 0.25 + toneScore * 0.2 + hallucinationScore * 0.2;

  return {
    rootCauseScore,
    evidenceScore,
    toneScore,
    hallucinationScore,
    overallScore,
    passed: overallScore >= 0.7,
    reasoning: typeof result.reasoning === "string" ? result.reasoning : "",
  };
}
