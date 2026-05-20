# AI Support Operations Platform — Claude Code Instructions

## Critical Rules

- **TypeScript strict mode** — no implicit `any`, no type casting with `as` unless bridging LangGraph/Prisma boundaries (see Known Pitfalls)
- **Never import `prisma` in Client Components** — all DB access must be in Server Components, Route Handlers, or `agents/`
- **Never expose `OPENAI_API_KEY` or `CLERK_SECRET_KEY` to the client** — use `lib/env.ts` server-side only
- **App Router only** — no `pages/` directory; all routes live under `app/`
- **Agents are server-only** — nothing in `agents/` should ever be imported by a Client Component

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Auth | Clerk (`@clerk/nextjs` v6) |
| Database | PostgreSQL + pgvector via Prisma 6 |
| Background jobs | Inngest v3 |
| Agent orchestration | LangGraph.js (`@langchain/langgraph`) |
| LLM | OpenAI (`gpt-4o` for reasoning, `gpt-4o-mini` for classification, `text-embedding-3-small` for RAG) |
| UI | shadcn/ui (Radix primitives) + Tailwind CSS v3 |
| Validation | Zod |
| Local DB | Docker Compose (pgvector/pgvector:pg16) |

---

## Commands

```bash
npm run dev           # start Next.js dev server
npm run build         # production build
npm run lint          # ESLint via next lint
npx tsc --noEmit      # type-check (no dedicated script — run this directly)

npm run db:generate   # prisma generate (after schema changes)
npm run db:push       # sync schema to local DB (dev only)
npm run db:migrate    # create migration file (use for persistent changes)
npm run db:studio     # Prisma Studio GUI

npm run seed          # insert demo customers + tickets from data/*.json
npm run ingest        # embed knowledge-base/*.md into pgvector
npm run reset         # clear DB + re-seed + re-ingest (idempotent)
```

**Local dev startup sequence:**
```bash
docker compose up -d   # start local postgres+pgvector on :5432
npm run db:push        # apply schema
npm run seed           # load demo data
npm run ingest         # embed knowledge base (requires OPENAI_API_KEY)
npm run dev
```

---

## Directory Structure

```
agents/
  graph.ts              # LangGraph StateGraph — the pipeline entry point
  state.ts              # InvestigationState type shared across all nodes
  nodes/                # One file per agent (intake, log-analysis, etc.)
  tools/                # Data fetchers used by nodes (DB, JSON files)
  prompts/              # System prompt .md files loaded at runtime via fs.readFileSync
app/
  (dashboard)/          # Route group — all protected pages (layout includes sidebar)
    dashboard/          # KPI overview
    tickets/            # Ticket list + [ticketId] detail
    investigations/     # Investigation list + [runId] full trace
    settings/           # Model selection + demo reset
  api/
    agents/run/         # POST — triggers investigation via Inngest
    tickets/            # REST CRUD
    investigations/     # Read-only investigation routes
    search/             # GET — pgvector RAG search
    seed/               # POST — demo reset
    webhooks/inngest/   # Inngest receiver (GET/POST/PUT)
  sign-in/ sign-up/     # Clerk hosted auth pages
components/
  agents/               # AgentTimeline, HypothesisCard, AgentOutputCard
  dashboard/            # KpiCards, RecentInvestigations
  tickets/              # TicketList, TicketDetail, InvestigationPanel, SeverityBadge
  ui/                   # shadcn primitives (button, badge, card, etc.)
data/                   # Static JSON demo fixtures (tickets, customers, logs, etc.)
inngest/
  client.ts             # Inngest client singleton
  functions.ts          # createFunction definitions
knowledge-base/         # Markdown docs ingested into pgvector
lib/
  db.ts                 # Prisma singleton (hot-reload safe)
  auth.ts               # requireAuth() / getCurrentUser() helpers
  embeddings.ts         # embedText() wrapping text-embedding-3-small
  env.ts                # Zod-validated env (server-only)
  vector-search.ts      # searchKnowledge() pgvector raw query
  logger.ts             # Structured JSON logger
  utils.ts              # cn(), formatDuration(), formatRelativeTime()
prisma/
  schema.prisma         # Models: Customer, Ticket, InvestigationRun, AgentStep, KnowledgeChunk
scripts/
  seed-db.ts            # Standalone seed runner
  ingest-docs.ts        # Standalone embedding ingestion
  reset-demo.ts         # Full demo reset orchestrator
```

