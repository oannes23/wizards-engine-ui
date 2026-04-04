import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { gmUser } from "@/mocks/fixtures/users";
import { makeClock } from "@/mocks/fixtures/clocks";
import { paginatedList } from "@/mocks/fixtures/helpers";
import GmClocksPage from "./page";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Router mock ───────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm/clocks",
  useParams: () => ({}),
}));

// ── Auth mock (GM) ────────────────────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: gmUser,
    isLoading: false,
    isGm: true,
    isPlayer: false,
    isViewer: false,
    canViewGmContent: true,
    canTakeGmActions: true,
    characterId: null,
    logout: vi.fn(),
  }),
}));

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Default handlers ──────────────────────────────────────────────

const activeClock = makeClock({
  id: "01CLOCK_ACTIVE000000000",
  name: "Doomsday Clock",
  segments: 8,
  progress: 3,
});

const completedClock = makeClock({
  id: "01CLOCK_DONE0000000000",
  name: "The Heist",
  segments: 6,
  progress: 6,
  is_completed: true,
});

const nearCompleteClock = makeClock({
  id: "01CLOCK_NEAR00000000000",
  name: "Ritual Preparation",
  segments: 8,
  progress: 7,
});

function defaultClocksHandler() {
  return http.get(`${API_BASE}/clocks`, () =>
    HttpResponse.json(paginatedList([activeClock, completedClock, nearCompleteClock]))
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("GmClocksPage", () => {
  it("renders the page heading and New Clock button", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    expect(screen.getByText("Clocks")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new clock/i })).toBeInTheDocument();
  });

  it("renders filter tabs: All, Active, Completed", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Active" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Completed" })).toBeInTheDocument();
  });

  it("shows active clocks by default (active tab selected)", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    const activeTab = screen.getByRole("tab", { name: "Active" });
    expect(activeTab).toHaveAttribute("aria-selected", "true");
  });

  it("displays clock names after loading", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("Doomsday Clock")).toBeInTheDocument();
    });
  });

  it("shows near-complete badge for clocks > 75% progress", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    await waitFor(() => {
      // Ritual Preparation (7/8 = 87.5%) should show near-complete
      expect(screen.getByText("Ritual Preparation")).toBeInTheDocument();
    });

    expect(screen.getByText("Near complete")).toBeInTheDocument();
  });

  it("shows the create form when clicking New Clock", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    const newClockBtn = screen.getByRole("button", { name: /new clock/i });
    fireEvent.click(newClockBtn);

    expect(screen.getByLabelText("Create clock form")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /^name/i })).toBeInTheDocument();
  });

  it("can create a new clock", async () => {
    let created = false;

    server.use(
      defaultClocksHandler(),
      http.post(`${API_BASE}/clocks`, async ({ request }) => {
        const body = (await request.json()) as { name: string; segments: number };
        created = true;
        return HttpResponse.json(makeClock({
          id: "01CLOCK_CREATED0000000",
          name: body.name,
          segments: body.segments,
        }), { status: 201 });
      })
    );

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    // Open create form
    fireEvent.click(screen.getByRole("button", { name: /new clock/i }));

    await waitFor(() => {
      expect(screen.getByRole("textbox", { name: /^name/i })).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByRole("textbox", { name: /^name/i }), {
      target: { value: "New Clock" },
    });

    const submitBtn = screen.getByRole("button", { name: /create clock/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(created).toBe(true);
    });
  });

  it("shows empty state when no clocks", async () => {
    server.use(
      http.get(`${API_BASE}/clocks`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("No clocks")).toBeInTheDocument();
    });
  });

  it("shows error state when clocks fail to load", async () => {
    server.use(
      http.get(`${API_BASE}/clocks`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "Internal error" } },
          { status: 500 }
        )
      )
    );

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("Could not load clocks")).toBeInTheDocument();
    });
  });

  it("shows edit buttons on clock cards", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("Doomsday Clock")).toBeInTheDocument();
    });

    // Each clock card should have edit and delete buttons
    const editButtons = screen.getAllByRole("button", { name: /edit clock/i });
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it("shows delete confirmation modal when clicking delete", async () => {
    server.use(defaultClocksHandler());

    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    await waitFor(() => {
      expect(screen.getByText("Doomsday Clock")).toBeInTheDocument();
    });

    // Click delete on first clock
    const deleteButtons = screen.getAllByRole("button", { name: /delete clock/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Delete Clock")).toBeInTheDocument();
    });
  });

  it("completed clock shows Complete badge", async () => {
    server.use(
      http.get(`${API_BASE}/clocks`, () =>
        HttpResponse.json(paginatedList([completedClock]))
      )
    );

    // Switch filter to completed
    render(
      <TestProviders>
        <GmClocksPage />
      </TestProviders>
    );

    // Switch to All tab to see completed clocks
    const allTab = screen.getByRole("tab", { name: "All" });
    fireEvent.click(allTab);

    await waitFor(() => {
      expect(screen.getByText("The Heist")).toBeInTheDocument();
    });

    expect(screen.getByText("Complete")).toBeInTheDocument();
  });
});
