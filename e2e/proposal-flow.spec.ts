import { test, expect } from "@playwright/test";
import { bypassAuth, waitForPath } from "./helpers";

/**
 * E2E tests for the proposal workflow critical path.
 *
 * All API calls are intercepted by MSW:
 *   GET  /me              → gmUser (default) or playerA depending on cookie override
 *   GET  /characters/:id  → character with skills, traits, bonds
 *   POST /proposals/calculate → { calculated_effect: { dice_pool: 4, … } }
 *   POST /proposals       → pending proposal (201)
 *   POST /proposals/:id/approve → approved proposal
 *
 * Auth bypass: the e2e_auth_bypass cookie lets the middleware through.
 * MSW's default GET /me returns gmUser (role: gm). For player-specific flows
 * we override the cookie to serve playerA.
 *
 * Note on MSW /me override: MSW handlers use the FIRST matching handler, so
 * to change the persona we use page.route() to intercept before MSW sees it.
 */

/**
 * Intercept GET /me at the Playwright network level to return a specific user.
 * This runs before MSW's service worker, giving us per-test persona control.
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

const PLAYER_A = {
  id: "01PL_A0000000000000000000",
  display_name: "Alice",
  role: "player",
  character_id: "01CH_A0000000000000000000",
  can_view_gm_content: false,
  can_take_gm_actions: false,
};

const GM_USER = {
  id: "01GM000000000000000000000",
  display_name: "The GM",
  role: "gm",
  character_id: null,
  can_view_gm_content: true,
  can_take_gm_actions: true,
};

test.describe("Proposal flow: player submits use_skill", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page);
    // Return playerA from /me so the player layout renders
    await mockMeAs(page, PLAYER_A);
  });

  test("navigates wizard steps and submits use_skill proposal, redirects to /proposals", async ({
    page,
  }) => {
    await page.goto("/proposals/new");

    // Step 1 heading
    await expect(
      page.getByRole("heading", { name: "Choose Action Type" })
    ).toBeVisible({ timeout: 10_000 });

    // Select "Use Skill" from the action type cards
    // The ActionTypeSelector renders cards with the action label as text
    await page.getByRole("button", { name: /Use Skill/i }).click();

    // Step 2 heading
    await expect(
      page.getByRole("heading", { name: "Fill in Details" })
    ).toBeVisible({ timeout: 5_000 });

    // Select the "Finesse" skill in the skill dropdown
    await page.getByLabel("Skill", { exact: false }).selectOption("finesse");

    // Proceed to review
    await page.getByRole("button", { name: /Next: Review/i }).click();

    // Step 3 heading
    await expect(
      page.getByRole("heading", { name: "Review & Submit" })
    ).toBeVisible({ timeout: 5_000 });

    // Submit the proposal
    await page.getByRole("button", { name: /Submit/i }).click();

    // After submission → redirect to /proposals list
    await waitForPath(page, "/proposals");
  });
});

test.describe("Proposal flow: GM approves from queue", () => {
  test.beforeEach(async ({ page }) => {
    await bypassAuth(page);
    // Return GM user from /me so the GM layout renders
    await mockMeAs(page, GM_USER);
  });

  test("pending proposal visible in queue, approve transitions to recent tab", async ({
    page,
  }) => {
    await page.goto("/gm");

    // Wait for the queue page to load
    await expect(
      page.getByRole("heading", { name: "Proposal Queue" })
    ).toBeVisible({ timeout: 10_000 });

    // Queue tab is active by default — pending proposal card should be visible.
    // MSW GET /proposals?status=pending returns one proposal with action_type "use_skill".
    // The GmProposalReviewCard renders an article with an aria-label containing the action type.
    await expect(
      page.getByRole("article").filter({ hasText: /use_skill/i }).first()
    ).toBeVisible({ timeout: 8_000 });

    // Click "Approve proposal" (quick-approve button) on the first proposal card.
    // ApproveForm renders a button with aria-label="Approve proposal".
    await page
      .getByRole("article")
      .filter({ hasText: /use_skill/i })
      .first()
      .getByRole("button", { name: "Approve proposal" })
      .click();

    // Success toast should appear
    await expect(
      page.getByText("Proposal approved.")
    ).toBeVisible({ timeout: 5_000 });

    // Switch to Recent tab and verify the proposal now appears there
    await page.getByRole("tab", { name: /Recent/i }).click();

    // Recent tab shows approved proposals (status badge "approved")
    await expect(
      page.getByText(/approved/i).first()
    ).toBeVisible({ timeout: 8_000 });
  });
});
