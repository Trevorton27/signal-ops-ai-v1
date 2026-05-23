"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Ticket, ExternalLink, AlertCircle } from "lucide-react";

const SUBJECTS = [
  "Authentication & SSO",
  "Database timeouts",
  "Billing & payments",
  "API errors (5xx)",
  "Webhooks not firing",
  "Rate limiting",
  "CI/CD pipeline",
  "Performance degradation",
  "Custom",
];

const SEVERITIES = ["critical", "high", "medium", "low"] as const;

interface Customer {
  id: string;
  name: string;
  company: string;
}

interface GeneratedTicket {
  id: string;
  title: string;
  severity: string;
  customer: { company: string };
}

interface TicketGeneratorProps {
  customers: Customer[];
}

export function TicketGenerator({ customers }: TicketGeneratorProps) {
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [customSubject, setCustomSubject] = useState("");
  const [count, setCount] = useState(3);
  const [severity, setSeverity] = useState<typeof SEVERITIES[number]>("medium");
  const [customerId, setCustomerId] = useState("");
  const [autoInvestigate, setAutoInvestigate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ tickets: GeneratedTicket[]; investigationRunIds?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resolvedSubject = subject === "Custom" ? customSubject : subject;

  async function handleGenerate() {
    if (!resolvedSubject.trim()) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/generate-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: resolvedSubject,
          count,
          severity,
          customerId: customerId || undefined,
          autoInvestigate,
        }),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setError(data.error ?? "Generation failed");
        return;
      }

      const data = await res.json() as { tickets: GeneratedTicket[]; investigationRunIds?: string[] };
      setResult(data);
    } catch {
      setError("Request failed — check console");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Ticket className="w-4 h-4" />
          Mock Ticket Generator
        </CardTitle>
        <CardDescription>
          Generate AI-written support tickets to test the investigation pipeline
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subject */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Subject / Topic</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {subject === "Custom" && (
              <input
                type="text"
                placeholder="Describe the topic..."
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 mt-2"
              />
            )}
          </div>

          {/* Count */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Number of tickets <span className="text-slate-400">(1–20)</span>
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Severity */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as typeof SEVERITIES[number])}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Customer */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="">Random</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.company})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Auto-investigate toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={autoInvestigate}
            onChange={(e) => setAutoInvestigate(e.target.checked)}
            className="rounded border-slate-300"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300">
            Auto-trigger investigation for each ticket
          </span>
        </label>

        <Button onClick={handleGenerate} disabled={loading || !resolvedSubject.trim()} className="w-full sm:w-auto">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : `Generate ${count} ticket${count !== 1 ? "s" : ""}`}
        </Button>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Created {result.tickets.length} ticket{result.tickets.length !== 1 ? "s" : ""}
              {result.investigationRunIds ? ` + ${result.investigationRunIds.length} investigation${result.investigationRunIds.length !== 1 ? "s" : ""}` : ""}
            </p>
            <div className="space-y-1.5">
              {result.tickets.map((ticket, i) => (
                <div key={ticket.id} className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 min-w-0">
                    <Badge variant="outline" className="text-xs shrink-0">{ticket.severity}</Badge>
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{ticket.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <a href={`/tickets/${ticket.id}`} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5">
                      Ticket <ExternalLink className="w-3 h-3" />
                    </a>
                    {result.investigationRunIds?.[i] && (
                      <a href={`/investigations/${result.investigationRunIds[i]}`} target="_blank" rel="noreferrer" className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-0.5">
                        Run <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
