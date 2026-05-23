import { getEnv } from "@/lib/env";
import type { SentryIssue, IIntegrationAdapter, IntegrationTestResult } from "../types";

export class SentryClient implements IIntegrationAdapter {
  readonly name = "Sentry";
  readonly type = "sentry";
  readonly isLive = true;

  private get token() {
    return getEnv().SENTRY_AUTH_TOKEN!;
  }

  async testConnection(): Promise<IntegrationTestResult> {
    const start = Date.now();
    try {
      const response = await fetch("https://sentry.io/api/0/projects/", {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      return {
        ok: response.ok,
        message: response.ok ? "Connected to Sentry" : `HTTP ${response.status}`,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return { ok: false, message: error instanceof Error ? error.message : "Connection failed" };
    }
  }

  async getIssues(orgSlug: string, projectSlug: string): Promise<SentryIssue[]> {
    const response = await fetch(
      `https://sentry.io/api/0/projects/${orgSlug}/${projectSlug}/issues/?limit=25`,
      { headers: { Authorization: `Bearer ${this.token}` } }
    );

    if (!response.ok) throw new Error(`Sentry API error: ${response.status}`);

    const data = (await response.json()) as Array<Record<string, unknown>>;
    return data.map((issue) => ({
      id: String(issue.id),
      title: String(issue.title),
      culprit: String(issue.culprit ?? ""),
      level: String(issue.level),
      status: String(issue.status),
      count: Number(issue.count),
      userCount: Number(issue.userCount),
      firstSeen: String(issue.firstSeen),
      lastSeen: String(issue.lastSeen),
      project: projectSlug,
    }));
  }
}
