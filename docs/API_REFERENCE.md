# 📡 Navix API & Actions Reference

This document provides a comprehensive technical reference for Navix's Next.js Server Actions, internal API route handlers, and background tasks.

---

## 1. Next.js Server Actions (`features/workflows/actions.ts`)

All workflow mutations are implemented as authenticated Next.js Server Actions (`"use server"`).

### 1. `createWorkflowAction(name: string)`
Creates a new workflow within the user's active Clerk organization.

- **Parameters**:
  - `name` *(string)*: Human-readable name for the workflow.
- **Security**: Validates active Clerk `orgId`. Throws error if no organization is active.
- **Behavior**:
  - Sets Sentry isolation scope with `action: "createWorkflowAction"`, `orgId`.
  - Inserts a record into the `workflows` table in Neon Postgres.
  - Revalidates path `/workflows`.
  - Redirects user to `/workflows/${workflow.id}`.

---

### 2. `deleteWorkflowAction(id: string)`
Permanently deletes a workflow and cleans up associated cloud resources.

- **Parameters**:
  - `id` *(string)*: The UUID of the workflow to delete.
- **Security**: Ensures the target workflow belongs to the caller's active `orgId`.
- **Behavior**:
  - Deletes the workflow record from Neon Postgres.
  - Deletes the associated Liveblocks collaborative room via `liveblocks.deleteRoom(id)`.
  - Revalidates `/workflows` and redirects to `/`.

---

### 3. `runWorkflowAction({ id, graph })`
Saves the latest canvas graph snapshot and kicks off durable background execution.

- **Parameters**:
  - `id` *(string)*: Workflow UUID.
  - `graph` *(WorkflowGraph)*: Canvas snapshot `{ nodes: StepNodeType[], edges: Edge[] }`.
- **Security & Entitlements**:
  - Validates active `orgId`.
  - Checks if any node in the graph is of type `agent`. If found, verifies that the active organization is subscribed to the **Pro Plan** via `has({ plan: "pro" })`. Throws an error if not entitled.
- **Behavior**:
  - Validates the graph structure (`validateGraph`).
  - Persists the graph snapshot to Neon Postgres (`saveWorkflowGraph`).
  - Triggers the Trigger.dev task `"run-workflow"` with tags `["workflow:${id}"]`.
  - Returns the Trigger task handle (`{ id: string }`).

---

### 4. `cancelWorkflowRunAction(runId: string)`
Aborts a live workflow run currently in flight.

- **Parameters**:
  - `runId` *(string)*: The active Trigger.dev run ID.
- **Security**: Validates caller's active `orgId`.
- **Behavior**:
  - Invokes `runs.cancel(runId)` via `@trigger.dev/sdk`.

---

## 2. API Route Handlers

### 1. `POST /api/liveblocks/auth`
Authenticates a user for Liveblocks WebSocket room connection.

- **Method**: `POST`
- **Authentication**: Requires active Clerk user session and active organization.
- **Response**: Liveblocks identity token.
- **Security Implementation**:
  ```typescript
  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds: [orgId], // Restricts access strictly to rooms matching the organization
      organizationId: orgId,
    },
    {
      userInfo: {
        name: user.fullName ?? user.username ?? "Anonymous",
        avatar: user.imageUrl,
      },
    }
  )
  ```

---

### 2. `POST /api/liveblocks/users`
Resolves user display names and avatars for multiplayer presence chips.

- **Method**: `POST`
- **Payload**: `{ userIds: string[] }`
- **Tenant Isolation**: Only resolves users belonging to the caller's active organization via Clerk Client SDK (`clerkClient.users.getUserList({ organizationId: [orgId] })`), preventing arbitrary user enumeration across tenants.
- **Response**: Array of `{ name: string, avatar?: string }` objects matching the input array order.

---

### 3. `GET /api/replays/[sessionId]`
Secure proxy that serves the HLS `.m3u8` playlist for a Browserbase browser recording.

- **Method**: `GET`
- **Path Parameters**: `sessionId` - Browserbase session ID.
- **Security & Gating**:
  - Requires authenticated session with an active organization.
  - Requires active **Pro Plan** (`has({ plan: "pro" })`). Returns `403 Forbidden` if on the free tier.
- **Status Codes**:
  - `200 OK`: Recording is processed. Returns `.m3u8` playlist text with `Content-Type: application/vnd.apple.mpegurl` and `Cache-Control: no-store`.
  - `202 Accepted`: Recording is still being encoded by Browserbase. Signals the client `<SessionReplay />` component to poll again.
  - `401 Unauthorized`: No active session.
  - `403 Forbidden`: Organization is not on the Pro plan.

---

## 3. Background Task Specification (`runWorkflowTask`)

Defined in `features/workflows/tasks/run-workflow.ts`:

- **Task Identifier**: `"run-workflow"`
- **Payload**:
  ```typescript
  {
    workflowId: string
    orgId: string
  }
  ```
- **Live Metadata Stream (`metadata.get("steps")`)**:
  ```typescript
  type RunStep = {
    nodeId: string
    type: NodeType
    title: string
    status: "pending" | "running" | "done" | "failed"
    durationMs?: number
    output?: unknown
    error?: string
  }
  ```
- **Task Return Output**:
  ```typescript
  {
    steps: RunStep[]
    browserbaseSessionId?: string
  }
  ```
