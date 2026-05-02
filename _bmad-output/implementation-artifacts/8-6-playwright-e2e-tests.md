# Story 8.6: Playwright E2E Tests

**Status:** ready-for-dev
**Epic:** 8 — Production Hardening
**Story Points:** 8
**Priority:** Important
**Created:** 2026-04-30

---

## User Story

**As a developer,** I want Playwright tests for critical user flows so that UI regressions are caught in CI before they reach production.

---

## Background & Context

**Retro finding (2026-04-29):** Zero UI regression coverage. Changes to the dashboard or auth flow can silently break the product.

**Current frontend state:**
- Next.js 16 / React 19 / TypeScript
- Unit tests: Vitest (already configured in `frontend/vitest.config.ts`)
- E2E: **Nothing — Playwright not installed, no config**
- No `.github/workflows/` directory exists at all
- Auth: Bearer token stored in `localStorage` under key `auth_token`; user info under `auth_user`
- WebSocket URL: `NEXT_PUBLIC_WS_URL` env var (default: `ws://localhost:8000/api/v1/chat/ws`)
- API URL: `NEXT_PUBLIC_API_URL` env var (default: `http://localhost:8000/api/v1`)

**Frontend routes:**
- `/login` — public, email + password
- `/signup` — public, self-service registration
- `/dashboard` — protected, 3-column chat inbox
- `/admin/*` — protected, admin panel

**Auth API shape (from `frontend/src/lib/api/auth.ts`):**
```
POST /api/v1/auth/login
Body: { email, password }
Response: { data: { access_token, refresh_token, user: { id, email, full_name, avatar?, user_type? } } }
```

---

## Design Decisions

### Testing approach
**API mocking via `page.route()`** — intercept all `fetch()` calls to the backend. This means:
- Tests never hit a real backend
- Tests are fast, deterministic, and run in CI without a running server
- WebSocket events are simulated by firing CustomEvents or mocking the WS connection

This is the right call because: the backend is on Railway (not easily available in GitHub Actions), and E2E tests should test UI behavior, not the full integration stack.

### Test scope (MVP for this story)
**Golden path only:**
1. Login → redirect to dashboard
2. Dashboard loads conversation list
3. Open a conversation → messages appear
4. Send a message → message appears in thread

**Edge cases deferred:** logout flow, admin panel, WebSocket reconnection, file upload.

### CI
Create `.github/workflows/playwright.yml` running on push to `main` and `preview`. Uploads screenshots on failure.

---

## Files to Create / Modify

| File | Action | Notes |
|------|--------|-------|
| `frontend/package.json` | **UPDATE** | Add `@playwright/test` dev dependency |
| `frontend/playwright.config.ts` | **CREATE** | Playwright config pointing to `http://localhost:3000` |
| `frontend/e2e/fixtures.ts` | **CREATE** | Shared mock data and API intercept helpers |
| `frontend/e2e/auth.spec.ts` | **CREATE** | Login flow tests |
| `frontend/e2e/dashboard.spec.ts` | **CREATE** | Inbox + conversation + send message tests |
| `.github/workflows/playwright.yml` | **CREATE** | CI workflow |

**Do NOT modify:** `vitest.config.ts`, existing test files, `next.config.ts`, `src/` application code.

---

## Implementation Guide

### Step 1 — Install Playwright

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install chromium  # chromium only for CI speed
```

### Step 2 — `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,  // sequential for now — WS state is tricky parallel
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // No webServer — tests use mock API, no real backend needed
});
```

### Step 3 — `frontend/e2e/fixtures.ts`

```typescript
import { Page, Route } from "@playwright/test";

// ── Mock data ─────────────────────────────────────────────────────────────────

export const MOCK_USER = {
  id: "user-1",
  email: "agent@test.com",
  full_name: "Test Agent",
  user_type: { base_role: "USER" },
};

export const MOCK_CREDENTIALS = {
  email: "agent@test.com",
  password: "Password1!",
};

export const MOCK_CONVERSATION = {
  id: "conv-1",
  channel: "TELEGRAM",
  status: "OPEN",
  is_unread: false,
  contact: { id: "contact-1", channel_identifier: "@testuser", avatar: null },
  last_message: "Hello there",
  created_at: new Date().toISOString(),
  assigned_user_id: null,
  first_response_at: null,
  tag: null,
};

export const MOCK_MESSAGES = [
  {
    id: "msg-1",
    content: "Hello there",
    inbound: true,
    message_type: "text",
    delivery_status: "delivered",
    conversation_sequence: 1,
    created_at: new Date().toISOString(),
  },
];

// ── API mock helpers ──────────────────────────────────────────────────────────

export async function mockLogin(page: Page) {
  await page.route("**/api/v1/auth/login", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          access_token: "mock-access-token-123",
          refresh_token: "mock-refresh-token-456",
          user: MOCK_USER,
        },
      }),
    });
  });
}

export async function mockConversations(page: Page) {
  await page.route("**/api/v1/chat/conversations**", (route: Route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [MOCK_CONVERSATION], total: 1 }),
      });
    } else {
      route.continue();
    }
  });
}

export async function mockMessages(page: Page) {
  await page.route("**/api/v1/chat/conversations/*/messages**", (route: Route) => {
    if (route.request().method() === "GET") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_MESSAGES, total: 1 }),
      });
    } else {
      route.continue();
    }
  });
}

