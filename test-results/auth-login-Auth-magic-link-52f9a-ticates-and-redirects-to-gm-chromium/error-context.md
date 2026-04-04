# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-login.spec.ts >> Auth: magic link login >> valid GM code auto-authenticates and redirects to /gm
- Location: e2e/auth-login.spec.ts:37:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "**/gm" until "load"
  navigated to "http://localhost:3000/login/valid-user-code"
============================================================
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
  1  | import type { Page } from "@playwright/test";
  2  | 
  3  | /**
  4  |  * E2E test helpers.
  5  |  *
  6  |  * Auth strategy: the Next.js middleware checks for a `login_code` cookie.
  7  |  * We can't obtain a real cookie without a backend, so instead we set an
  8  |  * `e2e_auth_bypass` cookie which the middleware recognises and passes through.
  9  |  * MSW then intercepts GET /me and returns the desired user fixture.
  10 |  *
  11 |  * MSW code mapping (see src/mocks/handlers/auth.ts):
  12 |  *   "valid-user-code"   → GM user (role: gm)
  13 |  *   "valid-player-code" → Player Alice (role: player, character_id set)
  14 |  *   "valid-invite-code" → empty {} response → triggers join flow
  15 |  *   anything else       → 404 error
  16 |  */
  17 | 
  18 | /**
  19 |  * Set the e2e_auth_bypass cookie so middleware lets the request through.
  20 |  * MSW's GET /me handler returns gmUser by default; use `setMeAs*` overrides
  21 |  * in individual tests if you need a different persona.
  22 |  */
  23 | export async function bypassAuth(page: Page): Promise<void> {
  24 |   await page.context().addCookies([
  25 |     {
  26 |       name: "e2e_auth_bypass",
  27 |       value: "1",
  28 |       domain: "localhost",
  29 |       path: "/",
  30 |       httpOnly: false,
  31 |       secure: false,
  32 |       sameSite: "Lax",
  33 |     },
  34 |   ]);
  35 | }
  36 | 
  37 | /**
  38 |  * Wait for navigation to settle (networkidle can be flaky with polling).
  39 |  * Waits for the URL to match the expected path instead.
  40 |  */
  41 | export async function waitForPath(page: Page, path: string): Promise<void> {
> 42 |   await page.waitForURL(`**${path}`, { timeout: 15_000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  43 | }
  44 | 
```