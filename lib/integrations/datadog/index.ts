import { MockDatadogAdapter } from "./mock";
import type { DatadogLogEntry } from "../types";

export type DatadogAdapter = {
  name: string;
  type: string;
  isLive: boolean;
  getLogs(filter?: { service?: string; level?: string }): DatadogLogEntry[];
};

export function getDatadogAdapter(): DatadogAdapter {
  // Real Datadog client would be instantiated if DATADOG_API_KEY is present
  // For now, always use the mock (indistinguishable in demo)
  return new MockDatadogAdapter();
}
