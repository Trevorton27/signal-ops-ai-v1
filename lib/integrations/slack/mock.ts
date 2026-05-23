import { createLogger } from "@/lib/logger";
import type { IIntegrationAdapter, IntegrationTestResult, SlackMessage } from "../types";

const logger = createLogger("slack-mock");

export class MockSlackAdapter implements IIntegrationAdapter {
  readonly name = "Slack";
  readonly type = "slack";
  readonly isLive = false;

  async testConnection(): Promise<IntegrationTestResult> {
    return { ok: true, message: "Mock mode — messages logged to console", latencyMs: 0 };
  }

  async send(message: SlackMessage): Promise<boolean> {
    logger.info("[MOCK SLACK] Message would be sent", { text: message.text });
    return true;
  }

  async postApprovalSummary(runId: string, action: string, ticketTitle: string): Promise<void> {
    logger.info("[MOCK SLACK] Approval summary", { runId, action, ticketTitle });
  }
}
