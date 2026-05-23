"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Loader2 } from "lucide-react";

interface IntegrationCardProps {
  name: string;
  type: string;
  description: string;
  isLive: boolean;
  testEndpoint?: string;
  lastSyncAt?: Date | null;
}

export function IntegrationCard({
  name,
  type,
  description,
  isLive,
  testEndpoint,
  lastSyncAt,
}: IntegrationCardProps) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleTest() {
    if (!testEndpoint) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(testEndpoint, { method: "POST" });
      const data = await res.json() as { ok: boolean; message?: string; mode?: string };
      setTestResult({ ok: data.ok, message: data.message ?? (data.ok ? "Success" : "Failed") });
    } catch {
      setTestResult({ ok: false, message: "Request failed" });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Card className="relative overflow-hidden">
      <div className={`absolute top-0 left-0 w-1 h-full ${isLive ? "bg-green-500" : "bg-slate-300 dark:bg-slate-700"}`} />
      <CardHeader className="pb-2 pl-6">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            {isLive
              ? <CheckCircle2 className="w-4 h-4 text-green-500" />
              : <Circle className="w-4 h-4 text-slate-400" />}
            {name}
          </CardTitle>
          <Badge variant="outline" className={`text-xs ${isLive ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800" : "text-slate-500"}`}>
            {isLive ? "live" : "mock"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 pl-6 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>

        {lastSyncAt && (
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Last sync: {new Date(lastSyncAt).toLocaleString()}
          </p>
        )}

        {!isLive && (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">
            Set <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">{type.toUpperCase()}_API_TOKEN</code> environment variable to enable live mode.
          </p>
        )}

        {testEndpoint && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing}>
              {testing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Test Connection
            </Button>
            {testResult && (
              <span className={`text-xs ${testResult.ok ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {testResult.message}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
