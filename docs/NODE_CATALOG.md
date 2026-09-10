# 🧩 Navix Node Catalog & Developer Guide

This document defines the schema, behavior, and output contracts of every workflow node in Navix, along with a comprehensive developer guide for extending the platform with custom nodes.

---

## 1. Node Architecture & Types

All nodes are registered in `features/workflows/nodes/node-registry.ts`. A node definition specifies its metadata, user-configurable fields, and exported outputs:

```typescript
export type StepNodeKind = "trigger" | "action"

export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
}

export type NodeOutput = {
  path: string
  label: string
}

export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind CSS color styling
  fields: NodeField[]
  outputs: NodeOutput[]
}
```

---

## 2. Complete Node Catalog

### 1. `start` (Trigger)
- **Kind**: Trigger
- **Description**: The required single entry point for any workflow.
- **Accent**: `bg-blue-500 text-white`
- **Fields**: *None*
- **Outputs**: *None*
- **Runtime Execution**: No-op (automatically marked `done` by runner).
- **Entitlement**: Available on all plans.

---

### 2. `open-url` (Action)
- **Kind**: Action
- **Description**: Navigates the shared Browserbase cloud browser session to a destination URL and waits for page load.
- **Accent**: `bg-emerald-500 text-white`
- **Fields**:
  - `url` *(Required, text)*: Destination URL (e.g., `https://news.ycombinator.com`).
- **Outputs**:
  - `url` *(string)*: The final loaded URL (accounting for HTTP/JS redirects).
  - `title` *(string)*: The page title (`<title>` tag content).
- **Executor (`open-url.ts`)**:
  ```typescript
  export async function openUrl({ stagehand, url }: { stagehand: Stagehand; url: string }) {
    const page = stagehand.context.pages()[0]
    await page.goto(url, { waitUntil: "load", timeoutMs: 30_000 })
    return { url: page.url(), title: await page.title() }
  }
  ```

---

### 3. `act` (Action)
- **Kind**: Action
- **Description**: Executes a natural language user interaction on the active page via Stagehand (clicks, typing, dropdown selection).
- **Accent**: `bg-violet-500 text-white`
- **Fields**:
  - `instruction` *(Required, multiline)*: Action instruction (e.g., *"Click the 'Sign In' button and submit the form"*).
- **Outputs**:
  - `success` *(boolean)*: True if the action succeeded.
  - `message` *(string)*: Explanation of the executed step.
  - `url` *(string)*: The current page URL following the action.
- **Executor (`act.ts`)**:
  ```typescript
  export async function act({ stagehand, instruction }: { stagehand: Stagehand; instruction: string }) {
    const result = await stagehand.act(instruction)
    const page = stagehand.context.pages()[0]
    return { success: result.success, message: result.message, url: page.url() }
  }
  ```

---

### 4. `extract` (Action)
- **Kind**: Action
- **Description**: Extracts structured data or textual content from the active DOM based on natural language instructions using Gemini 2.5 Flash.
- **Accent**: `bg-amber-500 text-white`
- **Fields**:
  - `instruction` *(Required, multiline)*: Extraction prompt (e.g., *"Extract the product name, price, and customer rating"*).
- **Outputs**:
  - `extraction` *(unknown / JSON)*: The extracted content or schema payload.
- **Executor (`extract.ts`)**:
  ```typescript
  export async function extract({ stagehand, instruction }: { stagehand: Stagehand; instruction: string }) {
    const { extraction } = await stagehand.extract(instruction)
    return { extraction }
  }
  ```

---

### 5. `observe` (Action)
- **Kind**: Action
- **Description**: Scans the active page for DOM elements matching an intent and returns optimal CSS/XPath selectors.
- **Accent**: `bg-sky-500 text-white`
- **Fields**:
  - `instruction` *(Required, multiline)*: Observation intent (e.g., *"Find the shopping cart checkout button"*).
- **Outputs**:
  - `matches` *(array)*: List of matching element objects.
  - `matches[0].selector` *(string)*: Discovered CSS/XPath selector of the top match.
  - `matches[0].description` *(string)*: Description of the matched element.
