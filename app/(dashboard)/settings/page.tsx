"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<string | null>(null);

  async function handleReset() {
    if (!confirm("This will delete all investigation data and re-seed the database. Continue?")) return;
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      setResetResult(data.message || "Reset complete");
    } catch {
      setResetResult("Reset failed — check console");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure your AI support platform</p>
      </div>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Model</CardTitle>
          <CardDescription>Select the LLM used for agent reasoning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Primary Model</Label>
            <Select defaultValue="gpt-4o">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini (Faster)</SelectItem>
                <SelectItem value="claude-3-5-sonnet">Claude Sonnet 4.6</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 dark:text-slate-400">Used for root cause, response drafting, and escalation agents</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-xs">OpenAI</Badge>
            <Badge variant="outline" className="text-xs">Embeddings: text-embedding-3-small</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
          <CardDescription>Optional external service connections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { label: "GitHub Token", env: "GITHUB_TOKEN", desc: "For escalation issue creation" },
            { label: "Jira API Token", env: "JIRA_API_TOKEN", desc: "For Jira escalation tickets" },
            { label: "Sentry Auth Token", env: "SENTRY_AUTH_TOKEN", desc: "For real error event data" },
          ].map((item) => (
            <div key={item.env} className="space-y-1.5">
              <Label>{item.label}</Label>
              <Input type="password" placeholder="Set via environment variable" disabled />
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc} — set <code className="bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-1 rounded">{item.env}</code> in your environment</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Demo Reset */}
      <Card className="border-orange-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Demo Reset
          </CardTitle>
          <CardDescription>Clear all investigation data and restore demo tickets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This deletes all investigation runs, agent steps, and ticket updates, then re-seeds the database
            with the 7 demo tickets and 10 demo customers.
          </p>
          {resetResult && (
            <div className="text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              {resetResult}
            </div>
          )}
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={resetting}
            className="border-orange-300 text-orange-700 hover:bg-orange-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            {resetting ? "Resetting..." : "Reset Demo Database"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
