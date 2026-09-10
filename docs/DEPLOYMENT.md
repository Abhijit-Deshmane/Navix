# 🚢 Navix Production Deployment Guide

This guide covers production deployment procedures, infrastructure topology, CI/CD integration, and operational best practices for Navix.

---

## 1. Production Architecture Overview

In production, Navix operates across four distributed systems:

```
                                  ┌────────────────────────┐
                                  │      Vercel Edge       │
                                  │   (Clerk Middleware)   │
                                  └───────────┬────────────┘
                                              │
                         ┌────────────────────┴────────────────────┐
                         │                                         │
                         ▼                                         ▼
            ┌────────────────────────┐                ┌────────────────────────┐
            │   Vercel Serverless    │                │    Trigger.dev Cloud   │
            │   Next.js 16 Web App   │                │   Task Worker Pool     │
            │  (Actions & API Proxy) │                │  (Workflow Execution)  │
            └────────────┬───────────┘                └────────────┬───────────┘
                         │                                         │
                         ├────────────────────┬────────────────────┤
                         │                    │                    │
                         ▼                    ▼                    ▼
               ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
               │  Neon PostgreSQL │ │    Liveblocks    │ │   Browserbase    │
               │ Connection Pool  │ │  Global Cluster  │ │  Browser Cloud   │
               └──────────────────┘ └──────────────────┘ └──────────────────┘
```

---

## 2. Deploying the Web Application (Vercel)

1. **Connect Repository**:
   - Link your Git repository (GitHub / GitLab) to [Vercel](https://vercel.com).
   - Framework preset: **Next.js**.

2. **Configure Environment Variables in Vercel**:
   Add the production values for all keys documented in [.env.example](../.env.example):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` & `CLERK_SECRET_KEY`
   - `DATABASE_URL` *(Use Neon Pooled URI)*
   - `DATABASE_URL_UNPOOLED` *(Use Neon Direct Compute URI)*
   - `LIVEBLOCKS_SECRET_KEY`
   - `BROWSERBASE_API_KEY` & `BROWSERBASE_PROJECT_ID`
   - `TRIGGER_SECRET_KEY` *(Production Trigger.dev key)*
   - `RESEND_API_KEY`
   - `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_DSN`

3. **Build & Sentry Sourcemaps**:
   - Next.js build automatically uses `@sentry/nextjs` to upload sourcemaps to Sentry.
   - Sentry configuration automatically tunnels telemetry through `/monitoring` to circumvent client-side ad-blockers.

---

## 3. Deploying Background Workers (Trigger.dev)

Trigger.dev tasks (`run-workflow`) do not execute on Vercel; they run inside dedicated, long-running Trigger.dev compute workers.

### Initializing & Deploying Workers

1. Login to Trigger.dev CLI:
   ```bash
   npx trigger.dev@latest login
   ```

2. Deploy tasks to Trigger.dev Cloud:
   ```bash
   npx trigger.dev@latest deploy
   ```

3. **Configure Worker Environment Variables**:
   Inside the Trigger.dev Cloud Dashboard for your project, configure the following secrets under **Environment Variables**:
   - `BROWSERBASE_API_KEY`
   - `DATABASE_URL`
   - `RESEND_API_KEY`
   - `SENTRY_DSN`

> ⚠️ **Critical Note on Stagehand & Pino**: `run-workflow.ts` explicitly initializes Stagehand with `disablePino: true`. This is required because Pino's multi-threaded worker stream cannot be bundled into isolated serverless worker environments. Do not remove this flag.

---

## 4. Neon Database Production Configuration

1. **Connection Pooling**:
   Always use the **pooled** connection string for `DATABASE_URL` in both Vercel and Trigger.dev. This routes queries through PgBouncer, preventing connection exhaustion during spikes in concurrent workflow runs.

2. **Automated Migrations in CI/CD**:
   In your CI/CD deployment pipeline (e.g., GitHub Actions), run database migrations before deploying Vercel:
   ```bash
   npm run db:push
   # Or for migration-file-driven environments:
   npm run db:migrate
   ```

---

## 5. Security Hardening Checklist

- [ ] **Clerk Webhooks**: If syncing organizations to your database, ensure webhook signing secrets are validated.
- [ ] **Liveblocks Room Permissions**: Verify private room creation in `/api/liveblocks/auth` and ensure `defaultAccesses: []` is strictly enforced.
- [ ] **API Key Rotation**: Regularly rotate `BROWSERBASE_API_KEY`, `TRIGGER_SECRET_KEY`, and `LIVEBLOCKS_SECRET_KEY`.
- [ ] **Browserbase Concurrency Limits**: Monitor your active Browserbase browser session quota to match your organization's peak concurrent workflow runs.

---

## 6. Post-Deployment Smoke Test

1. Visit production URL and authenticate via Clerk.
2. Create an organization or select an active one.
3. Create a workflow named `Production Smoke Test`.
4. Add:
   - `Start`
   - `Open URL` (`https://example.com`)
   - `Extract` (`"Extract the main heading text"`)
5. Connect edges and click **Run**.
6. Verify:
   - Steps transition from `pending` ➔ `running` ➔ `done`.
   - Output payload displays `"Example Domain"`.
   - Sentry dashboard records no unhandled exceptions.
