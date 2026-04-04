# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: session-flow.spec.ts >> Session flow: player sees active session banner >> player feed shows active session banner when a session is active
- Location: e2e/session-flow.spec.ts:149:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('banner', { name: 'Active session banner' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('banner', { name: 'Active session banner' })

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
  64  |     await expect(
  65  |       page.getByRole("heading", { name: "Sessions" })
  66  |     ).toBeVisible({ timeout: 10_000 });
  67  | 
  68  |     // CreateSessionForm is collapsed by default — toggle it open
  69  |     await page.getByRole("button", { name: /New Session/i }).click();
  70  | 
  71  |     // Form should now be visible
  72  |     const summaryInput = page.getByLabel(/Session name \/ summary/i);
  73  |     await expect(summaryInput).toBeVisible();
  74  | 
  75  |     // Fill the required summary field
  76  |     await summaryInput.fill("The heist at the clockwork tower");
  77  | 
  78  |     // Submit the form
  79  |     await page.getByRole("button", { name: /Create Draft/i }).click();
  80  | 
  81  |     // Success toast appears
  82  |     await expect(page.getByText("Session created.")).toBeVisible({
  83  |       timeout: 5_000,
  84  |     });
  85  | 
  86  |     // Form collapses after success — the button now shows "New Session" again
  87  |     await expect(
  88  |       page.getByRole("button", { name: /New Session/i })
  89  |     ).toBeVisible();
  90  |   });
  91  | });
  92  | 
  93  | test.describe("Session flow: GM starts a session", () => {
  94  |   test.beforeEach(async ({ page }) => {
  95  |     await bypassAuth(page);
  96  |     await mockMeAs(page, GM_USER);
  97  |   });
  98  | 
  99  |   test("navigates to a draft session detail, clicks Start Session, session becomes active", async ({
  100 |     page,
  101 |   }) => {
  102 |     // MSW GET /sessions returns a draft session with id "01SESSION_DEFAULT0000000"
  103 |     await page.goto("/gm/sessions");
  104 | 
  105 |     await expect(
  106 |       page.getByRole("heading", { name: "Sessions" })
  107 |     ).toBeVisible({ timeout: 10_000 });
  108 | 
  109 |     // Find the draft session card and navigate to its detail page.
  110 |     // MSW returns sessions including a draft "The crew investigates the warehouse".
  111 |     // SessionCard renders as a link with aria-label containing the session summary.
  112 |     const draftCard = page
  113 |       .getByRole("link")
  114 |       .filter({ hasText: /investigates the warehouse/i });
  115 |     await expect(draftCard).toBeVisible({ timeout: 8_000 });
  116 |     await draftCard.click();
  117 | 
  118 |     // We're now on the detail page — wait for session detail to render
  119 |     // SessionDetail renders a status badge for the current session status
  120 |     await expect(page.getByText(/draft/i).first()).toBeVisible({
  121 |       timeout: 8_000,
  122 |     });
  123 | 
  124 |     // SessionLifecycleControls renders a "Start Session" button for draft sessions
  125 |     const startButton = page.getByRole("button", { name: /Start Session/i });
  126 |     await expect(startButton).toBeVisible({ timeout: 5_000 });
  127 |     await startButton.click();
  128 | 
  129 |     // After POST /sessions/:id/start, MSW returns an active session.
  130 |     // A confirmation dialog may appear — confirm if present.
  131 |     const confirmButton = page.getByRole("button", { name: /Confirm/i });
  132 |     if (await confirmButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
  133 |       await confirmButton.click();
  134 |     }
  135 | 
  136 |     // The session status should now show "active"
  137 |     await expect(page.getByText(/active/i).first()).toBeVisible({
  138 |       timeout: 8_000,
  139 |     });
  140 |   });
  141 | });
  142 | 
  143 | test.describe("Session flow: player sees active session banner", () => {
  144 |   test.beforeEach(async ({ page }) => {
  145 |     await bypassAuth(page);
  146 |     await mockMeAs(page, PLAYER_A);
  147 |   });
  148 | 
  149 |   test("player feed shows active session banner when a session is active", async ({
  150 |     page,
  151 |   }) => {
  152 |     // MSW GET /sessions (status=active) returns an active session by default
  153 |     // when no status filter is applied — the ActiveSessionBanner hook calls
  154 |     // useActiveSession which queries GET /sessions?status=active.
  155 |     // The default MSW handler returns all sessions (including active) for unfiltered
  156 |     // calls and only the active one for status=active.
  157 | 
  158 |     await page.goto("/");
  159 | 
  160 |     // Player layout (/) renders the ActiveSessionBanner when a session is active.
  161 |     // The banner has role="banner" with aria-label="Active session banner"
  162 |     await expect(
  163 |       page.getByRole("banner", { name: "Active session banner" })
> 164 |     ).toBeVisible({ timeout: 10_000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  165 | 
  166 |     // Banner shows the active session summary text
  167 |     await expect(
  168 |       page.getByText(/The crew faces the shadow council/i)
  169 |     ).toBeVisible();
  170 |   });
  171 | });
  172 | 
```