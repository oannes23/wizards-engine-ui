import type { Page } from "@playwright/test";

/**
 * E2E test helpers.
 *
 * Auth strategy: the Next.js middleware checks for a `login_code` cookie.
 * We can't obtain a real cookie without a backend, so instead we set an
 * `e2e_auth_bypass` cookie which the middleware recognises and passes through.
 * MSW then intercepts GET /me and returns the desired user fixture.
 *
 * MSW code mapping (see src/mocks/handlers/auth.ts):
 *   "valid-user-code"   → GM user (role: gm)
 *   "valid-player-code" → Player Alice (role: player, character_id set)
 *   "valid-invite-code" → empty {} response → triggers join flow
 *   anything else       → 404 error
 */

/**
 * Set the e2e_auth_bypass cookie so middleware lets the request through.
 * MSW's GET /me handler returns gmUser by default; use `setMeAs*` overrides
 * in individual tests if you need a different persona.
 */
export async function bypassAuth(page: Page): Promise<void> {
  await page.context().addCookies([
    {
      name: "e2e_auth_bypass",
      value: "1",
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

/**
 * Wait for navigation to settle (networkidle can be flaky with polling).
 * Waits for the URL to match the expected path instead.
 */
export async function waitForPath(page: Page, path: string): Promise<void> {
  await page.waitForURL(`**${path}`, { timeout: 15_000 });
}
