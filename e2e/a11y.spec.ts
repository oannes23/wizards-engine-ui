import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { bypassAuth } from "./helpers";

/**
 * Accessibility audit tests using axe-core.
 *
 * Strategy: best-effort for MVP. We run axe on critical pages and report
 * violations without failing the suite on every violation — the goal is to
 * surface issues, not block CI on pre-existing problems.
 *
 * Pages audited:
 *   - /login          — unauthenticated, no cookie needed
 *   - / (player feed) — requires auth bypass + player persona
 *   - /character      — requires auth bypass + player persona
 *   - /gm             — requires auth bypass + GM persona
 *
 * Rules: wcag2a, wcag2aa (standard compliance baseline).
 *
 * Violations are printed to the test output. Critical violations
 * (impact: "critical" or "serious") cause the test to fail; moderate/minor
 * are reported as warnings.
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

// ── Helper: run axe and return results ─────────────────────────────

async function runAxe(page: import("@playwright/test").Page) {
  return new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "best-practice"])
    .analyze();
}

function formatViolation(v: { id: string; impact: string | null; description: string; nodes: unknown[] }): string {
  return `[${v.impact ?? "unknown"}] ${v.id}: ${v.description} (${(v.nodes as unknown[]).length} node(s))`;
}

// ── Tests ──────────────────────────────────────────────────────────

test.describe("Accessibility: critical pages", () => {
  test("login page (/login) has no critical violations", async ({ page }) => {
    await page.goto("/login");

    // Wait for the page to settle
    await expect(
      page.getByRole("heading", { name: "Sign In" })
    ).toBeVisible({ timeout: 10_000 });

    const results = await runAxe(page);

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    const moderate = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor"
    );

    if (moderate.length > 0) {
      console.log(
        `[a11y /login] ${moderate.length} moderate/minor violation(s):\n` +
          moderate.map(formatViolation).join("\n")
      );
    }

    // Fail only on critical/serious violations
    expect(
      critical,
      `Critical a11y violations on /login:\n${critical.map(formatViolation).join("\n")}`
    ).toHaveLength(0);
  });

  test("player feed (/) has no critical violations", async ({ page }) => {
    await bypassAuth(page);
    await mockMeAs(page, PLAYER_A);
    await page.goto("/");

    // Wait for feed tab list — confirms player layout + content loaded
    await expect(
      page.getByRole("tablist", { name: "Feed filters" })
    ).toBeVisible({ timeout: 10_000 });

    const results = await runAxe(page);

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    const moderate = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor"
    );

    if (moderate.length > 0) {
      console.log(
        `[a11y /] ${moderate.length} moderate/minor violation(s):\n` +
          moderate.map(formatViolation).join("\n")
      );
    }

    expect(
      critical,
      `Critical a11y violations on /:\n${critical.map(formatViolation).join("\n")}`
    ).toHaveLength(0);
  });

  test("character sheet (/character) has no critical violations", async ({
    page,
  }) => {
    await bypassAuth(page);
    await mockMeAs(page, PLAYER_A);
    await page.goto("/character");

    // Wait for the character sheet to render — heading or meter section
    await page.waitForLoadState("networkidle", { timeout: 10_000 });

    const results = await runAxe(page);

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    const moderate = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor"
    );

    if (moderate.length > 0) {
      console.log(
        `[a11y /character] ${moderate.length} moderate/minor violation(s):\n` +
          moderate.map(formatViolation).join("\n")
      );
    }

    expect(
      critical,
      `Critical a11y violations on /character:\n${critical.map(formatViolation).join("\n")}`
    ).toHaveLength(0);
  });

  test("GM queue (/gm) has no critical violations", async ({ page }) => {
    await bypassAuth(page);
    await mockMeAs(page, GM_USER);
    await page.goto("/gm");

    // Wait for the GM queue heading
    await expect(
      page.getByRole("heading", { name: "Proposal Queue" })
    ).toBeVisible({ timeout: 10_000 });

    const results = await runAxe(page);

    const critical = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious"
    );
    const moderate = results.violations.filter(
      (v) => v.impact === "moderate" || v.impact === "minor"
    );

    if (moderate.length > 0) {
      console.log(
        `[a11y /gm] ${moderate.length} moderate/minor violation(s):\n` +
          moderate.map(formatViolation).join("\n")
      );
    }

    expect(
      critical,
      `Critical a11y violations on /gm:\n${critical.map(formatViolation).join("\n")}`
    ).toHaveLength(0);
  });
});
