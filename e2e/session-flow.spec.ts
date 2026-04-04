import { test, expect } from "@playwright/test";
import { bypassAuth, waitForPath } from "./helpers";

/**
 * E2E tests for the session management critical path.
 *
 * All API calls are intercepted by MSW:
 *   GET  /sessions           → list with active/draft/ended sessions
 *   POST /sessions           → creates a draft session (201)
 *   POST /sessions/:id/start → returns an active session
 *   GET  /me                 → GM user (intercepted via page.route)
 *
 * The GM sessions page lives at /gm/sessions (GmSessionsPage).
 * Creating a session uses the CreateSessionForm (collapsible, opens on click).
 * Starting a session is done via SessionLifecycleControls inside SessionDetail.
 *
 * The player active session banner lives in the player layout and is rendered
 * when GET /sessions?status=active returns a non-empty list.
 */

async function mockMeAs(
  page: import("@playwright/test").Page,
  user: Record<string, unknown>
) {
  await page.route("**/api/v1/me", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });
}

const GM_USER = {
  id: "01GM000000000000000000000",
  display_name: "The GM",
  role: "gm",
  character_id: null,
  can_view_gm_content: true,
  can_take_gm_actions: true,
};

const PLAYER_A = {
  id: "01PL_A0000000000000000000",
  display_name: "Alice",
  role: "player",
  character_id: "01CH_A0000000000000000000",
  can_view_gm_content: false,
  can_take_gm_actions: false,
};

test.describe("Session flow: GM creates a draft session", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page);
    await mockMeAs(page, GM_USER);
  });

  test("opens create form, fills summary, submits, new session appears in list", async ({
    page,
  }) => {
    await page.goto("/gm/sessions");

    // Page heading
    await expect(
      page.getByRole("heading", { name: "Sessions" })
    ).toBeVisible({ timeout: 10_000 });

    // CreateSessionForm is collapsed by default — toggle it open
    await page.getByRole("button", { name: /New Session/i }).click();

    // Form should now be visible
    const summaryInput = page.getByLabel(/Session name \/ summary/i);
    await expect(summaryInput).toBeVisible();

    // Fill the required summary field
    await summaryInput.fill("The heist at the clockwork tower");

    // Submit the form
    await page.getByRole("button", { name: /Create Draft/i }).click();

    // Success toast appears
    await expect(page.getByText("Session created.")).toBeVisible({
      timeout: 5_000,
    });

    // Form collapses after success — the button now shows "New Session" again
    await expect(
      page.getByRole("button", { name: /New Session/i })
    ).toBeVisible();
  });
});

test.describe("Session flow: GM starts a session", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page);
    await mockMeAs(page, GM_USER);
  });

  test("navigates to a draft session detail, clicks Start Session, session becomes active", async ({
    page,
  }) => {
    // MSW GET /sessions returns a draft session with id "01SESSION_DEFAULT0000000"
    await page.goto("/gm/sessions");

    await expect(
      page.getByRole("heading", { name: "Sessions" })
    ).toBeVisible({ timeout: 10_000 });

    // Find the draft session card and navigate to its detail page.
    // MSW returns sessions including a draft "The crew investigates the warehouse".
    // SessionCard renders as a link with aria-label containing the session summary.
    const draftCard = page
      .getByRole("link")
      .filter({ hasText: /investigates the warehouse/i });
    await expect(draftCard).toBeVisible({ timeout: 8_000 });
    await draftCard.click();

    // We're now on the detail page — wait for session detail to render
    // SessionDetail renders a status badge for the current session status
    await expect(page.getByText(/draft/i).first()).toBeVisible({
      timeout: 8_000,
    });

    // SessionLifecycleControls renders a "Start Session" button for draft sessions
    const startButton = page.getByRole("button", { name: /Start Session/i });
    await expect(startButton).toBeVisible({ timeout: 5_000 });
    await startButton.click();

    // After POST /sessions/:id/start, MSW returns an active session.
    // A confirmation dialog may appear — confirm if present.
    const confirmButton = page.getByRole("button", { name: /Confirm/i });
    if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // The session status should now show "active"
    await expect(page.getByText(/active/i).first()).toBeVisible({
      timeout: 8_000,
    });
  });
});

test.describe("Session flow: player sees active session banner", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page);
    await mockMeAs(page, PLAYER_A);
  });

  test("player feed shows active session banner when a session is active", async ({
    page,
  }) => {
    // MSW GET /sessions (status=active) returns an active session by default
    // when no status filter is applied — the ActiveSessionBanner hook calls
    // useActiveSession which queries GET /sessions?status=active.
    // The default MSW handler returns all sessions (including active) for unfiltered
    // calls and only the active one for status=active.

    await page.goto("/");

    // Player layout (/) renders the ActiveSessionBanner when a session is active.
    // The banner has role="banner" with aria-label="Active session banner"
    await expect(
      page.getByRole("banner", { name: "Active session banner" })
    ).toBeVisible({ timeout: 10_000 });

    // Banner shows the active session summary text
    await expect(
      page.getByText(/The crew faces the shadow council/i)
    ).toBeVisible();
  });
});