---

## Architecture Boundaries

### Server vs. Client Components

- Default to **Server Components** — add `"use client"` only for interactivity (state, effects, event handlers)
- Current Client Components: `InvestigationPanel`, `AgentTimeline`, `AgentOutputCard`, `TicketList`, settings page
- **Never** call `prisma` or `lib/env.ts` from a Client Component
- **Never** import anything from `agents/` in a Client Component

### Agent Pipeline

The pipeline runs exclusively in background (Inngest function), not in HTTP request handlers:

```
POST /api/agents/run
  → creates InvestigationRun (status: pending)
  → inngest.send("investigation/run.requested")
  → returns { runId } immediately

Inngest function (agents/graph.ts::runInvestigation)
  → intake → customer_context → parallel_analysis → root_cause → response_drafting → escalation
  → each node writes AgentStep to DB as it runs
  → UI polls /api/investigations/[runId] every 2s while status = running
```

Each agent node must:
1. Create an `AgentStep` record with `status: "running"` at the start
2. Do its LLM/tool work
3. Update the step to `status: "complete"` with `output` JSON
4. Return a `Partial<InvestigationState>` — never mutate state directly

### LangGraph State

State is defined with `Annotation.Root()` in `agents/graph.ts`. Every reducer uses `(_, b) => b` (last-write-wins). When adding new state fields:

```ts
// agents/state.ts — add the TypeScript type
// agents/graph.ts — add the Annotation field with same name
```

Do NOT use the old `{ channels: {} }` API — it was removed.

### Prisma JSON Columns

`InvestigationRun.hypotheses` and `AgentStep.output/input` are `Json?`. To write arrays/typed objects:

```ts
// Correct — serializes through JSON to satisfy Prisma InputJsonValue
data: { hypotheses: JSON.parse(JSON.stringify(hypotheses)) }

// Wrong — TypeScript error
data: { hypotheses: hypotheses }
```

---

## Authentication (Clerk)

- All routes except `/`, `/sign-in(.*)`, `/sign-up(.*)`, `/api/webhooks/(.*)` are protected by `middleware.ts`
- In Server Components/Route Handlers: `const { userId } = await auth()`
- In Route Handlers, always check auth first:
  ```ts
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  ```
- `lib/auth.ts` exports `requireAuth()` helper for Route Handlers
- The Inngest webhook route (`/api/webhooks/inngest`) must remain public

---

## Database Rules

- **Dev schema changes**: `npm run db:push` (no migration file)
- **Production schema changes**: `npm run db:migrate` (creates versioned migration)
- **After any schema change**: run `npm run db:generate` then restart dev server
- `KnowledgeChunk.embedding` uses `Unsupported("vector(1536)")` — pgvector type, not a standard Prisma type; vector operations require raw queries via `prisma.$queryRaw` or `prisma.$executeRaw`
- Vector search uses cosine distance operator `<=>` — see `lib/vector-search.ts`
- Prisma client singleton is in `lib/db.ts` — never instantiate `new PrismaClient()` elsewhere

---

## Environment Variables

