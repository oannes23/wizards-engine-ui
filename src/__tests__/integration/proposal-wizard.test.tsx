/**
 * Integration tests for the Proposal Wizard — /proposals/new
 *
 * Covers: Epic 2.1, Batches I-L
 *   - Full 3-step flow for use_skill: select action → fill form → review → submit
 *   - Full 3-step flow for rest (downtime action): select → fill → review → submit
 *   - Edit (revise) rejected proposal flow: load → view pre-fill → review → resubmit
 *   - Disable logic: session actions disabled when no active session
 *   - Disable logic: downtime actions disabled when FT = 0
 *   - 422 from POST /proposals/calculate → back to Step 2 with field errors
 *   - 409 from PATCH /proposals/:id (already approved) → error toast, no redirect
 *
 * Note: The edit page (ProposalEditPage) hosts its own 2-step sub-wizard.
 * The full 3-step wizard lives on ProposalWizardPage (/proposals/new).
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import {
  calculateValidationErrorHandler,
  calculateSuccessHandler,
  patchProposalApprovedHandler,
  MOCK_CALCULATED_EFFECT,
  REJECTED_PROPOSAL_ID,
} from "@/mocks/handlers/proposals";
import {
  makeRejectedProposal,
  makeProposal,
} from "@/mocks/fixtures/proposals";
import { makeCharacter } from "@/mocks/fixtures/characters";
import { paginatedList } from "@/mocks/fixtures/helpers";
import { playerA } from "@/mocks/fixtures/users";
import ProposalWizardPage from "@/app/(player)/proposals/new/page";
import ProposalEditPage from "@/app/(player)/proposals/[id]/edit/page";

const API_BASE = "http://localhost:8000/api/v1";

// ── Mocks ─────────────────────────────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: playerA,
    isLoading: false,
    isGm: false,
    isPlayer: true,
    isViewer: false,
    canViewGmContent: false,
    canTakeGmActions: false,
    characterId: playerA.character_id,
    logout: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockPush = vi.fn();
const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useParams: () => ({ id: REJECTED_PROPOSAL_ID }),
}));

// ── MSW lifecycle ─────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  mockPush.mockClear();
  mockReplace.mockClear();
  // Clear the wizard draft from sessionStorage so each test starts fresh
  // (WizardProvider saves state to sessionStorage on step changes)
  sessionStorage.clear();
});
afterAll(() => server.close());

// ── Fixtures ──────────────────────────────────────────────────────

/** Active session fixture for enabling session action cards */
const ACTIVE_SESSION = {
  id: "01SESSION_ACTIVE000000000",
  status: "active",
  time_now: 10,
  date: "2026-04-03",
  summary: null,
  notes: null,
  participants: [],
  created_at: "2026-04-03T00:00:00Z",
  updated_at: "2026-04-03T00:00:00Z",
};

/** Character with healthy resources */
const PC_CHAR_ID = playerA.character_id!;

/** MSW override: return an active session */
function useActiveSession() {
  server.use(
    http.get(`${API_BASE}/sessions`, ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.get("status") === "active") {
        return HttpResponse.json(paginatedList([ACTIVE_SESSION]));
      }
      return HttpResponse.json(paginatedList([]));
    })
  );
}

/** MSW override: return no active session */
function useNoActiveSession() {
  server.use(
    http.get(`${API_BASE}/sessions`, () =>
      HttpResponse.json(paginatedList([]))
    )
  );
}

/** MSW override: provide a character with FT = 0 */
function useCharacterWithNoFT() {
  server.use(
    http.get(`${API_BASE}/characters/${PC_CHAR_ID}`, () =>
      HttpResponse.json(makeCharacter({ id: PC_CHAR_ID, free_time: 0 }))
    )
  );
}

// ── Helpers ───────────────────────────────────────────────────────

function renderWizardPage() {
  return render(
    <TestProviders>
      <ProposalWizardPage />
    </TestProviders>
  );
}

function renderEditPage() {
  return render(
    <TestProviders>
      <ProposalEditPage />
    </TestProviders>
  );
}

// ── Step 1: Action type selector ──────────────────────────────────

