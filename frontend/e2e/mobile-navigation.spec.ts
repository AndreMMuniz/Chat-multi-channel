import { test, expect, devices } from "@playwright/test";
import {
  seedAuth,
  mockConversations,
  mockMessages,
  mockApiCatchAll,
  MOCK_CONVERSATION,
} from "./fixtures";

// ── Mobile viewport tests ──────────────────────────────────────────────────────

test.describe("Mobile Navigation — WhatsApp-style", () => {
  test.use({ ...devices["iPhone 14"] });

  test.beforeEach(async ({ page }) => {
    await mockApiCatchAll(page);
    await mockConversations(page);
    await mockMessages(page);
    await seedAuth(page);
    await page.goto("/");
  });

  test("conversation list is visible on mobile home", async ({ page }) => {
    await expect(page.getByTestId("conversation-list")).toBeInViewport({ timeout: 8000 });
    await expect(page.getByTestId("chat-area")).not.toBeInViewport();
  });

  test("selecting a conversation slides to chat screen", async ({ page }) => {
    await page.getByTestId("conversation-item").first().click();
    await expect(page.getByTestId("chat-area")).toBeInViewport({ timeout: 5000 });
    await expect(page.getByTestId("conversation-list")).not.toBeInViewport();
  });

  test("back button returns to conversation list", async ({ page }) => {
    await page.getByTestId("conversation-item").first().click();
    await expect(page.getByTestId("back-button")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("back-button").click();
    await expect(page.getByTestId("conversation-list")).toBeInViewport({ timeout: 3000 });
    await expect(page.getByTestId("chat-area")).not.toBeInViewport();
  });

  test("back button is only visible on mobile", async ({ page }) => {
    await page.getByTestId("conversation-item").first().click();
    await expect(page.getByTestId("back-button")).toBeVisible();
  });
});

// ── Desktop regression ─────────────────────────────────────────────────────────

test.describe("Desktop — 3-column layout regression", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await mockApiCatchAll(page);
    await mockConversations(page);
    await mockMessages(page);
    await seedAuth(page);
    await page.goto("/");
  });

  test("both conversation list and chat area visible simultaneously", async ({ page }) => {
    await expect(page.getByTestId("conversation-list")).toBeInViewport({ timeout: 8000 });
    // Chat area is in the DOM but showing the empty-state placeholder on desktop
    await expect(page.getByTestId("chat-area")).toBeInViewport();
  });

  test("back button not visible on desktop", async ({ page }) => {
    await page.getByTestId("conversation-item").first().click();
    // back-button has md:hidden — not visible on desktop
    await expect(page.getByTestId("back-button")).not.toBeVisible();
  });

  test("conversation item click opens chat without hiding list", async ({ page }) => {
    await page.getByTestId("conversation-item").first().click();
    await expect(page.getByTestId("conversation-list")).toBeInViewport({ timeout: 5000 });
    await expect(page.getByTestId("chat-area")).toBeInViewport();
  });
});
