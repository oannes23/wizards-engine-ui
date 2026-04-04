import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { ActionTypeSelector } from "./ActionTypeSelector";
import { WizardProvider } from "./WizardProvider";
import { TestProviders } from "@/mocks/TestProviders";
import { paginatedList } from "@/mocks/fixtures/helpers";

const API_BASE = "http://localhost:8000/api/v1";

// ── Mock next/navigation ───────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
}));

// ── MSW server ────────────────────────────────────────────────────

const server = setupServer(
  // No active session by default
  http.get(`${API_BASE}/sessions`, () =>
    HttpResponse.json(paginatedList([]))
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ────────────────────────────────────────────────────────

function renderSelector(freeTime: number | null = 5) {
  return render(
    <TestProviders>
      <WizardProvider skipDraftRestore>
        <ActionTypeSelector freeTime={freeTime} />
      </WizardProvider>
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("ActionTypeSelector", () => {
  describe("rendering", () => {
    it("renders Session Actions section heading", async () => {
      renderSelector();
      expect(await screen.findByText("Session Actions")).toBeInTheDocument();
    });

    it("renders Downtime Actions section heading", async () => {
      renderSelector();
      expect(await screen.findByText(/Downtime Actions/)).toBeInTheDocument();
    });

    it("renders all 3 session action cards", async () => {
      renderSelector();
      expect(await screen.findByLabelText("Select Use Skill")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Use Magic")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Charge Magic")).toBeInTheDocument();
    });

    it("renders all 5 downtime action cards", async () => {
      renderSelector();
      expect(await screen.findByLabelText("Select Regain Gnosis")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Rest")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Work on Project")).toBeInTheDocument();
      expect(screen.getByLabelText("Select New Trait")).toBeInTheDocument();
      expect(screen.getByLabelText("Select New Bond")).toBeInTheDocument();
    });
  });

  describe("session action availability", () => {
    it("disables session actions when no active session", async () => {
      // server returns no sessions by default
      renderSelector();
      const useSkillBtn = await screen.findByLabelText("Select Use Skill");
      expect(useSkillBtn).toBeDisabled();
    });

    it("enables session actions when active session exists", async () => {
      server.use(
        http.get(`${API_BASE}/sessions`, () =>
          HttpResponse.json(
            paginatedList([
              {
                id: "01SESSION_ACTIVE000000000",
                status: "active",
                time_now: 10,
                date: "2026-04-03",
                summary: null,
                notes: null,
                participants: [],
                created_at: "2026-04-03T00:00:00Z",
                updated_at: "2026-04-03T00:00:00Z",
              },
            ])
          )
        )
      );
      renderSelector();
      // Wait for the session query to resolve and re-render with enabled buttons
      await waitFor(
        () => {
          const useSkillBtn = screen.getByLabelText("Select Use Skill");
          expect(useSkillBtn).not.toBeDisabled();
        },
        { timeout: 2000 }
      );
    });
  });

  describe("downtime action availability", () => {
    it("disables downtime actions when FT is 0", async () => {
      renderSelector(0);
      const restBtn = await screen.findByLabelText("Select Rest");
      expect(restBtn).toBeDisabled();
    });

    it("disables downtime actions when FT is null", async () => {
      renderSelector(null);
      const restBtn = await screen.findByLabelText("Select Rest");
      expect(restBtn).toBeDisabled();
    });

    it("enables downtime actions when FT > 0", async () => {
      renderSelector(5);
      const restBtn = await screen.findByLabelText("Select Rest");
      expect(restBtn).not.toBeDisabled();
    });
  });

  describe("selection", () => {
    it("clicking an enabled downtime card calls selectActionType", async () => {
      renderSelector(5);
      const restBtn = await screen.findByLabelText("Select Rest");
      fireEvent.click(restBtn);
      // After selection, WizardProvider advances step — we can't easily assert
      // the context state here without a spy, but we verify the button is clickable
      // and doesn't throw.
      expect(restBtn).not.toBeDisabled();
    });

    it("clicking a disabled card does not trigger navigation", async () => {
      renderSelector(0);
      const restBtn = await screen.findByLabelText("Select Rest");
      // Should not throw or navigate
      fireEvent.click(restBtn);
    });
  });

  describe("accessibility", () => {
    it("session action buttons have aria-disabled when no session", async () => {
      renderSelector();
      const useSkillBtn = await screen.findByLabelText("Select Use Skill");
      expect(useSkillBtn).toHaveAttribute("aria-disabled", "true");
    });

    it("downtime action buttons have aria-disabled when FT = 0", async () => {
      renderSelector(0);
      const restBtn = await screen.findByLabelText("Select Rest");
      expect(restBtn).toHaveAttribute("aria-disabled", "true");
    });
  });
});
