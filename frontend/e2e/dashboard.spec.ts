import { test, expect } from "@playwright/test";
import {
  seedAuth,
  mockConversations,
  mockMessages,
  mockSendMessage,
  mockApiCatchAll,
  MOCK_CONVERSATION,
} from "./fixtures";

test.describe("Inbox — Golden Path", () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all first (lowest priority — matched last)
    await mockApiCatchAll(page);
    // Specific mocks (higher priority — matched first due to LIFO)
    await mockConversations(page);
    await mockMessages(page);
    // Seed auth before page load so ClientLayout doesn't redirect
    await seedAuth(page);
    await page.goto("/");
  });

  test("inbox loads conversation list", async ({ page }) => {
    await expect(
      page.getByText(MOCK_CONVERSATION.contact.channel_identifier!)
    ).toBeVisible({ timeout: 8000 });
  });

  test("clicking conversation opens message thread", async ({ page }) => {
    await page.getByText(MOCK_CONVERSATION.contact.channel_identifier!).click();
    // Scope to section (message thread area) to avoid matching the inbox preview
    await expect(
      page.locator("section").getByText("Hello there")
    ).toBeVisible({ timeout: 5000 });
  });

  test("sending a message appends it to the thread", async ({ page }) => {
    const replyText = "Thank you for reaching out!";
    await mockSendMessage(page, replyText);

    // Open conversation
    await page.getByText(MOCK_CONVERSATION.contact.channel_identifier!).click();

    // Fill message input and send
    const input = page.getByPlaceholder(/type a message/i);
    await input.fill(replyText);
    await input.press("Enter");

    // Match the message bubble <p> (not the textarea which also has the text)
    await expect(
      page.locator("p").filter({ hasText: replyText })
    ).toBeVisible({ timeout: 5000 });
  });
});
