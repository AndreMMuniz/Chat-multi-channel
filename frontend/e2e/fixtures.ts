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
  contact_id: "contact-1",
  channel: "TELEGRAM",
  status: "OPEN",
  is_unread: false,
  last_message: "Hello there",
  last_message_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  assigned_user_id: null,
  first_response_at: null,
  tag: null,
  contact: {
    id: "contact-1",
    channel_identifier: "@testuser",
    name: null,
    avatar: null,
  },
};

export const MOCK_MESSAGES = [
  {
    id: "msg-1",
    conversation_id: "conv-1",
    content: "Hello there",
    inbound: true,
    message_type: "text",
    delivery_status: "delivered",
    conversation_sequence: 1,
    created_at: new Date().toISOString(),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Seed localStorage before page load — avoids the auth redirect. */
export async function seedAuth(page: Page) {
  await page.addInitScript(
    ({ token, user }) => {
      localStorage.setItem("auth_token", token);
      localStorage.setItem("auth_user", JSON.stringify(user));
    },
    { token: "mock-access-token-123", user: MOCK_USER }
  );
}

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
      route.fallback();
    }
  });
}

export async function mockMessages(page: Page) {
  await page.route(
    "**/api/v1/chat/conversations/*/messages**",
    (route: Route) => {
      if (route.request().method() === "GET") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: MOCK_MESSAGES, total: 1 }),
        });
      } else {
        route.fallback();
      }
    }
  );
}

export async function mockSendMessage(page: Page, replyContent: string) {
  await page.route(
    "**/api/v1/chat/conversations/*/messages",
    (route: Route) => {
      if (route.request().method() === "POST") {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: {
              id: "msg-new",
              conversation_id: "conv-1",
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
        route.fallback();
      }
    }
  );
}

/** Catch-all: silently return empty 200 for any unmocked API call. */
export async function mockApiCatchAll(page: Page) {
  await page.route("**/api/v1/**", (route: Route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [], total: 0 }),
    });
  });
}
