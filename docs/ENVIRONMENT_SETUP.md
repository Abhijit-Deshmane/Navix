# 🛠️ Navix Environment & Services Setup Guide

This guide walks through the step-by-step account provisioning, credential acquisition, and configuration procedures for all third-party services powering Navix.

---

## 1. Prerequisites Checklist

- **Node.js**: `v20.x` or `v22.x` (LTS)
- **Package Manager**: `npm` (v10+)
- **Git**: Installed and configured

---

## 2. Service-by-Service Setup

### 1. Clerk (Authentication, Organizations & Billing)
Navix relies on Clerk for multi-tenant identity and subscription gating.

1. Navigate to [dashboard.clerk.com](https://dashboard.clerk.com) and create an application.
2. In **User & Authentication** > **Organizations**, toggle **Enable Organizations** to **ON**.
3. In **Configure** > **Developers** > **API Keys**:
   - Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`).
   - Copy `CLERK_SECRET_KEY` (starts with `sk_test_`).
4. In **Billing** (Clerk Billing):
   - Create a subscription plan with the slug **`pro`** (Navix specifically evaluates `has({ plan: "pro" })`).
5. Add the following redirect settings to `.env`:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
   ```

---

### 2. Neon (Serverless PostgreSQL Database)
Navix uses Neon Serverless Postgres with Drizzle ORM.

1. Sign up at [neon.tech](https://neon.tech) and create a project (e.g., `navix-db`).
2. In your Neon Project Dashboard under **Connection Details**:
   - Select **Pooled connection** and copy the URI to `DATABASE_URL`:
     ```
     DATABASE_URL=postgresql://user:pass@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
   - Uncheck **Pooled connection** (direct compute endpoint) and copy the URI to `DATABASE_URL_UNPOOLED` (used for running Drizzle migrations):
     ```
     DATABASE_URL_UNPOOLED=postgresql://user:pass@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require
     ```
3. Apply the database schema:
   ```bash
   npm run db:push
   ```

---

### 3. Liveblocks (Multiplayer CRDT Canvas)
Liveblocks synchronizes the React Flow nodes and cursors in real-time.

1. Register at [liveblocks.io](https://liveblocks.io) and create a project.
2. In **Project Settings** > **API Keys**, copy the **Secret Key** (`sk_dev_...`).
3. Add to `.env`:
   ```env
   LIVEBLOCKS_SECRET_KEY=sk_dev_...
   ```
4. *Room Security*: Navix automatically creates and manages private rooms with organization-scoped write access via `/api/liveblocks/auth`.

---

### 4. Browserbase & Stagehand (Cloud Headless Browsers & AI)
Browserbase provides cloud-hosted, anti-detect Chrome browsers, and Stagehand runs agentic workflows using Google Gemini 2.5 Flash.

1. Sign up at [browserbase.com](https://browserbase.com).
2. Under **Settings** > **API Keys**, generate and copy your API Key.
3. Under **Settings**, copy your default **Project ID**.
4. Add to `.env`:
   ```env
   BROWSERBASE_API_KEY=bb_live_...
   BROWSERBASE_PROJECT_ID=...
   ```
> 💡 **Model Gateway**: Stagehand connects to Google Gemini 2.5 Flash directly through Browserbase's built-in Model Gateway using your `BROWSERBASE_API_KEY`. No separate Google AI or OpenAI API key is needed.

---

### 5. Trigger.dev (Durable Background Tasks)
Trigger.dev v4 executes long-running workflows with topological DAG sorting and retries.

1. Sign up at [cloud.trigger.dev](https://cloud.trigger.dev) and create a project.
2. In **Project Settings** > **API Keys**, copy your `DEV` secret key (`tr_dev_...`).
3. Update `trigger.config.ts` with your Project Reference ID (e.g., `project: "proj_dlpllaeeqcnzecwehmzk"`).
4. Add to `.env`:
   ```env
   TRIGGER_SECRET_KEY=tr_dev_...
   ```

---

### 6. Resend (Transactional Email)
Resend powers the `send-email` action node.

1. Sign up at [resend.com](https://resend.com).
2. In **API Keys**, generate a new key (`re_...`).
3. Add to `.env`:
   ```env
   RESEND_API_KEY=re_...
   ```
*(In development, emails can be sent to your registered account email using the default `onboarding@resend.dev` sender).*

---

### 7. Sentry (Full-Stack Observability - Optional for Dev)
Sentry tracks performance, crashes, and exceptions across Client, Node, Edge, and Trigger.dev.

1. Sign up at [sentry.io](https://sentry.io) and create a Next.js project.
2. Add your DSN to `.env`:
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://...@o000.ingest.sentry.io/...
   SENTRY_DSN=https://...@o000.ingest.sentry.io/...
   ```
3. For source map uploads during production builds:
   ```env
   SENTRY_AUTH_TOKEN=sntrys_...
   SENTRY_ORG=your-sentry-org
   SENTRY_PROJECT=navix
   ```

---

## 3. Running Navix Locally

Once `.env` is fully populated:

```bash
# Terminal 1: Run the Next.js dev server
npm run dev

# Terminal 2: Run the Trigger.dev background worker
npx trigger.dev@latest dev
```

Visit `http://localhost:3000`, sign in with Clerk, create or select an organization, and launch your first collaborative workflow!
