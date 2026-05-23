"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, ExternalLink, AlertCircle } from "lucide-react";

const SEVERITIES_INCIDENT = ["P0", "P1", "P2"] as const;
const TICKET_SUBJECTS = [
  "Authentication & SSO",
  "Database timeouts",
  "Billing & payments",
  "API errors (5xx)",
  "Webhooks not firing",
  "Rate limiting",
  "CI/CD pipeline",
  "Performance degradation",
];

interface OpenTicket {
  id: string;
  title: string;
  severity: string;
  customer: { company: string };
}

interface Customer {
  id: string;
  name: string;
  company: string;
}

interface IncidentCreatorProps {
  openTickets: OpenTicket[];
  customers: Customer[];
}

export function IncidentCreator({ openTickets, customers }: IncidentCreatorProps) {
  const [mode, setMode] = useState<"existing" | "generate">("existing");

  // Mode A state
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);
  const [incidentTitle, setIncidentTitle] = useState("");
  const [incidentSeverity, setIncidentSeverity] = useState<typeof SEVERITIES_INCIDENT[number]>("P1");
  const [affectedProduct, setAffectedProduct] = useState("");
  const [affectedRegion, setAffectedRegion] = useState("");
  const [autoRunInvestigations, setAutoRunInvestigations] = useState(false);

  // Mode B state
  const [genSubject, setGenSubject] = useState(TICKET_SUBJECTS[0]);
  const [genCount, setGenCount] = useState(3);
  const [genSeverity, setGenSeverity] = useState("high");
  const [genCustomerId, setGenCustomerId] = useState("");
  const [genIncidentTitle, setGenIncidentTitle] = useState("");
  const [genIncidentSeverity, setGenIncidentSeverity] = useState<typeof SEVERITIES_INCIDENT[number]>("P1");

  const [loading, setLoading] = useState(false);
  const [resultIncidentId, setResultIncidentId] = useState<string | null>(null);
  const [resultRunIds, setResultRunIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  function toggleTicket(id: string) {
    setSelectedTicketIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleModeA() {
    if (selectedTicketIds.length === 0 || !incidentTitle.trim()) return;
    setLoading(true);
    setError(null);
    setResultIncidentId(null);
    setResultRunIds([]);

    try {
      const incRes = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketIds: selectedTicketIds,
          title: incidentTitle,
          severity: incidentSeverity,
          affectedProduct: affectedProduct || undefined,
          affectedRegion: affectedRegion || undefined,
        }),
      });

      if (!incRes.ok) {
        const data = await incRes.json() as { error?: string };
        setError(data.error ?? "Failed to create incident");
        return;
      }

      const incident = await incRes.json() as { id: string };
      setResultIncidentId(incident.id);

      if (autoRunInvestigations) {
        const runIds: string[] = [];
        for (const ticketId of selectedTicketIds) {
          const runRes = await fetch("/api/agents/run", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId }),
          });
          if (runRes.ok) {
            const run = await runRes.json() as { runId: string };
            runIds.push(run.runId);
          }
        }
        setResultRunIds(runIds);
      }
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleModeB() {
    if (!genIncidentTitle.trim()) return;
    setLoading(true);
    setError(null);
    setResultIncidentId(null);
    setResultRunIds([]);

    try {
      // Step 1: generate tickets
      const genRes = await fetch("/api/admin/generate-tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: genSubject,
          count: genCount,
          severity: genSeverity,
          customerId: genCustomerId || undefined,
          autoInvestigate: false,
        }),
      });

      if (!genRes.ok) {
        const data = await genRes.json() as { error?: string };
        setError(data.error ?? "Ticket generation failed");
        return;
      }

      const genData = await genRes.json() as { tickets: { id: string }[] };
      const ticketIds = genData.tickets.map((t) => t.id);

      // Step 2: create incident
      const incRes = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketIds,
          title: genIncidentTitle,
          severity: genIncidentSeverity,
        }),
      });

      if (!incRes.ok) {
        const data = await incRes.json() as { error?: string };
        setError(data.error ?? "Incident creation failed");
        return;
      }

      const incident = await incRes.json() as { id: string };
      setResultIncidentId(incident.id);

      // Step 3: trigger investigations
      const runIds: string[] = [];
      for (const ticketId of ticketIds) {
        const runRes = await fetch("/api/agents/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticketId }),
        });
        if (runRes.ok) {
          const run = await runRes.json() as { runId: string };
          runIds.push(run.runId);
        }
      }
      setResultRunIds(runIds);
    } catch {
      setError("Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          Incident Creator
        </CardTitle>
        <CardDescription>
          Create incidents from existing tickets or generate a full incident response drill
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mode tabs */}
        <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 w-fit">
          {(["existing", "generate"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                mode === m
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {m === "existing" ? "From Existing Tickets" : "Generate Drill"}
            </button>
          ))}
        </div>

        {mode === "existing" ? (
          <div className="space-y-4">
            {/* Ticket multi-select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Select tickets ({selectedTicketIds.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-md p-2">
                {openTickets.length === 0 && (
                  <p className="text-xs text-slate-400 p-2">No open tickets found</p>
                )}
                {openTickets.map((ticket) => (
                  <label key={ticket.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTicketIds.includes(ticket.id)}
                      onChange={() => toggleTicket(ticket.id)}
                      className="rounded border-slate-300"
                    />
                    <Badge variant="outline" className="text-xs shrink-0">{ticket.severity}</Badge>
                    <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{ticket.title}</span>
                    <span className="text-xs text-slate-400 shrink-0">{ticket.customer.company}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Incident Title</label>
                <input
                  type="text"
                  placeholder="e.g. US-EAST-1 API Degradation"
                  value={incidentTitle}
                  onChange={(e) => setIncidentTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Severity</label>
                <select
                  value={incidentSeverity}
                  onChange={(e) => setIncidentSeverity(e.target.value as typeof SEVERITIES_INCIDENT[number])}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {SEVERITIES_INCIDENT.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Affected Product <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. order-service"
                  value={affectedProduct}
                  onChange={(e) => setAffectedProduct(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Affected Region <span className="text-slate-400">(optional)</span></label>
                <input
                  type="text"
                  placeholder="e.g. us-east-1"
                  value={affectedRegion}
                  onChange={(e) => setAffectedRegion(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRunInvestigations}
                onChange={(e) => setAutoRunInvestigations(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Auto-run investigation on each linked ticket</span>
            </label>

            <Button onClick={handleModeA} disabled={loading || selectedTicketIds.length === 0 || !incidentTitle.trim()}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Incident"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Generates tickets → creates incident → triggers investigations in one step.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ticket Subject</label>
                <select
                  value={genSubject}
                  onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {TICKET_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ticket count <span className="text-slate-400">(2–10)</span></label>
                <input
                  type="number"
                  min={2}
                  max={10}
                  value={genCount}
                  onChange={(e) => setGenCount(Math.min(10, Math.max(2, parseInt(e.target.value) || 2)))}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Ticket Severity</label>
                <select
                  value={genSeverity}
                  onChange={(e) => setGenSeverity(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {["critical", "high", "medium", "low"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Customer</label>
                <select
                  value={genCustomerId}
                  onChange={(e) => setGenCustomerId(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  <option value="">Random</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.company})</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Incident Title</label>
                <input
                  type="text"
                  placeholder="e.g. Auth Service Outage — EU"
                  value={genIncidentTitle}
                  onChange={(e) => setGenIncidentTitle(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">Incident Severity</label>
                <select
                  value={genIncidentSeverity}
                  onChange={(e) => setGenIncidentSeverity(e.target.value as typeof SEVERITIES_INCIDENT[number])}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-md px-3 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                  {SEVERITIES_INCIDENT.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <Button onClick={handleModeB} disabled={loading || !genIncidentTitle.trim()}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running drill...</> : "Generate + Create + Investigate"}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        {resultIncidentId && (
          <div className="p-3 rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 space-y-2">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">Incident created</p>
            <div className="flex flex-wrap gap-2">
              <a href={`/incidents/${resultIncidentId}`} target="_blank" rel="noreferrer"
                className="text-xs text-green-700 dark:text-green-400 hover:underline flex items-center gap-1">
                View Incident <ExternalLink className="w-3 h-3" />
              </a>
              {resultRunIds.map((id, i) => (
                <a key={id} href={`/investigations/${id}`} target="_blank" rel="noreferrer"
                  className="text-xs text-purple-700 dark:text-purple-400 hover:underline flex items-center gap-1">
                  Investigation {i + 1} <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
