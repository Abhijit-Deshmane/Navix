<div align="center">

# 🌐 Navix

### Enterprise-Grade Collaborative AI Browser Automation & Workflow Orchestration Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Browserbase](https://img.shields.io/badge/Browserbase-Cloud_Browser-ff5722?style=for-the-badge)](https://browserbase.com/)
[![Stagehand](https://img.shields.io/badge/Stagehand-AI_Agent-8e24aa?style=for-the-badge)](https://stagehand.dev/)
[![Liveblocks](https://img.shields.io/badge/Liveblocks-Multiplayer_CRDT-f97316?style=for-the-badge)](https://liveblocks.io/)
[![Trigger.dev](https://img.shields.io/badge/Trigger.dev-v4_Durable_Tasks-00df89?style=for-the-badge)](https://trigger.dev/)
[![Neon](https://img.shields.io/badge/Neon-Serverless_Postgres-00e599?style=for-the-badge&logo=postgresql)](https://neon.tech/)
[![Clerk](https://img.shields.io/badge/Clerk-Multi--Tenant_Auth-6c47ff?style=for-the-badge)](https://clerk.com/)
[![Sentry](https://img.shields.io/badge/Sentry-Full_Stack_Tracing-362d59?style=for-the-badge&logo=sentry)](https://sentry.io/)

<p align="center">
  <b>Navix</b> empowers engineering and operations teams to visually construct, collaboratively edit in real-time, reliably execute, and visually replay complex AI-driven browser automations at scale.
</p>

[Architecture](docs/ARCHITECTURE.md) • [Execution Engine](docs/EXECUTION_ENGINE.md) • [Node Catalog](docs/NODE_CATALOG.md) • [Environment Setup](docs/ENVIRONMENT_SETUP.md) • [API Reference](docs/API_REFERENCE.md) • [Deployment](docs/DEPLOYMENT.md)

</div>

---

## 📑 Table of Contents

- [Executive Overview](#-executive-overview)
- [System Architecture](#-system-architecture)
- [Key Features](#-key-features)
- [Node Registry & Catalog](#-node-registry--catalog)
- [Dynamic Variable Interpolation Engine](#-dynamic-variable-interpolation-engine)
- [Technology Stack](#-technology-stack)
- [Repository Structure](#-repository-structure)
- [Getting Started & Local Development](#-getting-started--local-development)
- [Database Management & Migrations](#-database-management--migrations)
- [Trigger.dev Background Tasks](#-triggerdev-background-tasks)
- [Multi-Tenancy, Security & Billing](#-multi-tenancy-security--billing)
- [Observability & Error Tracking](#-observability--error-tracking)
- [Production Deployment](#-production-deployment)
- [Documentation Suite](#-documentation-suite)
- [License & Support](#-license--support)

---

## 🚀 Executive Overview

Traditional browser automation tools (like raw Puppeteer or Playwright scripts) are brittle, single-player, difficult to inspect, and prone to breaking whenever web layouts change. 

**Navix** transforms web automation into an intuitive, multiplayer, resilient visual workflow ecosystem:
1. **Multiplayer Visual Canvas**: Multiple engineers can build, connect, and debug directed acyclic graph (DAG) automations simultaneously in real-time using Liveblocks CRDT and React Flow.
2. **AI-Driven Browser Actions**: Powered by **Stagehand** and **Browserbase**, steps use natural language instructions (e.g., *"Click the sign in button"* or *"Extract product prices"*) driven by Google Gemini 2.5 Flash via Browserbase's Model Gateway, completely eliminating brittle CSS selectors.
3. **Autonomous Agent Node**: For non-deterministic, open-ended tasks, the `Agent` node autonomously reasons, browses, navigates paginated flows, and solves complex obstacles.
4. **Durable Cloud Execution**: Workflows run asynchronously inside **Trigger.dev** background task runners with topological DAG sorting, automated retries, and comprehensive timeout management.
5. **Real-Time Live Console & Video Replay**: Live step-by-step telemetry streams back to the canvas in real-time via Trigger.dev metadata. Upon completion, users can watch full **HLS session video recordings** of cloud browser runs directly inside the UI.
6. **Enterprise Multi-Tenancy**: Built-in multi-tenant organization workspaces, RBAC, and plan-based feature gating powered by Clerk and Clerk Billing.

---

## 🏗️ System Architecture

Navix implements a state-synchronized architecture that separates collaborative live authoring from deterministic, durable server-side execution.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                CLIENT BROWSER (MULTIPLAYER)                            │
│  ┌─────────────────────────┐   ┌───────────────────────────┐   ┌────────────────────┐  │
│  │   React Flow Canvas     │   │   Right Sidebar Inspector │   │  Live Run Console  │  │
│  │ (@xyflow/react + nodes) │   │ (Palette, Fields, Tokens) │   │  (Steps & Logs)    │  │
│  └───────────┬─────────────┘   └─────────────┬─────────────┘   └─────────▲──────────┘  │
└──────────────┼───────────────────────────────┼───────────────────────────┼─────────────┘
               │ Live CRDT Room Sync           │ Run Action Trigger        │ Public Runs Token
               ▼                               ▼                           │ (Real-time Stream)
┌──────────────────────────────┐ ┌───────────────────────────┐             │
│       LIVEBLOCKS ROOM        │ │    NEXT.JS SERVER ACTION  │             │
│ (Multi-cursor, nodes, edges) │ │    runWorkflowAction()    │             │
└──────────────────────────────┘ └─────────────┬─────────────┘             │
                                               │                           │
                                               ├─► Saves Graph Snapshot    │
                                               │   into Neon Postgres      │
                                               │                           │
                                               ▼                           │
                                 ┌───────────────────────────┐             │
                                 │   TRIGGER.DEV TASK ENGINE │             │
                                 │      "run-workflow"       ├─────────────┘
                                 └─────────────┬─────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      │                                                 │
                      ▼                                                 ▼
        ┌──────────────────────────┐                      ┌──────────────────────────┐
        │  TOPOSORT DAG SEQUENCER  │                      │    STAGEHAND RUNTIME     │
        │ Cycle Check & Node Order │                      │  Browserbase Headless    │
        └─────────────┬────────────┘                      │  Sandbox (Gemini Flash)  │
                      │                                   └─────────────┬────────────┘
                      ▼                                                 │
        ┌──────────────────────────┐                                    │
        │ VARIABLE INTERPOLATION   │◄───────────────────────────────────┘
        │ Resolves {{ node.path }} │  Captures outputs & publishes live status
        └─────────────┬────────────┘  via Trigger metadata.set("steps")
                      │
                      ▼
        ┌──────────────────────────┐
        │  BROWSERBASE REPLAY API  │──► Streams `.m3u8` video playlist to
        │  /api/replays/[session]  │    frontend <SessionReplay /> via hls.js
        └──────────────────────────┘
```

For an in-depth breakdown of system components, state machines, and isolation models, consult [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ✨ Key Features

### 1. Collaborative Multiplayer Canvas
- **Real-Time CRDT State**: Powered by `@liveblocks/client`, `@liveblocks/react-flow`, and `@liveblocks/react-ui`. Multiple users see each other's live cursors, node movements, and property edits without conflicts.
- **Isolated Room Scoping**: Liveblocks rooms are 1:1 mapped to workflow IDs and strictly authorized against the user's active Clerk Organization ID.

### 2. Intelligent Stagehand & Browserbase Automation
- **Model Gateway Integration**: Connects directly to Browserbase's unified Model Gateway using `google/gemini-2.5-flash`, avoiding the need for individual LLM provider configurations.
- **Natural Language Actions**:
  - `Act`: Natural language interaction (clicking buttons, filling forms, selecting dropdowns).
  - `Extract`: Schema-based data extraction from the loaded DOM into structured JSON.
  - `Observe`: Discovers interactive elements matching intent and extracts optimal selectors.
  - `Agent`: Autonomous multi-step browsing agent that reasons and solves complex end-to-end tasks.

### 3. Session Recording & HLS Video Playback
- Single cloud browser session reused across all browser nodes in a workflow run.
- Browserbase records the entire interaction session.
- Secure Next.js route `/api/replays/[sessionId]` validates user authorization, proxies the `.m3u8` HLS playlist, and plays video in `<SessionReplay />` using `hls.js`.

### 4. Resilient DAG Orchestration with Trigger.dev
- Cycle detection and topological ordering via `toposort`.
- Orphan node filtering: Only connected components execute.
- Real-time step status pub/sub (`pending` ➔ `running` ➔ `done` / `failed`) streamed directly to the frontend using Trigger.dev scoped public tokens.
- Immediate task abort/cancellation support via `cancelWorkflowRunAction`.

### 5. Multi-Tenant Clerk Authentication & RBAC
- Enterprise organization switching and user profiles.
- Role-based plan gating: Expensive capabilities (e.g., `Agent` node and session video replay) are gated to the `pro` plan using Clerk's `has({ plan: "pro" })`.
- Direct self-serve billing checkout via Clerk `<PricingTable />`.

---

## 🧩 Node Registry & Catalog

Workflows begin with a single Trigger node followed by sequential or branching Action nodes:

| Node Type | Kind | Accent Color | Gated Tier | Primary Inputs | Produced Outputs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`start`** | Trigger | Blue | Free | *None (workflow entry)* | *None* |
| **`open-url`** | Action | Emerald | Free | `url` (string) | `url`, `title` |
| **`act`** | Action | Violet | Free | `instruction` (multiline text) | `success`, `message`, `url` |
| **`extract`** | Action | Amber | Free | `instruction` (multiline text) | `extraction` |
| **`observe`** | Action | Sky | Free | `instruction` (multiline text) | `matches`, `matches[0].selector`, `matches[0].description` |
| **`agent`** | Action | Rose | **Pro Only** | `instruction` (multiline text) | `success`, `message`, `completed` |
| **`send-email`**| Action | Teal | Free | `to`, `subject`, `body` | `id` (Resend email ID) |

> 📖 **Deep Dive**: Learn how to build and register custom nodes in [docs/NODE_CATALOG.md](docs/NODE_CATALOG.md).

---

## 🔀 Dynamic Variable Interpolation Engine

Downstream nodes can dynamically consume output data produced by upstream nodes using double curly brace syntax:

$$\{\{\; \text{nodeId}.\text{path} \; \}\}$$

### Example Workflow Chain:
1. **`Open URL 1`** (`id: b4f1...`) loads `https://news.ycombinator.com`.
   - Produces: `title = "Hacker News"`
2. **`Extract 1`** (`id: a8c2...`) extracts top article headline:
   - Instruction: `"Extract the top headline"`
   - Produces: `extraction = "Show HN: Navix Browser Agent"`
3. **`Send Email 1`** connects to `Extract 1` and uses tokens:
   - **Subject**: `Daily Intel: {{ a8c2.extraction }}`
   - **Body**: `<p>Fetched from {{ b4f1.url }}:</p><blockquote>{{ a8c2.extraction }}</blockquote>`

The interpolation engine safely navigates nested objects and arrays (e.g., `{{ observe_node.matches[0].selector }}`) and stringifies JSON objects cleanly.

> 📖 **Details**: Read full interpolation algorithms in [docs/EXECUTION_ENGINE.md](docs/EXECUTION_ENGINE.md).

---

## 💻 Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | [Next.js 16.2.6](https://nextjs.org/) (App Router, Server Actions, Turbo) | Core web application framework |
| **UI Library** | [React 19.2.4](https://react.dev/) | Component architecture & modern hooks |
| **Multiplayer State**| [Liveblocks 3.23.0](https://liveblocks.io/) | CRDT real-time rooms, presence & cursor sync |
| **Visual Canvas** | [@xyflow/react 12.11.2](https://reactflow.dev/) | High-performance interactive node canvas |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) + Radix UI + shadcn/ui | Design tokens, components & responsive layout |
| **Cloud Browser** | [Browserbase SDK 2.16.0](https://browserbase.com/) | Sandboxed cloud Chrome browser infrastructure |
| **Browser AI Agent**| [Stagehand 3.7.1](https://stagehand.dev/) (Gemini 2.5 Flash) | Natural language browser automation & extraction |
| **Durable Execution**| [Trigger.dev 4.5.10](https://trigger.dev/) | Long-running task workers, retries & live metadata |
| **Database** | [Neon Serverless Postgres](https://neon.tech/) | Serverless PostgreSQL database |
| **ORM** | [Drizzle ORM 0.45.2](https://orm.drizzle.team/) + Drizzle Kit | Type-safe schema definition and migrations |
| **Authentication** | [Clerk 7.5.18](https://clerk.com/) | Multi-tenant organization auth & Clerk Billing |
| **Email Service** | [Resend 6.19.0](https://resend.com/) | Transactional email delivery |
| **Video Playback** | [hls.js 1.6.17](https://github.com/video-dev/hls.js/) | Streamed HLS Browserbase session replays |
| **Observability** | [Sentry 10.70.0](https://sentry.io/) | Full-stack error tracing across Edge, Node & Tasks |

---

## 📁 Repository Structure

```
Navix/
├── .env.example                       # Complete annotated environment template
├── AGENTS.md                          # Repository instructions & framework warnings
├── drizzle.config.ts                  # Drizzle ORM configuration (Neon migration settings)
├── liveblocks.config.ts               # Global Liveblocks TypeScript interface definitions
├── next.config.ts                     # Next.js config wrapped with Sentry build plugins
├── package.json                       # Project manifests and package scripts
├── proxy.ts                           # Clerk middleware & protected route matchers
├── trigger.config.ts                  # Trigger.dev task runner & Sentry build configuration
├── tsconfig.json                      # Strict TypeScript compiler options
│
├── app/                               # Next.js 16 App Router
│   ├── (auth)/                        # Authentication routes (Sign-in, Sign-up)
│   ├── (dashboard)/                   # Authenticated workspace application
│   │   ├── billing/                   # Clerk Billing pricing table & plan upgrade
│   │   ├── workflows/[id]/            # Main workflow studio & canvas editor
│   │   ├── layout.tsx                 # Dashboard sidebar provider layout
│   │   └── page.tsx                   # Default empty state & workflow launcher
│   ├── api/                           # Secure proxy and webhook endpoints
│   │   ├── liveblocks/auth/           # Liveblocks ID-token organization authenticator
│   │   ├── liveblocks/users/          # Liveblocks organization user avatar/name resolver
│   │   └── replays/[sessionId]/       # Pro-gated Browserbase HLS replay streaming proxy
│   ├── layout.tsx                     # Root layout with ClerkProvider & ThemeProvider
│   └── globals.css                    # Tailwind CSS v4 design tokens and theme variables
│
├── components/                        # Shared UI component library
│   ├── app-sidebar.tsx                # Organization switcher, workflow list & user button
│   └── ui/                            # Radix / shadcn atomic primitives (buttons, dialogs, etc.)
│
├── docs/                              # Comprehensive Technical Documentation Suite
│   ├── ARCHITECTURE.md                # System design, data flow & dual-state sync
│   ├── EXECUTION_ENGINE.md            # DAG topological sort, interpolation & Trigger.dev task
│   ├── NODE_CATALOG.md                # Node specifications & custom node creation guide
│   ├── ENVIRONMENT_SETUP.md           # Step-by-step account configuration guides
│   ├── API_REFERENCE.md               # Server Actions, API routes, and interfaces
│   └── DEPLOYMENT.md                  # Vercel, Neon, Trigger.dev & Sentry production guide
│
├── features/                          # Domain-driven feature modules
│   ├── init.ts                        # Trigger.dev runtime initialization & Sentry failure hooks
│   └── workflows/                     # Workflow domain implementation
│       ├── actions.ts                 # Next.js Server Actions (create, delete, run, cancel)
│       ├── data.ts                    # Drizzle ORM queries & mutations
│       ├── components/                # Workflow UI (Canvas, Console, Inspector, Sidebar)
│       ├── hooks/                     # Custom React hooks (useProPlan, useUpstreamConnections)
│       ├── lib/                       # Graph validation, interpolation & slug generation
│       ├── nodes/                     # Node registry definitions & Stagehand executors
│       └── tasks/                     # Trigger.dev background tasks (`run-workflow.ts`)
│
└── lib/                               # Core shared server utilities
    ├── browserbase.ts                 # Server-only Browserbase SDK client instance
    ├── liveblocks.ts                  # Server-only Liveblocks Node client instance
    ├── resend.ts                      # Resend email client instance
    ├── utils.ts                       # ClassName merging utilities (clsx + tailwind-merge)
    └── db/                            # Drizzle ORM client, schemas & migrations
        ├── index.ts                   # Neon serverless client connection
        └── schema.ts                  # Workflows table and WorkflowGraph types
```

---

## ⚡ Getting Started & Local Development

### Prerequisites

Ensure you have the following installed on your workstation:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **Package Manager**: `npm` (v10+)
- Accounts on:
  - [Clerk](https://clerk.com) (Authentication & Billing)
  - [Neon](https://neon.tech) (Serverless PostgreSQL)
  - [Liveblocks](https://liveblocks.io) (Multiplayer Canvas)
  - [Browserbase](https://browserbase.com) (Cloud Headless Browsers)
  - [Trigger.dev](https://trigger.dev) (Background Task Worker)
  - [Resend](https://resend.com) (Transactional Email)
  - [Sentry](https://sentry.io) (Observability - optional in local dev)

---

### Step 1: Clone Repository & Install Dependencies

```bash
git clone https://github.com/your-org/navix.git
cd navix
npm install
```

---

### Step 2: Configure Environment Variables

Copy the provided [.env.example](.env.example) template:

```bash
cp .env.example .env
```

Populate the `.env` file with your credentials:
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Neon Postgres (Pooled for runtime, Unpooled for migrations)
DATABASE_URL=postgresql://user:pass@ep-cool-pooler.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-cool.neon.tech/neondb?sslmode=require

# Liveblocks
LIVEBLOCKS_SECRET_KEY=sk_dev_...

# Browserbase & Stagehand
BROWSERBASE_API_KEY=bb_live_...
BROWSERBASE_PROJECT_ID=...

# Trigger.dev
TRIGGER_SECRET_KEY=tr_dev_...

# Resend
RESEND_API_KEY=re_...
```

For complete step-by-step guidance on provisioning each service, read [docs/ENVIRONMENT_SETUP.md](docs/ENVIRONMENT_SETUP.md).

---

### Step 3: Run Database Migrations

Push the Drizzle ORM schema to your Neon Postgres database:

```bash
# Push schema changes directly to Neon:
npm run db:push
```

*(Optional)* Launch Drizzle Studio to view and manage database records:
```bash
npm run db:studio
```

---

### Step 4: Run the Development Environment

Executing workflows locally requires running **two concurrent processes**:

1. **Next.js Web Application**:
   ```bash
   npm run dev
   ```
   *The web app will be available at [http://localhost:3000](http://localhost:3000).*

2. **Trigger.dev Task Worker**:
   In a separate terminal window, start the Trigger.dev CLI dev process:
   ```bash
   npx trigger.dev@latest dev
   ```
   *This connects your local development machine to Trigger.dev Cloud to listen for and execute `run-workflow` tasks.*

---

## 🗄️ Database Management & Migrations

Navix uses **Drizzle ORM** with **Neon Serverless PostgreSQL**.

### Schema Definition (`lib/db/schema.ts`):
```typescript
export type WorkflowGraph = { nodes: StepNodeType[]; edges: Edge[] }

export const workflows = pgTable("workflows", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: text("org_id").notNull(),
  name: text("name").notNull(),
  graph: jsonb("graph").$type<WorkflowGraph>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
})
```

### Available Scripts:
- `npm run db:generate`: Generates SQL migration scripts in `lib/db/migrations`.
- `npm run db:migrate`: Executes pending SQL migrations against the unpooled connection.
- `npm run db:push`: Automatically syncs the schema directly to the database.
- `npm run db:studio`: Opens Drizzle Studio GUI on `https://local.drizzle.studio`.

---

## ⚙️ Trigger.dev Background Tasks

Navix leverages Trigger.dev v4 for executing long-running workflows without hitting Next.js serverless timeout limits (e.g., 15–60s).

### Task Configuration (`trigger.config.ts`):
- **Max Duration**: `3600s` (1 hour compute ceiling per run).
- **Retries**: 3 attempts with exponential backoff and jitter.
- **Sentry Integration**: Global `onFailure` hook in `features/init.ts` captures uncaught exceptions and transmits stack traces to Sentry.

### Execution Flow (`runWorkflowTask`):
1. **Load Graph**: Queries Neon for the serialized `WorkflowGraph` snapshot.
2. **Toposort**: Resolves dependencies, rejects cyclic graphs, and ignores disconnected orphan nodes.
3. **Seed Metadata**: Flushes initial step statuses (`pending`) to Trigger.dev metadata.
4. **Lazy Browserbase Session**: Initializes a single Stagehand session on the first browser action and keeps it open across steps.
5. **Execute & Stream**: Iterates through nodes in sequence, resolves `{{ nodeId.path }}` interpolations, executes actions, and flushes progress live.
6. **Return Payload**: Returns step outputs, execution times, and `browserbaseSessionId` for replay playback.

---

## 🔒 Multi-Tenancy, Security & Billing

### 1. Clerk Organization Isolation
All data operations are strictly partitioned by Clerk's `orgId`:
- Workflows can only be read, modified, or executed by members of the owning organization.
- Liveblocks authorization endpoint (`/api/liveblocks/auth`) validates the active Clerk organization and scopes access tokens exclusively to `groupIds: [orgId]`.
- User resolution (`/api/liveblocks/users`) prevents cross-tenant data leaks by verifying that requested user IDs belong to the caller's organization.

### 2. Feature Gating & Billing
- **Pro Tier Gating**: Premium features like the `Agent` node and **Session Video Replay** require the `pro` organization plan.
- **Defense in Depth**: Plan entitlements are validated both client-side (UI badges, button locks) and server-side in Server Actions and API route handlers using Clerk's `has({ plan: "pro" })`.
- **Checkout Flow**: The `/billing` page mounts Clerk's native `<PricingTable />` for frictionless self-serve upgrades.

---

## 📊 Observability & Error Tracking

Navix implements deep, unified observability powered by **Sentry**:
- **Client Tracing**: `instrumentation-client.ts` monitors canvas interactions and render performance.
- **Server Tracing**: `sentry.server.config.ts` monitors Server Actions and API proxy routes.
- **Edge Tracing**: `sentry.edge.config.ts` tracks edge middleware (`proxy.ts`).
- **Trigger.dev Tasks**: `features/init.ts` registers an `onFailure` hook capturing task failures with complete execution payloads and step context.
- **Isolation Scopes**: Every Server Action and API route attaches the `orgId`, `userId`, and `workflowId` to Sentry's isolation scope for rapid incident triage.

---

## 🚀 Production Deployment

A complete production deployment requires four interconnected cloud services:

1. **Vercel / Next.js Hosting**:
   - Connect your GitHub repository to Vercel.
   - Configure all environment variables listed in `.env.example`.
   - Next.js 16 build is automatically monitored by Sentry with sourcemap uploads.

2. **Trigger.dev Cloud**:
   - Initialize project: `npx trigger.dev@latest init`
   - Deploy task workers: `npx trigger.dev@latest deploy`

3. **Neon Serverless Postgres**:
   - Enable connection pooling for `DATABASE_URL` (ensures high concurrency without connection exhaustion).
   - Use direct unpooled connection for `DATABASE_URL_UNPOOLED`.

4. **Liveblocks & Browserbase**:
   - Configure production secret keys.
   - Verify that your Browserbase billing plan has adequate concurrent session limits.

> 📖 **Checklist**: Follow the step-by-step production deployment manual in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 📚 Documentation Suite

For deeper architectural breakdowns, design patterns, and guides, explore the dedicated documentation suite:

| Document | Focus |
| :--- | :--- |
| 📐 [**Architecture Guide**](docs/ARCHITECTURE.md) | Dual-state synchronization, system boundaries, and sequence diagrams |
| ⚡ [**Execution Engine Mechanics**](docs/EXECUTION_ENGINE.md) | Toposort DAG resolution, interpolation engine, and Trigger.dev workers |
| 🧩 [**Node Registry & Catalog**](docs/NODE_CATALOG.md) | In-depth node schemas, inputs/outputs, and guide to creating new nodes |
| 🛠️ [**Environment Setup Guide**](docs/ENVIRONMENT_SETUP.md) | Account setup and credential configuration for all third-party services |
| 📡 [**API & Actions Reference**](docs/API_REFERENCE.md) | Next.js Server Actions, route handlers, and Liveblocks endpoints |
| 🚢 [**Production Deployment Guide**](docs/DEPLOYMENT.md) | Production hardening, CI/CD, Neon pooling, and Trigger deployments |

---
