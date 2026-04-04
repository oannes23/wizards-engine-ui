# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-login.spec.ts >> Auth: magic link login >> unknown code shows error state with retry link
- Location: e2e/auth-login.spec.ts:92:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Sign-in failed' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Sign-in failed' })

```

# Page snapshot

```yaml
- generic:
  - generic [active]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - navigation [ref=e6]:
            - button "previous" [disabled] [ref=e7]:
              - img "previous" [ref=e8]
            - generic [ref=e10]:
              - generic [ref=e11]: 1/
              - text: "1"
            - button "next" [disabled] [ref=e12]:
              - img "next" [ref=e13]
          - img
        - generic [ref=e15]:
          - generic [ref=e16]:
            - img [ref=e17]
            - generic "Latest available version is detected (16.2.2)." [ref=e19]: Next.js 16.2.2
            - generic [ref=e20]: Turbopack
          - img
      - dialog "Build Error" [ref=e22]:
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]:
              - generic [ref=e29]: Build Error
              - generic [ref=e30]:
                - button "Copy Error Info" [ref=e31] [cursor=pointer]:
                  - img [ref=e32]
                - button "No related documentation found" [disabled] [ref=e34]:
                  - img [ref=e35]
                - button "Attach Node.js inspector" [ref=e37] [cursor=pointer]:
                  - img [ref=e38]
            - generic [ref=e47]: You cannot have two parallel pages that resolve to the same path. Please check /(gm)/character and /(player).
          - generic [ref=e49]:
            - generic [ref=e51]:
              - img [ref=e53]
              - generic [ref=e55]: ./src/app/(player)
              - button "Open in editor" [ref=e56] [cursor=pointer]:
                - img [ref=e58]
            - generic [ref=e62]: You cannot have two parallel pages that resolve to the same path. Please check /(gm)/character and /(player).
        - generic [ref=e63]: "1"
        - generic [ref=e64]: "2"
    - generic [ref=e69] [cursor=pointer]:
      - button "Open Next.js Dev Tools" [ref=e70]:
        - img [ref=e71]
      - button "Open issues overlay" [ref=e75]:
        - generic [ref=e76]:
          - generic [ref=e77]: "0"
          - generic [ref=e78]: "1"
        - generic [ref=e79]: Issue
  - alert [ref=e80]
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | import { waitForPath } from "./helpers";
  3   | 
  4   | /**
  5   |  * E2E tests for the authentication / login critical path.
  6   |  *
  7   |  * All API calls are intercepted by MSW (NEXT_PUBLIC_MSW=true).
  8   |  * MSW handler codes (src/mocks/handlers/auth.ts):
  9   |  *   "valid-user-code"   → GM user response (role: gm)
  10  |  *   "valid-player-code" → Player Alice response (role: player)
  11  |  *   "valid-invite-code" → {} (empty body) → triggers join flow
  12  |  *   anything else       → 404 → error state
  13  |  *
  14  |  * These tests visit the magic-link URL directly (/login/<code>) and verify
  15  |  * the resulting redirect or error state.
  16  |  *
  17  |  * No auth cookie is needed for /login/* routes — the middleware explicitly
  18  |  * exempts PUBLIC_PATHS starting with "/login".
  19  |  */
  20  | 
  21  | test.describe("Auth: magic link login", () => {
  22  |   test("valid player code auto-authenticates and redirects to player feed", async ({
  23  |     page,
  24  |   }) => {
  25  |     // The /login/[code] page calls POST /auth/login automatically on mount
  26  |     await page.goto("/login/valid-player-code");
  27  | 
  28  |     // Should redirect to player home (/)
  29  |     await waitForPath(page, "/");
  30  | 
  31  |     // Player feed is rendered — wait for the tab bar to confirm we're on the feed
  32  |     await expect(
  33  |       page.getByRole("tablist", { name: "Feed filters" })
  34  |     ).toBeVisible({ timeout: 10_000 });
  35  |   });
  36  | 
  37  |   test("valid GM code auto-authenticates and redirects to /gm", async ({
  38  |     page,
  39  |   }) => {
  40  |     await page.goto("/login/valid-user-code");
  41  | 
  42  |     // Should redirect to GM queue
  43  |     await waitForPath(page, "/gm");
  44  | 
  45  |     // GM queue page heading confirms we're on the right page
  46  |     await expect(
  47  |       page.getByRole("heading", { name: "Proposal Queue" })
  48  |     ).toBeVisible({ timeout: 10_000 });
  49  |   });
  50  | 
  51  |   test("invite code redirects to /join with code in query string", async ({
  52  |     page,
  53  |   }) => {
  54  |     await page.goto("/login/valid-invite-code");
  55  | 
  56  |     // Should redirect to join page with the code preserved
  57  |     await waitForPath(page, "/join");
  58  | 
  59  |     const url = new URL(page.url());
  60  |     expect(url.searchParams.get("code")).toBe("valid-invite-code");
  61  | 
  62  |     // Join page renders its heading
  63  |     await expect(
  64  |       page.getByRole("heading", { name: "Join the Game" })
  65  |     ).toBeVisible();
  66  |   });
  67  | 
  68  |   test("invite code join form: fill display name and character name, submit, redirects to feed", async ({
  69  |     page,
  70  |   }) => {
  71  |     // Start at join page directly with a valid invite code in the query string.
  72  |     // MSW POST /game/join returns a player user for any non-error code.
  73  |     await page.goto("/join?code=valid-invite-code");
  74  | 
  75  |     await expect(
  76  |       page.getByRole("heading", { name: "Join the Game" })
  77  |     ).toBeVisible();
  78  | 
  79  |     // Fill display name
  80  |     await page.getByLabel("Your name").fill("Alice Test");
  81  | 
  82  |     // Fill character name
  83  |     await page.getByLabel(/Character name/i).fill("Seraphina");
  84  | 
  85  |     // Submit
  86  |     await page.getByRole("button", { name: "Join game" }).click();
  87  | 
  88  |     // On success → redirects to player feed
  89  |     await waitForPath(page, "/");
  90  |   });
  91  | 
  92  |   test("unknown code shows error state with retry link", async ({ page }) => {
  93  |     await page.goto("/login/unknown-code-that-does-not-exist");
  94  | 
  95  |     // Error state is rendered — no redirect
  96  |     await expect(
  97  |       page.getByRole("heading", { name: "Sign-in failed" })
> 98  |     ).toBeVisible({ timeout: 10_000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  99  | 
  100 |     // Error message is shown
  101 |     await expect(
  102 |       page.getByText("This link is invalid or has expired.")
  103 |     ).toBeVisible();
  104 | 
  105 |     // A link to enter the code manually is available
  106 |     await expect(
  107 |       page.getByRole("link", { name: "Enter code manually" })
  108 |     ).toBeVisible();
  109 |   });
  110 | });
  111 | 
```