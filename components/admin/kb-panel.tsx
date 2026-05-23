"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, RefreshCw } from "lucide-react";

interface FileChunkInfo {
  sourcePath: string;
  count: number;
  lastUpdated: string;
}

interface KbStatus {
  totalChunks: number;
  byFile: FileChunkInfo[];
  lastIngestionAt: string | null;
}

export function KbPanel() {
  const [status, setStatus] = useState<KbStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [reindexing, setReindexing] = useState(false);
  const [reindexResult, setReindexResult] = useState<string | null>(null);

  async function fetchStatus() {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/admin/kb-status");
      if (res.ok) setStatus(await res.json() as KbStatus);
    } finally {
      setLoadingStatus(false);
    }
  }

  useEffect(() => { fetchStatus(); }, []);

  async function handleReindex() {
    setReindexing(true);
    setReindexResult(null);
    try {
      const res = await fetch("/api/admin/reindex", { method: "POST" });
      const data = await res.json() as { ok: boolean; chunksUpserted?: number; filesProcessed?: number };
      if (data.ok) {
        setReindexResult(`Done — ${data.chunksUpserted} chunks across ${data.filesProcessed} files`);
        fetchStatus();
      } else {
        setReindexResult("Reindex failed — check server logs");
      }
    } catch {
      setReindexResult("Request failed");
    } finally {
      setReindexing(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4" />
          Knowledge Base
        </CardTitle>
        <CardDescription>
          pgvector embeddings from <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">knowledge-base/*.md</code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingStatus ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading...
          </div>
        ) : status ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{status.totalChunks}</p>
                <p className="text-xs text-slate-500">total chunks</p>
              </div>
              {status.lastIngestionAt && (
                <div>
                  <p className="text-xs text-slate-500">Last ingested</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {new Date(status.lastIngestionAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {status.byFile.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {status.byFile.map((f) => (
                  <div key={f.sourcePath} className="flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 truncate font-mono">
                      {f.sourcePath.replace("knowledge-base/", "")}
                    </span>
                    <span className="text-slate-400 ml-2 shrink-0">{f.count} chunks</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No chunks ingested yet</p>
        )}

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReindex}
            disabled={reindexing}
            className="gap-1.5"
          >
            {reindexing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {reindexing ? "Reindexing..." : "Re-ingest"}
          </Button>
          {reindexResult && (
            <span className="text-xs text-slate-600 dark:text-slate-400">{reindexResult}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