- **Executor (`observe.ts`)**:
  ```typescript
  export async function observe({ stagehand, instruction }: { stagehand: Stagehand; instruction: string }) {
    const results = await stagehand.observe(instruction)
    return {
      matches: results.map(({ selector, description }) => ({ selector, description })),
    }
  }
  ```

---

### 6. `agent` (Action - 🔒 Pro Only)
- **Kind**: Action
- **Description**: Launches an autonomous multi-step Stagehand agent capable of recursive reasoning, handling paginated workflows, and completing complex goals without hardcoded steps.
- **Accent**: `bg-rose-500 text-white`
- **Tier Gate**: Gated behind Clerk **Pro Plan** (`has({ plan: "pro" })`).
- **Fields**:
  - `instruction` *(Required, multiline)*: Autonomous objective (e.g., *"Navigate through the top 3 pages, find all flights under $500, and compile them"*).
- **Outputs**:
  - `success` *(boolean)*: Overall agent completion status.
  - `message` *(string)*: Summary of actions taken.
  - `completed` *(boolean)*: True if all sub-goals succeeded.
- **Executor (`agent.ts`)**:
  ```typescript
  export async function agent({ stagehand, instruction }: { stagehand: Stagehand; instruction: string }) {
    const result = await stagehand.agent().execute(instruction)
    return {
      success: result.success,
      message: result.message,
      completed: result.completed,
    }
  }
  ```

---

### 7. `send-email` (Action)
- **Kind**: Action
- **Description**: Dispatches a transactional email via Resend containing static text or interpolated output variables.
- **Accent**: `bg-teal-500 text-white`
- **Fields**:
  - `to` *(Required, text)*: Recipient email address.
  - `subject` *(Required, text)*: Email subject line.
  - `body` *(Required, multiline)*: HTML or text email content.
- **Outputs**:
  - `id` *(string)*: Dispatched Resend email ID.
- **Executor (`send-email.ts`)**:
  ```typescript
  export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject,
      html: body,
    })
    if (error || !data) throw new Error(error?.message ?? "Resend failed")
    return { id: data.id }
  }
  ```

---

## 3. Developer Guide: Adding a Custom Node

Adding a new node to Navix requires four straightforward steps:

### Step 1: Define the Node in `node-registry.ts`

Add a new key to the `nodeRegistry` object:

```typescript
// features/workflows/nodes/node-registry.ts
import { Webhook } from "lucide-react"

export const nodeRegistry = {
  // ... existing nodes
  webhook: {
    type: "webhook",
    kind: "action",
    label: "Webhook Call",
    icon: Webhook,
    accent: "bg-indigo-500 text-white",
    fields: [
      { key: "url", label: "Endpoint URL", placeholder: "https://api.example.com/webhook", required: true },
      { key: "payload", label: "JSON Payload", multiline: true, placeholder: '{"key": "value"}' },
    ],
    outputs: [
      { path: "status", label: "Status Code" },
      { path: "response", label: "Response Body" },
    ],
  },
}
```

### Step 2: Implement the Node Executor

Create `features/workflows/nodes/webhook.ts`:

```typescript
// features/workflows/nodes/webhook.ts
export async function webhook({ url, payload }: { url: string; payload?: string }) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload || JSON.stringify({}),
  })
  
  const text = await res.text()
  let response: unknown
  try {
    response = JSON.parse(text)
  } catch {
    response = text
  }

  return { status: res.status, response }
}
```

### Step 3: Register Executor in `node-executors.ts`

```typescript
// features/workflows/nodes/node-executors.ts
import { webhook } from "./webhook"

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  // ... existing executors
  webhook: async ({ values }) =>
    webhook({ url: values.url, payload: values.payload }),
}
```

### Step 4: Done!
The node will automatically appear in:
1. The **Toolbar Palette** under the **Actions** accordion.
2. The **Inspector Editor** with form fields and validation.
3. Upstream connection pickers for downstream nodes to interpolate `{{ webhook_node.response }}`.