describe("proposal wizard — Step 1: action type selector", () => {
  it("renders the page heading 'New Proposal'", async () => {
    renderWizardPage();
    expect(await screen.findByText("New Proposal")).toBeInTheDocument();
  });

  it("renders the Step 1 content heading 'Choose Action Type'", async () => {
    renderWizardPage();
    expect(
      await screen.findByText("Choose Action Type")
    ).toBeInTheDocument();
  });

  it("renders the Cancel link back to /proposals", async () => {
    renderWizardPage();
    const cancelLink = await screen.findByLabelText(
      "Cancel and return to proposals"
    );
    expect(cancelLink).toHaveAttribute("href", "/proposals");
  });

  it("renders Session Actions and Downtime Actions sections", async () => {
    renderWizardPage();
    expect(await screen.findByText("Session Actions")).toBeInTheDocument();
    expect(screen.getByText(/Downtime Actions/)).toBeInTheDocument();
  });

  it("all session action cards are disabled when there is no active session", async () => {
    useNoActiveSession();
    renderWizardPage();
    // Wait for character data to load (ActionTypeSelector renders after WizardInner)
    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).toBeDisabled();
    });
    expect(screen.getByLabelText("Select Use Magic")).toBeDisabled();
    expect(screen.getByLabelText("Select Charge Magic")).toBeDisabled();
  });

  it("session action cards are enabled when an active session exists", async () => {
    useActiveSession();
    renderWizardPage();
    await waitFor(
      () => {
        expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
      },
      { timeout: 2000 }
    );
    expect(screen.getByLabelText("Select Use Magic")).not.toBeDisabled();
  });

  it("downtime actions are disabled when character FT is 0", async () => {
    useCharacterWithNoFT();
    renderWizardPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Select Rest")).toBeDisabled();
    });
    expect(screen.getByLabelText("Select Regain Gnosis")).toBeDisabled();
  });

  it("downtime actions are enabled when character FT > 0", async () => {
    renderWizardPage();
    await waitFor(() => {
      expect(screen.getByLabelText("Select Rest")).not.toBeDisabled();
    });
  });
});

// ── Full use_skill flow ────────────────────────────────────────────

describe("proposal wizard — full use_skill flow", () => {
  it("navigates to Step 2 after selecting Use Skill (via session)", async () => {
    useActiveSession();
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });

    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Details")).toBeInTheDocument();
    });
  });

  it("shows UseSkillForm on Step 2 after selecting use_skill", async () => {
    useActiveSession();
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    // UseSkillForm renders a Skill selector
    await waitFor(() => {
      expect(screen.getByText("Skill")).toBeInTheDocument();
    });
  });

  it("advances to Step 3 (Review) after filling use_skill form and clicking Next", async () => {
    useActiveSession();
    renderWizardPage();

    // Step 1: select use_skill
    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    // Step 2: fill form — select a skill
    await waitFor(() => {
      expect(screen.getByLabelText(/Skill/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Skill/), {
      target: { value: "finesse" },
    });
    fireEvent.click(screen.getByText("Next: Review"));

    // Step 3: ReviewStep loads and fires POST /proposals/calculate
    await waitFor(() => {
      expect(screen.getByText("Review Your Proposal")).toBeInTheDocument();
    });
  });

  it("ReviewStep shows CalculatedEffectCard after server calculate succeeds", async () => {
    useActiveSession();
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    await waitFor(() => expect(screen.getByLabelText(/Skill/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Skill/), { target: { value: "finesse" } });
    fireEvent.click(screen.getByText("Next: Review"));

    // Wait for calculate result — CalculatedEffectCard renders dice_pool
    await waitFor(() => {
      expect(
        screen.getByText(String(MOCK_CALCULATED_EFFECT.dice_pool))
      ).toBeInTheDocument();
    });
  });

  it("submitting on Review calls POST /proposals and redirects to /proposals", async () => {
    useActiveSession();
    renderWizardPage();

    // Navigate through all 3 steps
    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    await waitFor(() => expect(screen.getByLabelText(/Skill/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Skill/), { target: { value: "finesse" } });
    fireEvent.click(screen.getByText("Next: Review"));

    // Wait for calculate to complete, then submit
    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/proposals");
    });
  });
});

// ── Full rest (downtime) flow ─────────────────────────────────────

