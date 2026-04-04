# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: proposal-flow.spec.ts >> Proposal flow: GM approves from queue >> pending proposal visible in queue, approve transitions to recent tab
- Location: e2e/proposal-flow.spec.ts:109:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Proposal Queue' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: 'Proposal Queue' })

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
  17  |  *
  18  |  * Note on MSW /me override: MSW handlers use the FIRST matching handler, so
  19  |  * to change the persona we use page.route() to intercept before MSW sees it.
  20  |  */
  21  | 
  22  | /**
  23  |  * Intercept GET /me at the Playwright network level to return a specific user.
  24  |  * This runs before MSW's service worker, giving us per-test persona control.
  25  |  */
  26  | async function mockMeAs(
  27  |   page: import("@playwright/test").Page,
  28  |   user: Record<string, unknown>
  29  | ) {
  30  |   await page.route("**/api/v1/me", (route) => {
  31  |     route.fulfill({
  32  |       status: 200,
  33  |       contentType: "application/json",
  34  |       body: JSON.stringify(user),
  35  |     });
  36  |   });
  37  | }
  38  | 
  39  | const PLAYER_A = {
  40  |   id: "01PL_A0000000000000000000",
  41  |   display_name: "Alice",
  42  |   role: "player",
  43  |   character_id: "01CH_A0000000000000000000",
  44  |   can_view_gm_content: false,
  45  |   can_take_gm_actions: false,
  46  | };
  47  | 
  48  | const GM_USER = {
  49  |   id: "01GM000000000000000000000",
  50  |   display_name: "The GM",
  51  |   role: "gm",
  52  |   character_id: null,
  53  |   can_view_gm_content: true,
  54  |   can_take_gm_actions: true,
  55  | };
  56  | 
  57  | test.describe("Proposal flow: player submits use_skill", () => {
  58  |   test.beforeEach(async ({ page }) => {
  59  |     await bypassAuth(page);
  60  |     // Return playerA from /me so the player layout renders
  61  |     await mockMeAs(page, PLAYER_A);
  62  |   });
  63  | 
  64  |   test("navigates wizard steps and submits use_skill proposal, redirects to /proposals", async ({
  65  |     page,
  66  |   }) => {
  67  |     await page.goto("/proposals/new");
  68  | 
  69  |     // Step 1 heading
  70  |     await expect(
  71  |       page.getByRole("heading", { name: "Choose Action Type" })
  72  |     ).toBeVisible({ timeout: 10_000 });
  73  | 
  74  |     // Select "Use Skill" from the action type cards
  75  |     // The ActionTypeSelector renders cards with the action label as text
  76  |     await page.getByRole("button", { name: /Use Skill/i }).click();
  77  | 
  78  |     // Step 2 heading
  79  |     await expect(
  80  |       page.getByRole("heading", { name: "Fill in Details" })
  81  |     ).toBeVisible({ timeout: 5_000 });
  82  | 
  83  |     // Select the "Finesse" skill in the skill dropdown
  84  |     await page.getByLabel("Skill", { exact: false }).selectOption("finesse");
  85  | 
  86  |     // Proceed to review
  87  |     await page.getByRole("button", { name: /Next: Review/i }).click();
  88  | 
  89  |     // Step 3 heading
  90  |     await expect(
  91  |       page.getByRole("heading", { name: "Review & Submit" })
  92  |     ).toBeVisible({ timeout: 5_000 });
  93  | 
  94  |     // Submit the proposal
  95  |     await page.getByRole("button", { name: /Submit/i }).click();
  96  | 
  97  |     // After submission → redirect to /proposals list
  98  |     await waitForPath(page, "/proposals");
  99  |   });
  100 | });
  101 | 
  102 | test.describe("Proposal flow: GM approves from queue", () => {
  103 |   test.beforeEach(async ({ page }) => {
  104 |     await bypassAuth(page);
  105 |     // Return GM user from /me so the GM layout renders
  106 |     await mockMeAs(page, GM_USER);
  107 |   });
  108 | 
  109 |   test("pending proposal visible in queue, approve transitions to recent tab", async ({
  110 |     page,
  111 |   }) => {
  112 |     await page.goto("/gm");
  113 | 
  114 |     // Wait for the queue page to load
  115 |     await expect(
  116 |       page.getByRole("heading", { name: "Proposal Queue" })
> 117 |     ).toBeVisible({ timeout: 10_000 });
      |       ^ Error: expect(locator).toBeVisible() failed
  118 | 
  119 |     // Queue tab is active by default — pending proposal card should be visible.
  120 |     // MSW GET /proposals?status=pending returns one proposal with action_type "use_skill".
  121 |     // The GmProposalReviewCard renders an article with an aria-label containing the action type.
  122 |     await expect(
  123 |       page.getByRole("article").filter({ hasText: /use_skill/i }).first()
  124 |     ).toBeVisible({ timeout: 8_000 });
  125 | 
  126 |     // Click "Approve proposal" (quick-approve button) on the first proposal card.
  127 |     // ApproveForm renders a button with aria-label="Approve proposal".
  128 |     await page
  129 |       .getByRole("article")
  130 |       .filter({ hasText: /use_skill/i })
  131 |       .first()
  132 |       .getByRole("button", { name: "Approve proposal" })
  133 |       .click();
  134 | 
  135 |     // Success toast should appear
  136 |     await expect(
  137 |       page.getByText("Proposal approved.")
  138 |     ).toBeVisible({ timeout: 5_000 });
  139 | 
  140 |     // Switch to Recent tab and verify the proposal now appears there
  141 |     await page.getByRole("tab", { name: /Recent/i }).click();
  142 | 
  143 |     // Recent tab shows approved proposals (status badge "approved")
  144 |     await expect(
  145 |       page.getByText(/approved/i).first()
  146 |     ).toBeVisible({ timeout: 8_000 });
  147 |   });
  148 | });
  149 | 
```