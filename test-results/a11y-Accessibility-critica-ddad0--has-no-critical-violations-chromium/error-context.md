# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> Accessibility: critical pages >> player feed (/) has no critical violations
- Location: e2e/a11y.spec.ts:102:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('tablist', { name: 'Feed filters' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('tablist', { name: 'Feed filters' })

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
  10  |  * surface issues, not block CI on pre-existing problems.
  11  |  *
  12  |  * Pages audited:
  13  |  *   - /login          — unauthenticated, no cookie needed
  14  |  *   - / (player feed) — requires auth bypass + player persona
  15  |  *   - /character      — requires auth bypass + player persona
  16  |  *   - /gm             — requires auth bypass + GM persona
  17  |  *
  18  |  * Rules: wcag2a, wcag2aa (standard compliance baseline).
  19  |  *
  20  |  * Violations are printed to the test output. Critical violations
  21  |  * (impact: "critical" or "serious") cause the test to fail; moderate/minor
  22  |  * are reported as warnings.
  23  |  */
  24  | 
  25  | async function mockMeAs(
  26  |   page: import("@playwright/test").Page,
  27  |   user: Record<string, unknown>
  28  | ) {
  29  |   await page.route("**/api/v1/me", (route) => {
  30  |     route.fulfill({
  31  |       status: 200,
  32  |       contentType: "application/json",
  33  |       body: JSON.stringify(user),
  34  |     });
  35  |   });
  36  | }
  37  | 
  38  | const PLAYER_A = {
  39  |   id: "01PL_A0000000000000000000",
  40  |   display_name: "Alice",
  41  |   role: "player",
  42  |   character_id: "01CH_A0000000000000000000",
  43  |   can_view_gm_content: false,
  44  |   can_take_gm_actions: false,
  45  | };
  46  | 
  47  | const GM_USER = {
  48  |   id: "01GM000000000000000000000",
  49  |   display_name: "The GM",
  50  |   role: "gm",
  51  |   character_id: null,
  52  |   can_view_gm_content: true,
  53  |   can_take_gm_actions: true,
  54  | };
  55  | 
  56  | // ── Helper: run axe and return results ─────────────────────────────
  57  | 
  58  | async function runAxe(page: import("@playwright/test").Page) {
  59  |   return new AxeBuilder({ page })
  60  |     .withTags(["wcag2a", "wcag2aa", "best-practice"])
  61  |     .analyze();
  62  | }
  63  | 
  64  | function formatViolation(v: { id: string; impact: string | null; description: string; nodes: unknown[] }): string {
  65  |   return `[${v.impact ?? "unknown"}] ${v.id}: ${v.description} (${(v.nodes as unknown[]).length} node(s))`;
  66  | }
  67  | 
  68  | // ── Tests ──────────────────────────────────────────────────────────
  69  | 
  70  | test.describe("Accessibility: critical pages", () => {
  71  |   test("login page (/login) has no critical violations", async ({ page }) => {
  72  |     await page.goto("/login");
  73  | 
  74  |     // Wait for the page to settle
  75  |     await expect(
  76  |       page.getByRole("heading", { name: "Sign In" })
  77  |     ).toBeVisible({ timeout: 10_000 });
  78  | 
  79  |     const results = await runAxe(page);
  80  | 
  81  |     const critical = results.violations.filter(
  82  |       (v) => v.impact === "critical" || v.impact === "serious"
  83  |     );
  84  |     const moderate = results.violations.filter(
  85  |       (v) => v.impact === "moderate" || v.impact === "minor"
  86  |     );
  87  | 
  88  |     if (moderate.length > 0) {
  89  |       console.log(
  90  |         `[a11y /login] ${moderate.length} moderate/minor violation(s):\n` +
  91  |           moderate.map(formatViolation).join("\n")
  92  |       );
  93  |     }
  94  | 
  95  |     // Fail only on critical/serious violations
  96  |     expect(
  97  |       critical,
  98  |       `Critical a11y violations on /login:\n${critical.map(formatViolation).join("\n")}`
  99  |     ).toHaveLength(0);
  100 |   });
  101 | 
  102 |   test("player feed (/) has no critical violations", async ({ page }) => {
  103 |     await bypassAuth(page);
  104 |     await mockMeAs(page, PLAYER_A);
  105 |     await page.goto("/");
  106 | 
  107 |     // Wait for feed tab list — confirms player layout + content loaded
  108 |     await expect(
  109 |       page.getByRole("tablist", { name: "Feed filters" })
> 110 |     ).toBeVisible({ timeout: 10_000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  111 | 
  112 |     const results = await runAxe(page);
  113 | 
  114 |     const critical = results.violations.filter(
  115 |       (v) => v.impact === "critical" || v.impact === "serious"
  116 |     );
  117 |     const moderate = results.violations.filter(
  118 |       (v) => v.impact === "moderate" || v.impact === "minor"
  119 |     );
  120 | 
  121 |     if (moderate.length > 0) {
  122 |       console.log(
  123 |         `[a11y /] ${moderate.length} moderate/minor violation(s):\n` +
  124 |           moderate.map(formatViolation).join("\n")
  125 |       );
  126 |     }
  127 | 
  128 |     expect(
  129 |       critical,
  130 |       `Critical a11y violations on /:\n${critical.map(formatViolation).join("\n")}`
  131 |     ).toHaveLength(0);
  132 |   });
  133 | 
  134 |   test("character sheet (/character) has no critical violations", async ({
  135 |     page,
  136 |   }) => {
  137 |     await bypassAuth(page);
  138 |     await mockMeAs(page, PLAYER_A);
  139 |     await page.goto("/character");
  140 | 
  141 |     // Wait for the character sheet to render — heading or meter section
  142 |     await page.waitForLoadState("networkidle", { timeout: 10_000 });
  143 | 
  144 |     const results = await runAxe(page);
  145 | 
  146 |     const critical = results.violations.filter(
  147 |       (v) => v.impact === "critical" || v.impact === "serious"
  148 |     );
  149 |     const moderate = results.violations.filter(
  150 |       (v) => v.impact === "moderate" || v.impact === "minor"
  151 |     );
  152 | 
  153 |     if (moderate.length > 0) {
  154 |       console.log(
  155 |         `[a11y /character] ${moderate.length} moderate/minor violation(s):\n` +
  156 |           moderate.map(formatViolation).join("\n")
  157 |       );
  158 |     }
  159 | 
  160 |     expect(
  161 |       critical,
  162 |       `Critical a11y violations on /character:\n${critical.map(formatViolation).join("\n")}`
  163 |     ).toHaveLength(0);
  164 |   });
  165 | 
  166 |   test("GM queue (/gm) has no critical violations", async ({ page }) => {
  167 |     await bypassAuth(page);
  168 |     await mockMeAs(page, GM_USER);
  169 |     await page.goto("/gm");
  170 | 
  171 |     // Wait for the GM queue heading
  172 |     await expect(
  173 |       page.getByRole("heading", { name: "Proposal Queue" })
  174 |     ).toBeVisible({ timeout: 10_000 });
  175 | 
  176 |     const results = await runAxe(page);
  177 | 
  178 |     const critical = results.violations.filter(
  179 |       (v) => v.impact === "critical" || v.impact === "serious"
  180 |     );
  181 |     const moderate = results.violations.filter(
  182 |       (v) => v.impact === "moderate" || v.impact === "minor"
  183 |     );
  184 | 
  185 |     if (moderate.length > 0) {
  186 |       console.log(
  187 |         `[a11y /gm] ${moderate.length} moderate/minor violation(s):\n` +
  188 |           moderate.map(formatViolation).join("\n")
  189 |       );
  190 |     }
  191 | 
  192 |     expect(
  193 |       critical,
  194 |       `Critical a11y violations on /gm:\n${critical.map(formatViolation).join("\n")}`
  195 |     ).toHaveLength(0);
  196 |   });
  197 | });
  198 | 
```