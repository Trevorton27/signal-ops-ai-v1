import type { DatadogLogEntry, IIntegrationAdapter, IntegrationTestResult } from "../types";

const MOCK_LOGS: DatadogLogEntry[] = [
  {
    id: "dd-001",
    timestamp: "2024-01-16T14:23:11Z",
    level: "error",
    service: "payment-service",
    message: "Failed to process payment: timeout after 30000ms",
    host: "prod-worker-03",
    tags: ["env:production", "region:us-east-1", "version:2.4.1"],
  },
  {
    id: "dd-002",
    timestamp: "2024-01-16T14:23:45Z",
    level: "error",
    service: "api-gateway",
    message: "Upstream connection error: payment-service unreachable",
    host: "prod-gateway-01",
    tags: ["env:production", "region:us-east-1"],
  },
  {
    id: "dd-003",
    timestamp: "2024-01-16T14:24:02Z",
    level: "warn",
    service: "payment-service",
    message: "Circuit breaker tripped: opening circuit for payment-processor",
    host: "prod-worker-03",
    tags: ["env:production", "region:us-east-1"],
  },
  {
    id: "dd-004",
    timestamp: "2024-01-16T14:24:30Z",
    level: "error",
    service: "auth-service",
    message: "JWT validation failed: token expired or invalid signature",
    host: "prod-auth-02",
    tags: ["env:production", "region:eu-west-1"],
  },
];

export class MockDatadogAdapter implements IIntegrationAdapter {
  readonly name = "Datadog";
  readonly type = "datadog";
  readonly isLive = false;

  async testConnection(): Promise<IntegrationTestResult> {
    return { ok: true, message: "Mock mode — using enhanced fixture data", latencyMs: 0 };
  }

  getLogs(filter?: { service?: string; level?: string }): DatadogLogEntry[] {
    let logs = MOCK_LOGS;
    if (filter?.service) logs = logs.filter((l) => l.service === filter.service);
    if (filter?.level) logs = logs.filter((l) => l.level === filter.level);
    return logs;
  }
}