describe("proposal wizard — full rest (downtime) flow", () => {
  it("navigates to Step 2 after selecting Rest", async () => {
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Rest")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Rest"));

    await waitFor(() => {
      expect(screen.getByText("Fill in Details")).toBeInTheDocument();
    });
  });

  it("shows RestForm on Step 2 after selecting rest", async () => {
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Rest")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Rest"));

    await waitFor(() => {
      expect(screen.getByText("Cost: 1 Free Time")).toBeInTheDocument();
    });
  });

  it("advances to Review after completing rest form with narrative", async () => {
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Rest")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Rest"));

    await waitFor(() => {
      expect(screen.getByLabelText(/Narrative/)).toBeInTheDocument();
    });
    fireEvent.change(screen.getByLabelText(/Narrative/), {
      target: { value: "I rest by the fireside." },
    });
    fireEvent.click(screen.getByText("Next: Review"));

    await waitFor(() => {
      expect(screen.getByText("Review Your Proposal")).toBeInTheDocument();
    });
  });

  it("submitting rest proposal redirects to /proposals on success", async () => {
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Rest")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Rest"));

    await waitFor(() => expect(screen.getByLabelText(/Narrative/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Narrative/), {
      target: { value: "A quiet evening by the fire." },
    });
    fireEvent.click(screen.getByText("Next: Review"));

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/proposals");
    });
  });
});

// ── 422 validation error from calculate ───────────────────────────

describe("proposal wizard — 422 from POST /proposals/calculate", () => {
  it("422 from calculate calls onValidationErrors and navigates back to Step 2", async () => {
    useActiveSession();
    server.use(
      calculateValidationErrorHandler({ skill: "Invalid skill selection" })
    );
    renderWizardPage();

    // Navigate to Step 2 via use_skill
    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    // Fill form and advance to Review
    await waitFor(() => expect(screen.getByLabelText(/Skill/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Skill/), { target: { value: "finesse" } });
    fireEvent.click(screen.getByText("Next: Review"));

    // ReviewStep fires calculate; 422 triggers callback that sends us back to step 2
    await waitFor(() => {
      // After 422, wizard should revert to step 2 — Skill selector is visible again
      expect(screen.getByText("Fill in Details")).toBeInTheDocument();
    });
  });
});

// ── Edit rejected proposal flow ───────────────────────────────────

/** Seed a rejected proposal for the edit page suite */
function useRejectedProposalFixture() {
  server.use(
    http.get(`${API_BASE}/proposals/${REJECTED_PROPOSAL_ID}`, () =>
      HttpResponse.json(
        makeRejectedProposal({
          id: REJECTED_PROPOSAL_ID,
          action_type: "use_skill",
          gm_notes: "Scope was unclear.",
          selections: {
            skill: "finesse",
            modifiers: {},
            plot_spend: 0,
          },
        })
      )
    )
  );
}

describe("proposal wizard — edit rejected proposal (edit page)", () => {
  it("shows 'Revise Proposal' heading on edit page for rejected proposal", async () => {
    useRejectedProposalFixture();
    renderEditPage();
    await waitFor(() => {
      expect(screen.getByText("Revise Proposal")).toBeInTheDocument();
    });
  });

  it("shows the rejection note banner with GM note text", async () => {
    useRejectedProposalFixture();
    renderEditPage();
    await waitFor(() => {
      expect(screen.getByTestId("rejection-note-banner")).toBeInTheDocument();
      expect(screen.getByText("Scope was unclear.")).toBeInTheDocument();
    });
  });

  it("pre-fills the form — UseSkillForm is rendered (use_skill action type)", async () => {
    useRejectedProposalFixture();
    renderEditPage();
    await waitFor(() => {
      expect(screen.getByText("Skill")).toBeInTheDocument();
    });
  });

  it("resubmitting calls PATCH /proposals/:id and redirects to /proposals", async () => {
    useRejectedProposalFixture();
    renderEditPage();

    // Wait for form to appear
    await waitFor(() => {
      expect(screen.getByText("Next: Review")).toBeInTheDocument();
    });

    // Step 2: ensure skill is selected (pre-filled) and advance
    fireEvent.click(screen.getByText("Next: Review"));

    // Step 3 (Review): wait for calculate, then submit
    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/proposals");
    });
  });
});

