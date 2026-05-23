"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check, X, Edit2 } from "lucide-react";

interface ReplyEditorProps {
  runId: string;
  originalDraft: string;
}

export function ReplyEditor({ runId, originalDraft }: ReplyEditorProps) {
  const router = useRouter();
  const [editedReply, setEditedReply] = useState(originalDraft);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEdited = editedReply !== originalDraft;

  async function submit(action: "approved" | "rejected") {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/investigations/${runId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          editedReply: isEdited ? editedReply : undefined,
          note: note || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit");
      }

      router.push("/approvals");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Edited indicator */}
      {isEdited && (
        <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400">
          <Edit2 className="w-3.5 h-3.5" />
          Draft edited — diff will be recorded in audit trail
        </div>
      )}

      {/* Reply textarea */}
      <textarea
        value={editedReply}
        onChange={(e) => setEditedReply(e.target.value)}
        rows={12}
        className="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed font-mono"
        placeholder="Customer reply draft..."
      />

      {/* Reviewer note */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        className="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Reviewer note (optional — will be recorded in audit trail)..."
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded px-3 py-2">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={() => submit("approved")}
          disabled={submitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Check className="w-4 h-4 mr-1.5" />
          {submitting ? "Submitting..." : "Approve & Send"}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit("rejected")}
          disabled={submitting}
          className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <X className="w-4 h-4 mr-1.5" />
          Reject
        </Button>
      </div>
    </div>
  );
}
