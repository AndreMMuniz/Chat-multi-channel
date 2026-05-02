import { test, expect, devices } from "@playwright/test";
import {
  seedAuth,
  mockConversations,
  mockMessages,
  mockAISuggestions,
  mockApiCatchAll,
} from "./fixtures";

const SUGGESTIONS = [
  "Thank you for your message!",
  "I'll look into this right away.",
  "Could you please provide more details?",
];

// ── Mobile AI input tests ──────────────────────────────────────────────────────

test.describe("Mobile — AI Sparkles Input", () => {
  test.use({ ...devices["iPhone 14"] });

  test.beforeEach(async ({ page }) => {
    await mockApiCatchAll(page);
    await mockConversations(page);
    await mockMessages(page);
    await mockAISuggestions(page, SUGGESTIONS);
    await seedAuth(page);
    await page.goto("/");
    // Navigate to chat screen
    await page.getByTestId("conversation-item").first().click();
    await expect(page.getByTestId("chat-area")).toBeInViewport({ timeout: 5000 });
  });

  test("sparkles button is visible inside input row on mobile", async ({ page }) => {
    await expect(page.getByTestId("ai-sparkles-button")).toBeVisible();
  });

  test("tapping sparkles opens bottom sheet", async ({ page }) => {
    await page.getByTestId("ai-sparkles-button").click();
    await expect(page.getByTestId("ai-suggestions-sheet")).toBeVisible({ timeout: 5000 });
  });

  test("sheet shows suggestion items when AI responds", async ({ page }) => {
    await page.getByTestId("ai-sparkles-button").click();
    await expect(page.getByTestId("ai-suggestions-sheet")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("ai-suggestion-item").first()).toBeVisible({ timeout: 5000 });
  });

  test("selecting a suggestion inserts text into input and closes sheet", async ({ page }) => {
    await page.getByTestId("ai-sparkles-button").click();
    await expect(page.getByTestId("ai-suggestion-item").first()).toBeVisible({ timeout: 5000 });
    await page.getByTestId("ai-suggestion-item").first().click();
    await expect(page.getByTestId("message-input")).toHaveValue(SUGGESTIONS[0]);
    await expect(page.getByTestId("ai-suggestions-sheet")).not.toBeVisible();
  });

  test("sheet closes when backdrop is tapped", async ({ page }) => {
    await page.getByTestId("ai-sparkles-button").click();
    await expect(page.getByTestId("ai-suggestions-sheet")).toBeVisible({ timeout: 5000 });
    // Click the backdrop (fixed inset-0 div behind the sheet panel)
    await page.mouse.click(10, 10);
    await expect(page.getByTestId("ai-suggestions-sheet")).not.toBeVisible({ timeout: 3000 });
  });
});

// ── Desktop regression ─────────────────────────────────────────────────────────

test.describe("Desktop — AI sparkles not present", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await mockApiCatchAll(page);
    await mockConversations(page);
    await mockMessages(page);
    await mockAISuggestions(page, SUGGESTIONS);
    await seedAuth(page);
    await page.goto("/");
    await page.getByTestId("conversation-item").first().click();
    await expect(page.getByTestId("chat-area")).toBeInViewport({ timeout: 5000 });
  });

  test("sparkles button not visible on desktop", async ({ page }) => {
    await expect(page.getByTestId("ai-sparkles-button")).not.toBeVisible();
  });

  test("desktop AI suggestion panel in right sidebar is visible", async ({ page }) => {
    // The right sidebar with AI suggestions is hidden md:flex — visible on desktop
    await expect(page.locator("text=AI Suggestions")).toBeVisible({ timeout: 5000 });
  });
});
