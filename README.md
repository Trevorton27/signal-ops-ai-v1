# AI Support Operations Platform

A portfolio-grade multi-agent AI system for automated support ticket investigation. When a support ticket is submitted, a LangGraph-orchestrated pipeline of 8 specialized AI agents runs in the background — classifying the ticket, analyzing logs, retrieving relevant runbooks, correlating incidents and deployments, generating root-cause hypotheses, drafting a customer reply, and writing an internal escalation note.

Built with Next.js 15, LangGraph.js, Inngest, Prisma + pgvector, and Clerk.

**In this article**

- [Demo Walkthrough](#demo-walkthrough)
- [Tech Stack](#tech-stack)
- [File Structure](#file-structure)
- [Authentication Flow](#authentication-flow)
- [Agent Pipeline Data Flow](#agent-pipeline-data-flow)
- [Database Schema](#database-schema)
- [RAG Pipeline](#rag-pipeline)
- [Setup](#setup)
- [Key Commands](#key-commands)
- [Optional Integrations](#optional-integrations)
- [Demo Tickets](#demo-tickets)

---

## Demo Walkthrough

1. Sign in → redirected to `/dashboard`
2. Navigate to `/tickets` → 7 pre-seeded support tickets
3. Click any ticket → view ticket detail + customer context
4. Click **Run Investigation** → fires background agent pipeline
5. Redirected to `/investigations/[runId]` → watch agent steps appear in real time (2s polling)
6. Final state: ranked root-cause hypotheses, drafted customer reply, internal escalation note

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Auth | Clerk |
| Agent orchestration | LangGraph.js |
| LLM | OpenAI GPT-4o + GPT-4o Mini |
| Embeddings | OpenAI text-embedding-3-small (1536d) |
| Background jobs | Inngest |
| Database | PostgreSQL 16 + pgvector |
| ORM | Prisma 6 |
| UI | shadcn/ui + Tailwind CSS |
| Validation | Zod |
| Local DB | Docker Compose |

---

## File Structure

```
multi-agent-support-platform/
│
├── app/                              # Next.js App Router
│   ├── layout.tsx                    # Root layout — ClerkProvider, global CSS
│   ├── page.tsx                      # Public landing page (redirects if authed)
│   ├── globals.css                   # Tailwind base + CSS variables
│   ├── sign-in/[[...sign-in]]/       # Clerk sign-in page
│   ├── sign-up/[[...sign-up]]/       # Clerk sign-up page
│   │
│   ├── (dashboard)/                  # Protected route group
│   │   ├── layout.tsx                # Sidebar nav + UserButton
│   │   ├── dashboard/page.tsx        # KPI cards + recent investigations
│   │   ├── tickets/
│   │   │   ├── page.tsx              # Filterable ticket list
│   │   │   └── [ticketId]/page.tsx   # Ticket detail + investigation panel
│   │   ├── investigations/
│   │   │   ├── page.tsx              # All investigation runs
│   │   │   └── [runId]/page.tsx      # Full trace view — timeline, hypotheses, reply
│   │   └── settings/page.tsx         # Model selection, demo reset
│   │
│   └── api/
│       ├── agents/run/route.ts       # POST — trigger investigation
│       ├── tickets/route.ts          # GET list, POST create
│       ├── tickets/[ticketId]/       # GET, PATCH, DELETE
│       ├── investigations/route.ts   # GET list
│       ├── investigations/[runId]/   # GET single run + steps
│       ├── search/route.ts           # GET — pgvector RAG search
│       ├── seed/route.ts             # POST — demo database reset
│       └── webhooks/inngest/         # Inngest event receiver
│
├── agents/                           # Agent pipeline (server-only)
│   ├── graph.ts                      # LangGraph StateGraph — pipeline definition
│   ├── state.ts                      # InvestigationState TypeScript type
│   ├── nodes/                        # One file per agent node
│   │   ├── intake-agent.ts           # Classify ticket category/severity
│   │   ├── customer-context-agent.ts # Fetch customer record + recent deployments
│   │   ├── log-analysis-agent.ts     # Identify error patterns in logs/traces
│   │   ├── knowledge-agent.ts        # RAG search + extract runbook steps
│   │   ├── incident-correlation-agent.ts  # Match related past incidents
│   │   ├── deployment-correlation-agent.ts # Match relevant deployments
│   │   ├── root-cause-agent.ts       # Rank hypotheses with confidence scores
│   │   ├── response-agent.ts         # Draft customer-facing reply
│   │   └── escalation-agent.ts       # Write internal escalation note
│   ├── prompts/                      # LLM system prompts as Markdown files
│   │   ├── intake.md
│   │   ├── log-analysis.md
│   │   ├── knowledge-retrieval.md
│   │   ├── root-cause.md
│   │   ├── response-drafting.md
│   │   └── escalation.md
│   └── tools/                        # Data fetchers used by nodes
│       ├── ticket-tool.ts            # Prisma ticket + customer fetch
│       ├── logs-tool.ts              # Filter logs.json / traces.json
│       ├── docs-tool.ts              # pgvector similarity search wrapper
│       ├── customer-tool.ts          # Prisma customer + deployments.json
│       ├── incident-tool.ts          # Filter incidents.json by product/region/time
│       └── escalation-tool.ts        # Optional GitHub Issues / Jira post
│
├── components/
│   ├── agents/
│   │   ├── agent-timeline.tsx        # Vertical step-by-step pipeline view (polls)
│   │   ├── hypothesis-card.tsx       # Single root-cause hypothesis with confidence bar
│   │   └── agent-output-card.tsx     # Collapsible JSON output per step
│   ├── dashboard/
│   │   ├── kpi-cards.tsx             # 4 stat cards (open tickets, investigations, etc.)
│   │   └── recent-investigations.tsx # Last 5 completed runs
│   ├── tickets/
│   │   ├── ticket-list.tsx           # Sortable ticket table with badges
│   │   ├── ticket-detail.tsx         # Ticket metadata + customer info cards
│   │   ├── investigation-panel.tsx   # "Run Investigation" button + run status
│   │   └── severity-badge.tsx        # Color-coded severity pill
│   └── ui/                           # shadcn/ui primitives
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       └── skeleton.tsx
│
├── inngest/
│   ├── client.ts                     # Inngest client singleton + event types
│   └── functions.ts                  # createFunction — wraps runInvestigation()
│
├── lib/
│   ├── db.ts                         # Prisma client singleton (hot-reload safe)
│   ├── auth.ts                       # requireAuth(), getCurrentUser()
│   ├── env.ts                        # Zod-validated environment variables
│   ├── embeddings.ts                 # embedText() — OpenAI text-embedding-3-small
│   ├── vector-search.ts              # searchKnowledge() — pgvector cosine search
│   ├── logger.ts                     # Structured JSON logger (createLogger)
│   └── utils.ts                      # cn(), formatDuration(), formatRelativeTime()
│
├── prisma/
│   ├── schema.prisma                 # DB schema (Customer, Ticket, InvestigationRun, etc.)
│   └── seed.ts                       # Prisma seed helper (called by scripts/)
│
├── scripts/
│   ├── seed-db.ts                    # Insert demo customers + tickets
│   ├── ingest-docs.ts                # Embed knowledge-base/ into pgvector
│   └── reset-demo.ts                 # Clear + re-seed + re-ingest
│
├── data/                             # Demo fixture JSON files
│   ├── customers.json                # 10 demo customers (varied plans/regions)
│   ├── tickets.json                  # 7 scripted support tickets
│   ├── logs.json                     # OpenTelemetry-style log entries
│   ├── traces.json                   # Distributed trace spans
│   ├── incidents.json                # 3 past incidents
│   ├── deployments.json              # Deployment history per service
│   └── sentry-issues.json            # Sentry-style error events
│
├── knowledge-base/                   # RAG source documents (Markdown)
│   ├── runbooks/
│   │   ├── production-500-errors.md
│   │   ├── auth-token-expiry.md
│   │   ├── database-connection-pool.md
│   │   └── webhook-retry-failures.md
│   ├── product-docs/
│   │   ├── api-rate-limits.md
│   │   ├── billing-api.md
│   │   └── deployment-process.md
│   └── internal-notes/
│       └── known-issues.md
│
├── middleware.ts                     # Clerk auth gate — protects all non-public routes
├── next.config.ts                    # Next.js config (external packages for Prisma)
├── tailwind.config.ts                # Tailwind + shadcn CSS variables
├── docker-compose.yml                # Local Postgres 16 + pgvector
├── .env.example                      # Required environment variable template
├── CLAUDE.md                         # AI coding assistant instructions
└── package.json
```

---

## Authentication Flow

```
Browser                    Clerk                    App
  │                          │                        │
  │── GET /dashboard ────────┼────────────────────────►
  │                          │         middleware.ts runs
  │                          │         auth().protect() called
  │                          │         no session found
  │◄─────────────── 302 redirect to /sign-in ─────────│
  │                          │                        │
  │── POST /sign-in ─────────►                        │
  │   (email + password)     │ validates credentials  │
  │◄─── session cookie ──────│                        │
  │                          │                        │
  │── GET /dashboard ────────┼────────────────────────►
  │                          │         middleware.ts runs
  │                          │         auth() → userId present
  │                          │         auth.protect() passes
  │◄──────────── 200 /dashboard page ─────────────────│
```

**Key files:**
- `middleware.ts` — `clerkMiddleware` runs on every request; calls `auth.protect()` for non-public routes
- Public routes: `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks/(.*)`
- `lib/auth.ts` — `requireAuth()` used in Route Handlers to return 401 if no session
- Server Components call `auth()` from `@clerk/nextjs/server` directly

**API route auth pattern:**
```ts
export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // ...
}
```

---

## Agent Pipeline Data Flow

### 1. Trigger (HTTP)

```
User clicks "Run Investigation"
  │
  └─► POST /api/agents/run  { ticketId }
        │
        ├─ Verify ticket exists (Prisma)
        ├─ Create InvestigationRun  { status: "pending" }
        ├─ inngest.send("investigation/run.requested", { ticketId, runId })
        └─ Return { runId } → browser redirects to /investigations/[runId]
```

### 2. Background Execution (Inngest → LangGraph)

```
Inngest worker picks up "investigation/run.requested"
  │
  └─► inngest/functions.ts::runInvestigationFunction
        │
        └─► agents/graph.ts::runInvestigation(ticketId, runId)
              │
              ├─ Update InvestigationRun → status: "running"
              ├─ Fetch Ticket + Customer from Prisma
              │
              └─ LangGraph StateGraph executes:
                   │
                   ▼
              [intake-agent]
                   │  Classification: { category, severity, affectedProduct, summary }
                   ▼
              [customer-context-agent]
                   │  Customer record + recent deployments from JSON
                   ▼
              [parallel_analysis]  ← Promise.all (4 agents run concurrently)
               ├─ [log-analysis-agent]          → error patterns, anomalies
               ├─ [knowledge-agent]             → pgvector RAG → runbook steps
               ├─ [incident-correlation-agent]  → matching past incidents
               └─ [deployment-correlation-agent]→ recent deployments in window
                   │
                   ▼
              [root-cause-agent]
                   │  Ranked Hypothesis[] with confidence scores → saved to InvestigationRun
                   ▼
              [response-agent]
                   │  Drafted customer email → saved to InvestigationRun.summary
                   ▼
              [escalation-agent]
                   │  Internal escalation note → saved to InvestigationRun.escalationNote
                   │  Optionally posts to GitHub Issues or Jira
                   │
              Update InvestigationRun → status: "complete"
```

### 3. Real-Time UI Updates

```
Browser (/investigations/[runId])
  │
  └─ AgentTimeline component (Client Component)
       │
       ├─ useEffect: setInterval(router.refresh, 2000) while status = "running"
       │
       └─ Each refresh → Server Component re-fetches InvestigationRun + AgentStep[]
            │
            └─ New steps appear in timeline as agents write them to DB
```

### 4. Per-Agent Step Pattern

Every agent node follows this exact pattern:

```ts
// 1. Record start
const step = await prisma.agentStep.create({
  data: { investigationRunId, agentName, status: "running", input: {...} }
});

// 2. Do work (LLM call, tool fetch, etc.)
const result = await callLLM(prompt, context);

// 3. Record completion
await prisma.agentStep.update({
  where: { id: step.id },
  data: { status: "complete", output: result, completedAt: new Date(), durationMs: ... }
});

// 4. Return state update
return { fieldName: parsedResult };
```

---

## Database Schema

```
Customer
  id, name, email (unique), company, plan, region, industry, accountAge
  └── has many Ticket

Ticket
  id, externalId (unique), title, description
  status: "open" | "in_progress" | "resolved" | "archived"
  severity: "critical" | "high" | "medium" | "low"
  category?, product?, customerId
  └── belongs to Customer
  └── has many InvestigationRun

InvestigationRun
  id, ticketId, status: "pending" | "running" | "complete" | "failed"
  hypotheses: Json?      ← Hypothesis[] written by root-cause-agent
  summary: String?       ← drafted customer reply
  escalationNote: String?
  startedAt, completedAt?, errorMessage?
  └── belongs to Ticket
  └── has many AgentStep

AgentStep
  id, investigationRunId, agentName
  status: "pending" | "running" | "complete" | "failed"
  input: Json?, output: Json?, errorMessage?
  startedAt, completedAt?, durationMs?
  └── belongs to InvestigationRun

KnowledgeChunk
  id, sourcePath, chunkIndex (unique together)
  content: String
  embedding: vector(1536)   ← pgvector, requires raw SQL to write/query
```

---

## RAG Pipeline

```
npm run ingest
  │
  └─ scripts/ingest-docs.ts
       │
       ├─ Walk knowledge-base/**/*.md
       ├─ Split each file into ~2000 char chunks (paragraph-aware)
       ├─ For each chunk:
       │    ├─ Call OpenAI text-embedding-3-small → float[1536]
       │    └─ Upsert into KnowledgeChunk via prisma.$executeRaw
       │         (upsert key: [sourcePath, chunkIndex])
       └─ Done — idempotent, safe to re-run

Query time (inside knowledge-agent.ts):
  │
  ├─ embedText(ticketSummary) → float[1536]
  └─ searchKnowledge(embedding, topK=5)
       └─ SELECT ... ORDER BY embedding <=> $vector LIMIT 5
            (cosine distance via pgvector <=> operator)
```

---

## Setup

### Prerequisites

- Node.js 20+
- Docker (for local Postgres)
- OpenAI API key
- Clerk account

### 1. Clone and install

```bash
git clone <repo>
cd multi-agent-support-platform
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/support_platform
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
OPENAI_API_KEY=sk-...
INNGEST_EVENT_KEY=local
```

### 3. Start local database

```bash
docker compose up -d
```

### 4. Apply schema and seed data

```bash
npm run db:push      # creates tables + enables pgvector extension
npm run seed         # inserts 10 customers + 7 tickets
npm run ingest       # embeds 8 knowledge base docs (requires OPENAI_API_KEY)
```

### 5. Start Inngest dev server (separate terminal)

```bash
npx inngest-cli@latest dev
```

### 6. Start the app

```bash
npm run dev          # http://localhost:3000
```

---

## Key Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check |
| `npm run db:push` | Sync Prisma schema → DB |
| `npm run db:migrate` | Create versioned migration |
| `npm run db:studio` | Open Prisma Studio |
| `npm run seed` | Seed demo data |
| `npm run ingest` | Embed knowledge base |
| `npm run reset` | Full demo reset (clear + re-seed + re-ingest) |

---

## Optional Integrations

Set these in `.env` to enable:

| Variable | Effect |
|---|---|
| `GITHUB_TOKEN` + `GITHUB_ESCALATION_REPO` | Escalation agent creates GitHub Issues |
| `JIRA_API_TOKEN` + `JIRA_BASE_URL` + `JIRA_PROJECT_KEY` | Escalation agent creates Jira tickets |
| `ANTHROPIC_API_KEY` | Enables Claude model option in settings |
| `SENTRY_AUTH_TOKEN` | Future: real error event data source |

---

## Demo Tickets

The seed includes 7 tickets with predictable investigation outcomes:

| Ticket | Root Cause | Key Signal |
|---|---|---|
| TKT-001 | DB replica lag in us-east-1 | Slow query logs + inc_001 incident |
| TKT-002 | SAML cert rotation failure in EU | Auth logs + deploy_002 + inc_002 |
| TKT-003 | PgBouncer pool exhaustion after scale-up | Connection pool logs + deploy_003 |
| TKT-004 | Webhook header renamed in v3.1.2 | Signature errors + deploy_004 |
| TKT-005 | API key regional propagation delay | Billing logs + deploy_005 |
| TKT-006 | Rate limiter burst counter bug | Rate limit logs + deploy_007 + inc_003 |
| TKT-007 | Missing `SECRETS_MANAGER_KEY` in CI action v3.2.0 | Deployment logs + deploy_006 |
