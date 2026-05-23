export interface IntegrationTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export interface IIntegrationAdapter {
  readonly name: string;
  readonly type: string;
  readonly isLive: boolean;
  testConnection(): Promise<IntegrationTestResult>;
}

export interface SentryIssue {
  id: string;
  title: string;
  culprit: string;
  level: string;
  status: string;
  count: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  project: string;
}

export interface DatadogLogEntry {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  message: string;
  host: string;
  tags: string[];
}

export interface SlackMessage {
  text: string;
  channel?: string;
  blocks?: unknown[];
}

export interface ZendeskTicket {
  id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  requesterEmail: string;
  createdAt: string;
}
