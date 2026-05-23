import type { SentryIssue } from "../types";

export const MOCK_SENTRY_ISSUES: SentryIssue[] = [
  {
    id: "sentry-001",
    title: "TypeError: Cannot read properties of undefined (reading 'userId')",
    culprit: "api/payments/route.ts in handlePaymentRequest",
    level: "error",
    status: "unresolved",
    count: 847,
    userCount: 234,
    firstSeen: "2024-01-15T08:23:11Z",
    lastSeen: "2024-01-16T14:55:33Z",
    project: "payment-service",
  },
  {
    id: "sentry-002",
    title: "Connection timeout to database pool after 30000ms",
    culprit: "lib/db.ts in getPrismaClient",
    level: "error",
    status: "unresolved",
    count: 2341,
    userCount: 189,
    firstSeen: "2024-01-14T22:10:00Z",
    lastSeen: "2024-01-16T15:01:12Z",
    project: "api-gateway",
  },
  {
    id: "sentry-003",
    title: "Stripe webhook signature verification failed",
    culprit: "api/webhooks/stripe/route.ts line 42",
    level: "warning",
    status: "resolved",
    count: 56,
    userCount: 0,
    firstSeen: "2024-01-13T10:00:00Z",
    lastSeen: "2024-01-13T12:30:00Z",
    project: "payment-service",
  },
  {
    id: "sentry-004",
    title: "AuthenticationError: Invalid JWT token signature",
    culprit: "middleware.ts in validateToken",
    level: "error",
    status: "unresolved",
    count: 1203,
    userCount: 567,
    firstSeen: "2024-01-15T16:45:22Z",
    lastSeen: "2024-01-16T15:10:44Z",
    project: "auth-service",
  },
];

export function getMockSentryIssues(filter?: { project?: string; level?: string }): SentryIssue[] {
  let issues = MOCK_SENTRY_ISSUES;
  if (filter?.project) issues = issues.filter((i) => i.project === filter.project);
  if (filter?.level) issues = issues.filter((i) => i.level === filter.level);
  return issues;
}
