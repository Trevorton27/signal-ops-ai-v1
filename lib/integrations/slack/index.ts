import { SlackClient } from "./client";
import { MockSlackAdapter } from "./mock";
import type { SlackMessage } from "../types";

export type SlackAdapter = {
  name: string;
  type: string;
  isLive: boolean;
  send(message: SlackMessage): Promise<boolean>;
  postApprovalSummary(runId: string, action: string, ticketTitle: string): Promise<void>;
};

export function getSlackAdapter(): SlackAdapter {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) return new SlackClient();
  return new MockSlackAdapter();
}
