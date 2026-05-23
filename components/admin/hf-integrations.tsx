"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { IntegrationCard } from "@/components/settings/integration-card";
import { Brain } from "lucide-react";

interface HfIntegrationsProps {
  isHfLive: boolean;
}

export function HfIntegrations({ isHfLive }: HfIntegrationsProps) {
  const models = [
    {
      name: "Sentiment / Urgency Scorer",
      type: "huggingface",
      description:
        "Scores customer urgency (0–1) on each ticket before OpenAI intake. Negative sentiment = high urgency. Attached as urgencyScore to InvestigationState. Model: distilbert-base-uncased-finetuned-sst-2-english",
      testEndpoint: "/api/admin/hf-test/sentiment",
    },
    {
      name: "Zero-Shot Topic Classifier",
      type: "huggingface",
      description:
        "Classifies ticket category (authentication, database, billing, …) before the OpenAI intake call. Top label is injected as a hint to reduce hallucinated categories. Model: facebook/bart-large-mnli",
      testEndpoint: "/api/admin/hf-test/classify",
    },
    {
      name: "Ticket Deduplication",
      type: "huggingface",
      description:
        "On ticket creation, computes sentence embeddings (all-MiniLM-L6-v2) and checks cosine similarity against recent open tickets. Flags near-duplicates (≥ 0.92) by setting duplicateOfId on the new ticket.",
      testEndpoint: "/api/admin/hf-test/dedup",
    },
    {
      name: "Cross-Encoder Reranker",
      type: "huggingface",
      description:
        "Already active — reranks knowledge base chunks retrieved by pgvector before passing to the knowledge agent. Model: cross-encoder/ms-marco-MiniLM-L-6-v2. Configured in lib/reranker.ts.",
      testEndpoint: undefined,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="w-4 h-4" />
          HuggingFace Integrations
        </CardTitle>
        <CardDescription>
          All four models share the single <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">HUGGING_FACE_API_KEY</code>.
          The first three activate automatically when the key is present — no code changes required.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {models.map((model) => (
          <IntegrationCard
            key={model.name}
            name={model.name}
            type={model.type}
            description={model.description}
            isLive={isHfLive}
            testEndpoint={model.testEndpoint}
          />
        ))}
      </CardContent>
    </Card>
  );
}