Required (app won't start without these):
```
DATABASE_URL                       # postgres://... (local: see docker-compose.yml)
OPENAI_API_KEY                     # for LLM calls + embeddings
CLERK_SECRET_KEY                   # server-side Clerk key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # client-side Clerk key
```

Optional (integrations):
```
INNGEST_EVENT_KEY      # defaults to "local" in dev
INNGEST_SIGNING_KEY    # required in production
ANTHROPIC_API_KEY      # for Claude model option (not yet wired)
GITHUB_TOKEN           # escalation-tool.ts — creates GitHub Issues
JIRA_API_TOKEN         # escalation-tool.ts — creates Jira tickets
JIRA_BASE_URL          # e.g. https://yourorg.atlassian.net
```

- All env access goes through `lib/env.ts` (Zod-validated) — never use `process.env.X` directly in app code
- `lib/env.ts` is server-only — never import in Client Components or `app/globals.css`

---

## Adding a New Agent Node

1. Create `agents/nodes/my-agent.ts` following the existing pattern:
   - Create AgentStep with `status: "running"`
   - Call LLM or tools
   - Update AgentStep with `status: "complete"` + `output`
   - Return `Partial<InvestigationState>`
2. Add the node's display label to `components/agents/agent-timeline.tsx` (`agentLabels` map)
3. Add the node and its edges to `agents/graph.ts`
4. If it needs a new prompt, add `agents/prompts/my-agent.md`
5. Add new state fields to both `agents/state.ts` and `Annotation.Root()` in `agents/graph.ts`

---

## Adding UI Components

- Presentational-only components go in `components/` with no direct DB access
- Use existing shadcn primitives from `components/ui/` before adding new ones
- Client Components that need data should receive it as props from parent Server Components
- Use `lib/utils.ts::cn()` for conditional Tailwind class merging
- Status/severity color mappings are inline in each component — keep them consistent with existing patterns

---

## Inngest

- Functions are defined in `inngest/functions.ts`, registered in `app/api/webhooks/inngest/route.ts`
- Timeout key is `timeouts: { finish: "10m" }` (not `timeout`)
- In dev, run `npx inngest-cli@latest dev` to process events locally (separate terminal)
- Events fired with `inngest.send({ name: "...", data: {...} })`
- The Inngest client is in `inngest/client.ts` — import from there, don't create new instances

---

## RAG / Knowledge Base

- Source documents live in `knowledge-base/` as Markdown
- Run `npm run ingest` to chunk + embed into `KnowledgeChunk` table (safe to re-run — upserts by `[sourcePath, chunkIndex]`)
- Embeddings use `text-embedding-3-small` (1536 dimensions) via `lib/embeddings.ts`
- Vector search: `lib/vector-search.ts::searchKnowledge(embedding, topK)` — returns chunks sorted by cosine similarity
- To add new docs: drop `.md` files into `knowledge-base/` subdirectories, re-run `npm run ingest`

---

## Known Pitfalls

- **LangGraph `as unknown as InvestigationState` casts** in `graph.ts` are intentional — the `Annotation.Root` state type and the hand-written `InvestigationState` type are structurally identical but not assignable without the cast. Do not remove them.
- **`searchParams` in route handlers** — warnings about "async searchParams" from tooling are false positives when using `new URL(request.url).searchParams`. That is the synchronous URL API, not the Next.js page prop.
- **pgvector raw queries** — the `prisma.$queryRaw` template literal must interpolate the vector string as `${vectorStr}::vector`. Do not parameterize this differently.
- **Prompt files loaded at runtime** — `fs.readFileSync(join(process.cwd(), "agents/prompts/..."))` only works in Node.js server context. Never call this from Edge Runtime routes.
- **Demo data is not tied to real auth users** — customer/ticket records have hardcoded IDs in `data/*.json`. The seed is idempotent via upsert on `email` / `externalId`.
- **`KnowledgeChunk` has no Prisma-managed vector operations** — `embedding` is `Unsupported(...)`, so Prisma Studio won't display it correctly and you can't use `prisma.knowledgeChunk.create()` with an embedding. Use `prisma.$executeRaw` (see `scripts/ingest-docs.ts`).

---

## Do NOT

- Add `"use client"` to pages in `app/(dashboard)/` that are Server Components — they fetch DB data directly
- Use `process.env.OPENAI_API_KEY` directly — always go through `lib/env.ts::getEnv()`
- Create a new Prisma client instance anywhere — import `prisma` from `lib/db.ts`
- Add new dependencies without checking if an existing library already covers the use case
- Modify `data/*.json` files to fix bugs — they are demo fixtures, not production data
- Call `agents/graph.ts::runInvestigation()` directly from a Route Handler — always go through Inngest
- Use the old LangGraph `{ channels: {} }` StateGraph constructor — it no longer works; use `Annotation.Root()`
- Hard-code severity/status strings — they are documented as comments in `prisma/schema.prisma`

---

## Deployment Notes

- **Docker Compose** is for local dev only — production uses Neon (or any hosted Postgres with pgvector extension)
- The `pgvector` extension must be enabled in the production database before running migrations
- Set `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` in production environment
- `next.config.ts` sets `serverComponentsExternalPackages: ["@prisma/client", "prisma"]` — required for Prisma in App Router
- Inngest webhook URL in production: `https://your-domain.com/api/webhooks/inngest`
