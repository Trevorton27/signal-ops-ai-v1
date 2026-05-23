"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save, Eye } from "lucide-react";

interface StatusPageEditorProps {
  incidentId: string;
  initialMessage: string | null;
}

export function StatusPageEditor({ incidentId, initialMessage }: StatusPageEditorProps) {
  const [message, setMessage] = useState(initialMessage ?? "");
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch(`/api/incidents/${incidentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusPageMessage: message }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This message will appear on the customer-facing status page.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPreview(!preview)}
        >
          <Eye className="w-3.5 h-3.5 mr-1.5" />
          {preview ? "Edit" : "Preview"}
        </Button>
      </div>

      {preview ? (
        <div className="min-h-[120px] p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
          {message || <span className="text-slate-400 italic">No message set</span>}
        </div>
      ) : (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          placeholder="We are currently investigating an issue affecting payment processing in the EU region. Our team has identified the root cause and is working on a fix. ETA: 2 hours."
        />
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} size="sm">
          <Save className="w-3.5 h-3.5 mr-1.5" />
          {saving ? "Saving..." : saved ? "Saved!" : "Save Message"}
        </Button>
        {saved && (
          <span className="text-xs text-green-600 dark:text-green-400">Status page updated</span>
        )}
      </div>
    </div>
  );
}
