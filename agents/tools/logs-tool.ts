import logsData from "@/data/logs.json";
import tracesData from "@/data/traces.json";
import type { LogEntry, TraceSpan } from "../state";

interface LogFilter {
  customerId?: string;
  startTime?: string;
  endTime?: string;
  level?: string;
}

export function fetchLogs(filter: LogFilter): LogEntry[] {
  let logs = logsData as LogEntry[];

  if (filter.customerId) {
    logs = logs.filter((l) => l.customerId === filter.customerId);
  }
  if (filter.startTime) {
    logs = logs.filter((l) => new Date(l.timestamp) >= new Date(filter.startTime!));
  }
  if (filter.endTime) {
    logs = logs.filter((l) => new Date(l.timestamp) <= new Date(filter.endTime!));
  }
  if (filter.level) {
    const level = filter.level;
    logs = logs.filter((l) => l.level === level.toUpperCase());
  }

  return logs;
}

export function fetchTraces(customerId?: string): TraceSpan[] {
  const traces = tracesData as Array<{ traceId: string; spans: TraceSpan[] }>;
  const allSpans: TraceSpan[] = traces.flatMap((t) => t.spans);

  // For demo, return all traces (production would filter by customerId via trace metadata)
  return allSpans;
}