export async function mockSendMessage(page: Page, replyContent: string) {
  await page.route("**/api/v1/chat/conversations/*/messages", (route: Route) => {
    if (route.request().method() === "POST") {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            id: "msg-new",
            content: replyContent,
            inbound: false,
            message_type: "text",
            delivery_status: "sent",
            conversation_sequence: 2,
            created_at: new Date().toISOString(),
          },
        }),
      });
    } else {
      route.continue();
    }
  });
}

export async function mockWebSocket(page: Page) {
  // Block WebSocket connections — tests don't need real-time events
  await page.route("ws://**", (route: Route) => route.abort());
  await page.route("wss://**", (route: Route) => route.abort());
}

export async function seedLocalStorage(page: Page) {
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    { token: "mock-access-token-123", user: MOCK_USER }
  );
}
```

### Step 4 — `frontend/e2e/auth.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import { mockLogin, mockWebSocket, MOCK_CREDENTIALS } from "./fixtures";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await mockWebSocket(page);
  });

  test("valid credentials redirect to dashboard", async ({ page }) => {
    await mockLogin(page);
    await page.goto("/login");

    await page.getByLabel(/email/i).fill(MOCK_CREDENTIALS.email);
    await page.getByLabel(/password/i).fill(MOCK_CREDENTIALS.password);
    await page.getByRole("button", { name: /sign in|login/i }).click();

    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid credentials" }),
      });
    });

    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("wrongpass");
    await page.getByRole("button", { name: /sign in|login/i }).click();

    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
    await expect(page).toHaveURL(/\/login/);  // stays on login
  });

  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});
```

### Step 5 — `frontend/e2e/dashboard.spec.ts`

```typescript
import { test, expect } from "@playwright/test";
import {
  mockConversations,
  mockMessages,
  mockSendMessage,
  mockWebSocket,
  seedLocalStorage,
  MOCK_CONVERSATION,
} from "./fixtures";

test.describe("Dashboard — Golden Path", () => {
  test.beforeEach(async ({ page }) => {
    await mockWebSocket(page);
    await mockConversations(page);
    await mockMessages(page);

    // Navigate to dashboard with pre-seeded auth token
    await page.goto("/dashboard");
    await seedLocalStorage(page);
    await page.reload();
  });

  test("inbox loads conversation list", async ({ page }) => {
    await expect(
      page.getByText(MOCK_CONVERSATION.contact.channel_identifier)
    ).toBeVisible({ timeout: 5000 });
  });

  test("clicking conversation opens message thread", async ({ page }) => {
    await page.getByText(MOCK_CONVERSATION.contact.channel_identifier).click();
    await expect(page.getByText("Hello there")).toBeVisible({ timeout: 5000 });
  });

  test("sending a message appends it to the thread", async ({ page }) => {
    const replyText = "Thank you for reaching out!";
    await mockSendMessage(page, replyText);

    await page.getByText(MOCK_CONVERSATION.contact.channel_identifier).click();

    // Find message input and send
    const input = page.getByPlaceholder(/type a message|write a message/i);
    await input.fill(replyText);
    await input.press("Enter");

    await expect(page.getByText(replyText)).toBeVisible({ timeout: 5000 });
  });
});
```

### Step 6 — `.github/workflows/playwright.yml`

```yaml
name: Playwright E2E

on:
  push:
    branches: [main, preview]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: npm
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Build Next.js app
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: http://localhost:8000/api/v1
          NEXT_PUBLIC_WS_URL: ws://localhost:8000/api/v1/chat/ws

      - name: Start Next.js server
        run: npm start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000 --timeout 30000

      - name: Run Playwright tests
        run: npx playwright test
        env:
          PLAYWRIGHT_BASE_URL: http://localhost:3000

      - name: Upload failure screenshots
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-screenshots
          path: frontend/test-results/
          retention-days: 7
```

Add `wait-on` to package.json dev dependencies:
```bash
npm install --save-dev wait-on
```

---

## Acceptance Criteria

- [ ] `@playwright/test` installed and `playwright.config.ts` exists.
- [ ] `e2e/auth.spec.ts` — 3 tests: valid login redirects, invalid shows error, unauth redirects.
- [ ] `e2e/dashboard.spec.ts` — 3 tests: inbox loads, conversation opens, message sends.
- [ ] All 6 tests pass locally with `npx playwright test` (no backend needed — mocked).
- [ ] `.github/workflows/playwright.yml` exists and tests run on push.
- [ ] Screenshots saved as artifacts on failure.
- [ ] Existing Vitest tests still pass (`npm test`).

---

## Definition of Done

- [ ] `playwright.config.ts` at `frontend/` root.
- [ ] `frontend/e2e/` folder with `fixtures.ts`, `auth.spec.ts`, `dashboard.spec.ts`.
- [ ] `package.json` updated with `@playwright/test` and `wait-on`.
- [ ] GitHub Actions workflow created.
- [ ] `npx playwright test` exits 0 locally.
- [ ] Sprint status updated: `8-6-playwright-e2e-tests: review`.

---

### Review Findings (2026-04-30)

- [x] [Review][Defer] `mockMessages` glob `"*/messages**"` also matches POST /messages — in tests without `mockSendMessage`, a send call silently returns `{data:[], total:0}` via catch-all [`frontend/e2e/fixtures.ts:95`] — deferred, no current test exercises this path
