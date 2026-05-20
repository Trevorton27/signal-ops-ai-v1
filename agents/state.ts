import type { Ticket, Customer, InvestigationRun } from "@prisma/client";

export interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  service: string;
  customerId: string;
  message: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
}

export interface TraceSpan {
  spanId: string;
  parentSpanId: string | null;
  service: string;
  operation: string;
  startTime: string;
  duration: number;
  status: string;
  tags?: Record<string, unknown>;
}

export interface Incident {
  id: string;
  title: string;
  status: string;
  severity: string;
  affectedProducts: string[];
  affectedRegions: string[];
  startTime: string;
  endTime: string | null;
  rootCause: string;
  resolution: string;
  customerImpact: string;
}

export interface Deployment {
  id: string;
  service: string;
  version: string;
  timestamp: string;
  author: string;
  environment: string;
  region: string;
  status: string;
  changedEnvVars: string[];
  notes: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  confidence: number; // 0-100
  evidence: string[];
  recommendedAction: string;
  affectedService?: string;
}

export interface KnowledgeChunk {
  id: string;
  sourcePath: string;
  chunkIndex: number;
  content: string;
  similarity?: number;
}

export interface InvestigationState {
  ticketId: string;
  runId: string;
  ticket: Ticket & { customer: Customer };
  customer: Customer;
  classification: {
    category: string;
    severity: string;
    affectedProduct: string;
    summary: string;
  } | null;
  logs: LogEntry[];
  traces: TraceSpan[];
  knowledgeChunks: KnowledgeChunk[];
  incidents: Incident[];
  deployments: Deployment[];
  hypotheses: Hypothesis[];
  draftReply: string;
  escalationNote: string;
}