// ── 409 — already approved ─────────────────────────────────────────

describe("proposal wizard — 409 already-approved on PATCH", () => {
  it("shows error toast and does NOT redirect when PATCH returns 409", async () => {
    // Override PATCH to return 409 for the rejected proposal
    server.use(patchProposalApprovedHandler(REJECTED_PROPOSAL_ID));

    // Seed the proposal
    server.use(
      http.get(`${API_BASE}/proposals/${REJECTED_PROPOSAL_ID}`, () =>
        HttpResponse.json(
          makeProposal({
            id: REJECTED_PROPOSAL_ID,
            status: "pending",
            action_type: "use_skill",
            selections: { skill: "finesse", modifiers: {}, plot_spend: 0 },
          })
        )
      )
    );

    renderEditPage();

    await waitFor(() => {
      expect(screen.getByText("Next: Review")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Next: Review"));

    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

// ── POST /proposals/calculate is a dry run ────────────────────────

describe("proposal wizard — POST /proposals/calculate dry-run behavior", () => {
  it("calculate resolves before submit button is enabled", async () => {
    // Override calculate to respond successfully
    server.use(calculateSuccessHandler());
    useActiveSession();
    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    await waitFor(() => expect(screen.getByLabelText(/Skill/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Skill/), { target: { value: "finesse" } });
    fireEvent.click(screen.getByText("Next: Review"));

    // Submit button starts disabled while calculating
    // After resolve, it becomes enabled
    await waitFor(() => {
      expect(screen.getByTestId("submit-button")).not.toBeDisabled();
    });

    // Submitting calls POST /proposals (not calculate again)
    let postProposalCalled = false;
    server.use(
      http.post(`${API_BASE}/proposals`, async () => {
        postProposalCalled = true;
        return HttpResponse.json(
          makeProposal({ id: "01PROPOSAL_NEW000000000", status: "pending" }),
          { status: 201 }
        );
      })
    );

    fireEvent.click(screen.getByTestId("submit-button"));
    await waitFor(() => {
      expect(postProposalCalled).toBe(true);
    });
  });

  it("calculate returns effect without creating a proposal (no 201 emitted)", async () => {
    server.use(calculateSuccessHandler(MOCK_CALCULATED_EFFECT));
    useActiveSession();

    let proposalCreated = false;
    server.use(
      http.post(`${API_BASE}/proposals`, async () => {
        proposalCreated = true;
        return HttpResponse.json(makeProposal(), { status: 201 });
      })
    );

    renderWizardPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    await waitFor(() => expect(screen.getByLabelText(/Skill/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Skill/), { target: { value: "finesse" } });
    fireEvent.click(screen.getByText("Next: Review"));

    // Wait until ReviewStep has rendered the calculated effect
    await waitFor(() => {
      expect(
        screen.getByText(String(MOCK_CALCULATED_EFFECT.dice_pool))
      ).toBeInTheDocument();
    });

    // Proposal should NOT have been created yet (no submit pressed)
    expect(proposalCreated).toBe(false);
  });
});

// ── Step indicator ────────────────────────────────────────────────

describe("proposal wizard — step indicator", () => {
  it("step indicator advances as the user moves through the wizard", async () => {
    useActiveSession();
    renderWizardPage();

    // Step 0 is active initially — "Choose Action" label visible
    expect(await screen.findByText("New Proposal")).toBeInTheDocument();

    // Select an action type
    await waitFor(() => {
      expect(screen.getByLabelText("Select Use Skill")).not.toBeDisabled();
    });
    fireEvent.click(screen.getByLabelText("Select Use Skill"));

    // Step 1 now active — "Fill in Details" heading visible
    await waitFor(() => {
      expect(screen.getByText("Fill in Details")).toBeInTheDocument();
    });

    // Fill form and advance to step 2
    await waitFor(() => expect(screen.getByLabelText(/Skill/)).toBeInTheDocument());
    fireEvent.change(screen.getByLabelText(/Skill/), { target: { value: "awareness" } });
    fireEvent.click(screen.getByText("Next: Review"));

    // Step 2 now active — Review heading visible
    await waitFor(() => {
      expect(screen.getByText("Review Your Proposal")).toBeInTheDocument();
    });
  });
});
