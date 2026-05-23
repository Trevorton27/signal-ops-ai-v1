import type { GuardrailFlag } from "@/agents/state";

const PII_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, description: "Email address detected" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, description: "Phone number detected" },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, description: "SSN pattern detected" },
  { pattern: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13})\b/g, description: "Credit card number pattern detected" },
];

const SECRET_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /(?:api[_-]?key|apikey|token|secret|password|passwd)\s*[:=]\s*['"]?([A-Za-z0-9_\-.]{20,})['"]?/gi, description: "Potential API key or secret detected" },
  { pattern: /sk-[A-Za-z0-9]{32,}/g, description: "OpenAI-style secret key detected" },
  { pattern: /ghp_[A-Za-z0-9]{36}/g, description: "GitHub personal access token detected" },
  { pattern: /xoxb-[A-Za-z0-9-]{20,}/g, description: "Slack bot token detected" },
];

const INTERNAL_PATTERNS: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /internal\s+(?:only|use\s+only|document)/gi, description: "Internal-only content marker detected" },
  { pattern: /do\s+not\s+(?:share|distribute)|confidential|proprietary/gi, description: "Confidentiality marker detected" },
  { pattern: /\[INTERNAL\]|\[CONFIDENTIAL\]|\[NOT FOR CUSTOMER\]/gi, description: "Internal tag detected" },
];

export function runDeterministicChecks(text: string): GuardrailFlag[] {
  const flags: GuardrailFlag[] = [];

  for (const { pattern, description } of PII_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      flags.push({
        type: "pii",
        severity: "block",
        description,
        location: `char ${match.index}: "${match[0].slice(0, 20)}${match[0].length > 20 ? "…" : ""}"`,
      });
    }
  }

  for (const { pattern, description } of SECRET_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      flags.push({
        type: "secret",
        severity: "block",
        description,
        location: `char ${match.index}`,
      });
    }
  }

  for (const { pattern, description } of INTERNAL_PATTERNS) {
    pattern.lastIndex = 0;
    const match = pattern.exec(text);
    if (match) {
      flags.push({
        type: "internal_leak",
        severity: "warn",
        description,
        location: `char ${match.index}: "${match[0]}"`,
      });
    }
  }

  return flags;
}
