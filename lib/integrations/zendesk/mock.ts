import type { ZendeskTicket, IIntegrationAdapter, IntegrationTestResult } from "../types";

const MOCK_TICKETS: ZendeskTicket[] = [
  {
    id: "zd-10042",
    subject: "Payment processing failures affecting EU customers",
    description: "Multiple enterprise customers are reporting payment failures since the 2.4.1 deployment. Error rate is above 15% in eu-west-1.",
    status: "open",
    priority: "urgent",
    requesterEmail: "support@acmecorp.com",
    createdAt: "2024-01-16T13:45:00Z",
  },
  {
    id: "zd-10043",
    subject: "API latency spike — p99 at 8 seconds",
    description: "Our monitoring shows API response times have increased 10x in the last 2 hours. All requests to /api/data are affected.",
    status: "open",
    priority: "high",
    requesterEmail: "devops@globex.io",
    createdAt: "2024-01-16T14:10:00Z",
  },
];

export class MockZendeskAdapter implements IIntegrationAdapter {
  readonly name = "Zendesk";
  readonly type = "zendesk";
  readonly isLive = false;

  async testConnection(): Promise<IntegrationTestResult> {
    return { ok: true, message: "Mock mode — using simulated tickets", latencyMs: 0 };
  }

  getTickets(): ZendeskTicket[] {
    return MOCK_TICKETS;
  }

  createTicketFromTemplate(title: string, description: string, requesterEmail = "demo@example.com"): ZendeskTicket {
    return {
      id: `zd-${Date.now()}`,
      subject: title,
      description,
      status: "new",
      priority: "normal",
      requesterEmail,
      createdAt: new Date().toISOString(),
    };
  }
}
