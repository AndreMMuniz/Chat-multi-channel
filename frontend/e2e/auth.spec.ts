import { test, expect } from "@playwright/test";
import { mockLogin, mockApiCatchAll, MOCK_CREDENTIALS } from "./fixtures";

test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Catch-all prevents console errors from unmocked API calls
    await mockApiCatchAll(page);
  });

  test("valid credentials redirect to /dashboard", async ({ page }) => {
    await mockLogin(page);
    await page.goto("/login");

    await page.locator('input[type="email"]').fill(MOCK_CREDENTIALS.email);
    await page.locator('input[type="password"]').fill(MOCK_CREDENTIALS.password);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 8000 });
  });

  test("invalid credentials show error message", async ({ page }) => {
    await page.route("**/api/v1/auth/login", (route) => {
      route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Invalid email or password" }),
      });
    });

    await page.goto("/login");
    await page.locator('input[type="email"]').fill("wrong@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.locator(".text-red-500")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to inbox redirects to login", async ({ page }) => {
    // No auth seeded — ClientLayout should redirect to /login
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
