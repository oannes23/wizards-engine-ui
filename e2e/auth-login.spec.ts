import { test, expect } from "@playwright/test";
import { waitForPath } from "./helpers";

/**
 * E2E tests for the authentication / login critical path.
 *
 * All API calls are intercepted by MSW (NEXT_PUBLIC_MSW=true).
 * MSW handler codes (src/mocks/handlers/auth.ts):
 *   "valid-user-code"   → GM user response (role: gm)
 *   "valid-player-code" → Player Alice response (role: player)
 *   "valid-invite-code" → {} (empty body) → triggers join flow
 *   anything else       → 404 → error state
 *
 * These tests visit the magic-link URL directly (/login/<code>) and verify
 * the resulting redirect or error state.
 *
 * No auth cookie is needed for /login/* routes — the middleware explicitly
 * exempts PUBLIC_PATHS starting with "/login".
 */

test.describe("Auth: magic link login", () => {
  test("valid player code auto-authenticates and redirects to player feed", async ({
    page,
  }) => {
    // The /login/[code] page calls POST /auth/login automatically on mount
    await page.goto("/login/valid-player-code");

    // Should redirect to player home (/)
    await waitForPath(page, "/");

    // Player feed is rendered — wait for the tab bar to confirm we're on the feed
    await expect(
      page.getByRole("tablist", { name: "Feed filters" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("valid GM code auto-authenticates and redirects to /gm", async ({
    page,
  }) => {
    await page.goto("/login/valid-user-code");

    // Should redirect to GM queue
    await waitForPath(page, "/gm");

    // GM queue page heading confirms we're on the right page
    await expect(
      page.getByRole("heading", { name: "Proposal Queue" })
    ).toBeVisible({ timeout: 10_000 });
  });

  test("invite code redirects to /join with code in query string", async ({
    page,
  }) => {
    await page.goto("/login/valid-invite-code");

    // Should redirect to join page with the code preserved
    await waitForPath(page, "/join");

    const url = new URL(page.url());
    expect(url.searchParams.get("code")).toBe("valid-invite-code");

    // Join page renders its heading
    await expect(
      page.getByRole("heading", { name: "Join the Game" })
    ).toBeVisible();
  });

  test("invite code join form: fill display name and character name, submit, redirects to feed", async ({
    page,
  }) => {
    // Start at join page directly with a valid invite code in the query string.
    // MSW POST /game/join returns a player user for any non-error code.
    await page.goto("/join?code=valid-invite-code");

    await expect(
      page.getByRole("heading", { name: "Join the Game" })
    ).toBeVisible();

    // Fill display name
    await page.getByLabel("Your name").fill("Alice Test");

    // Fill character name
    await page.getByLabel(/Character name/i).fill("Seraphina");

    // Submit
    await page.getByRole("button", { name: "Join game" }).click();

    // On success → redirects to player feed
    await waitForPath(page, "/");
  });

  test("unknown code shows error state with retry link", async ({ page }) => {
    await page.goto("/login/unknown-code-that-does-not-exist");

    // Error state is rendered — no redirect
    await expect(
      page.getByRole("heading", { name: "Sign-in failed" })
    ).toBeVisible({ timeout: 10_000 });

    // Error message is shown
    await expect(
      page.getByText("This link is invalid or has expired.")
    ).toBeVisible();

    // A link to enter the code manually is available
    await expect(
      page.getByRole("link", { name: "Enter code manually" })
    ).toBeVisible();
  });
});
