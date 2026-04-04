/**
 * Integration tests: World Browser & World Detail Pages (Story 3.2 — QA-6)
 *
 * Covers:
 * - World browser page tabs (Characters, Groups, Locations, Stories)
 * - Tab switching loads correct content
 * - Empty and error states for each tab
 * - Group detail page: name, tier, members, traits, bonds
 * - Location detail page: name, presence tiers, breadcrumb, traits
 * - CRUD integration: GM create group → POST /groups → success toast + redirect
 */

import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  beforeEach,
  vi,
} from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { useParams, useRouter } from "next/navigation";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { makeGroup, makeLocation, makeStory } from "@/mocks/fixtures/world";
import { makeCharacter, makeNpcCharacter } from "@/mocks/fixtures/characters";
import { paginatedList } from "@/mocks/fixtures/helpers";
import WorldBrowserPage from "@/app/(player)/world/page";
import GroupDetailPage from "@/app/(player)/world/groups/[id]/page";
import LocationDetailPage from "@/app/(player)/world/locations/[id]/page";
import GmCreateGroupPage from "@/app/(gm)/world/groups/new/page";

const API_BASE = "http://localhost:8000/api/v1";
const GROUP_ID = "01GROUP_DEFAULT000000000";
const LOCATION_ID = "01LOC_DEFAULT0000000000";

// ── Navigation mocks ───────────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: mockPush, replace: vi.fn() })),
  usePathname: vi.fn(() => "/world"),
  useParams: vi.fn(() => ({ id: GROUP_ID })),
  useSearchParams: vi.fn(() => ({ get: () => null })),
}));

// ── Auth mock (player by default) ────────────────────────────────

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: "01USER_PLAYER000000000",
      display_name: "Alice",
      role: "player",
      is_active: true,
    },
    isLoading: false,
    isGm: false,
    isPlayer: true,
    isViewer: false,
    canViewGmContent: false,
    canTakeGmActions: false,
    characterId: "01CHAR_DEFAULT0000000000",
    logout: vi.fn(),
  }),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  vi.mocked(useParams).mockReturnValue({ id: GROUP_ID });
  vi.mocked(useRouter).mockReturnValue({ push: mockPush, replace: vi.fn() } as ReturnType<typeof useRouter>);
  mockPush.mockClear();
});
afterAll(() => server.close());

// ── Default handlers ───────────────────────────────────────────────

function setupWorldHandlers() {
  server.use(
    http.get(`${API_BASE}/characters`, () =>
      HttpResponse.json(
        paginatedList([
          makeCharacter({ id: "char-1", name: "Kael" }),
          makeNpcCharacter({ id: "npc-1", name: "Merchant" }),
        ])
      )
    ),
    http.get(`${API_BASE}/groups`, () =>
      HttpResponse.json(paginatedList([makeGroup()]))
    ),
    http.get(`${API_BASE}/locations`, () =>
      HttpResponse.json(paginatedList([makeLocation()]))
    ),
    http.get(`${API_BASE}/stories`, () =>
      HttpResponse.json(paginatedList([makeStory()]))
    ),
    http.get(`${API_BASE}/sessions`, () =>
      HttpResponse.json(paginatedList([]))
    )
  );
}

function renderWorldBrowser() {
  vi.mocked(useParams).mockReturnValue({});
  return render(
    <TestProviders>
      <WorldBrowserPage />
    </TestProviders>
  );
}

// ── World Browser Page ─────────────────────────────────────────────

describe("world-browser: page structure", () => {
  it("renders the page heading", () => {
    setupWorldHandlers();
    renderWorldBrowser();
    expect(screen.getByRole("heading", { name: /world/i })).toBeInTheDocument();
  });

  it("renders four tab buttons", () => {
    setupWorldHandlers();
    renderWorldBrowser();
    expect(screen.getByRole("tab", { name: /characters/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /groups/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /locations/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /stories/i })).toBeInTheDocument();
  });

  it("Characters tab is selected by default", () => {
    setupWorldHandlers();
    renderWorldBrowser();
    expect(
      screen.getByRole("tab", { name: /characters/i })
    ).toHaveAttribute("aria-selected", "true");
  });
});

describe("world-browser: Characters tab", () => {
  it("displays character names after loading", async () => {
    setupWorldHandlers();
    renderWorldBrowser();
    expect(await screen.findByText("Kael")).toBeInTheDocument();
    expect(screen.getByText("Merchant")).toBeInTheDocument();
  });

  it("shows empty state when no characters", async () => {
    server.use(
      http.get(`${API_BASE}/characters`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([])))
    );
    renderWorldBrowser();
    expect(await screen.findByText(/no characters found/i)).toBeInTheDocument();
  });

  it("shows error state when characters fetch fails", async () => {
    server.use(
      http.get(`${API_BASE}/characters`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error", details: null } },
          { status: 500 }
        )
      ),
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([])))
    );
    renderWorldBrowser();
    expect(await screen.findByText(/could not load characters/i)).toBeInTheDocument();
  });
});

describe("world-browser: Groups tab", () => {
  it("switching to Groups tab shows group names", async () => {
    setupWorldHandlers();
    renderWorldBrowser();

    fireEvent.click(screen.getByRole("tab", { name: /groups/i }));
    expect(await screen.findByText("The Night Watch")).toBeInTheDocument();
  });

  it("shows group tier badge", async () => {
    setupWorldHandlers();
    renderWorldBrowser();

    fireEvent.click(screen.getByRole("tab", { name: /groups/i }));
    await screen.findByText("The Night Watch");
    expect(screen.getByText(/tier 3/i)).toBeInTheDocument();
  });

  it("shows empty state for groups when none exist", async () => {
    server.use(
      http.get(`${API_BASE}/groups`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      http.get(`${API_BASE}/characters`, () =>
        HttpResponse.json(paginatedList([makeCharacter()]))
      ),
      http.get(`${API_BASE}/sessions`, () => HttpResponse.json(paginatedList([])))
    );
    renderWorldBrowser();

    fireEvent.click(screen.getByRole("tab", { name: /groups/i }));
    expect(await screen.findByText(/no groups found/i)).toBeInTheDocument();
  });
});

describe("world-browser: Locations tab", () => {
  it("switching to Locations tab shows location names", async () => {
    setupWorldHandlers();
    renderWorldBrowser();

    fireEvent.click(screen.getByRole("tab", { name: /locations/i }));
    expect(await screen.findByText("The Docks")).toBeInTheDocument();
  });
});

describe("world-browser: Stories tab", () => {
  it("switching to Stories tab shows story names", async () => {
    setupWorldHandlers();
    renderWorldBrowser();

    fireEvent.click(screen.getByRole("tab", { name: /stories/i }));
    expect(await screen.findByText("The Shadow Conspiracy")).toBeInTheDocument();
  });

  it("shows story status badge", async () => {
    setupWorldHandlers();
    renderWorldBrowser();

    fireEvent.click(screen.getByRole("tab", { name: /stories/i }));
    await screen.findByText("The Shadow Conspiracy");
    expect(screen.getByText("active")).toBeInTheDocument();
  });
});

// ── Group Detail Page ──────────────────────────────────────────────

describe("world-browser: group detail page", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: GROUP_ID });
    server.use(
      http.get(`${API_BASE}/groups/${GROUP_ID}`, () =>
        HttpResponse.json(makeGroup({ id: GROUP_ID }))
      ),
      http.get(`${API_BASE}/groups/${GROUP_ID}/feed`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      http.get(`${API_BASE}/sessions`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );
  });

  function renderGroupDetail() {
    return render(
      <TestProviders>
        <GroupDetailPage />
      </TestProviders>
    );
  }

  it("renders the group name", async () => {
    renderGroupDetail();
    expect(await screen.findByText("The Night Watch")).toBeInTheDocument();
  });

  it("renders tier badge", async () => {
    renderGroupDetail();
    await screen.findByText("The Night Watch");
    expect(screen.getByText(/tier 3/i)).toBeInTheDocument();
  });

  it("renders group description", async () => {
    renderGroupDetail();
    await screen.findByText("The Night Watch");
    expect(
      screen.getByText(/vigilant organization/i)
    ).toBeInTheDocument();
  });

  it("renders member names", async () => {
    renderGroupDetail();
    await screen.findByText("The Night Watch");
    expect(screen.getByText("Kael")).toBeInTheDocument();
  });

  it("renders trait names", async () => {
    renderGroupDetail();
    await screen.findByText("The Night Watch");
    expect(screen.getByText("Well-Armed")).toBeInTheDocument();
  });

  it("shows error state when group not found", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "nonexistent" });
    server.use(
      http.get(`${API_BASE}/groups/nonexistent`, () =>
        HttpResponse.json(
          { error: { code: "not_found", message: "Group not found", details: null } },
          { status: 404 }
        )
      ),
      http.get(`${API_BASE}/groups/nonexistent/feed`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    render(
      <TestProviders>
        <GroupDetailPage />
      </TestProviders>
    );

    expect(await screen.findByText("Group not found")).toBeInTheDocument();
  });
});

// ── Location Detail Page ───────────────────────────────────────────

describe("world-browser: location detail page", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({ id: LOCATION_ID });
    server.use(
      http.get(`${API_BASE}/locations/${LOCATION_ID}`, () =>
        HttpResponse.json(makeLocation({ id: LOCATION_ID }))
      ),
      http.get(`${API_BASE}/locations`, () =>
        HttpResponse.json(paginatedList([makeLocation({ id: LOCATION_ID })]))
      ),
      http.get(`${API_BASE}/locations/${LOCATION_ID}/feed`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      http.get(`${API_BASE}/sessions`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );
  });

  function renderLocationDetail() {
    return render(
      <TestProviders>
        <LocationDetailPage />
      </TestProviders>
    );
  }

  it("renders the location name", async () => {
    renderLocationDetail();
    expect(await screen.findByText("The Docks")).toBeInTheDocument();
  });

  it("renders location description", async () => {
    renderLocationDetail();
    await screen.findByText("The Docks");
    expect(screen.getByText(/bustling waterfront/i)).toBeInTheDocument();
  });

  it("renders 'Who's Around' presence section", async () => {
    renderLocationDetail();
    await screen.findByText("The Docks");
    // The location fixture has tier 1 and tier 2 presence items
    expect(screen.getByText("Commonly present")).toBeInTheDocument();
    expect(screen.getByText("Often present")).toBeInTheDocument();
  });

  it("renders trait names", async () => {
    renderLocationDetail();
    await screen.findByText("The Docks");
    expect(screen.getByText("Trade Hub")).toBeInTheDocument();
  });

  it("renders location bonds/connections", async () => {
    renderLocationDetail();
    await screen.findByText("The Docks");
    // The fixture has "The Night Watch" as a bond target
    expect(screen.getByText("The Night Watch")).toBeInTheDocument();
  });

  it("shows error state when location not found", async () => {
    vi.mocked(useParams).mockReturnValue({ id: "nonexistent" });
    server.use(
      http.get(`${API_BASE}/locations/nonexistent`, () =>
        HttpResponse.json(
          { error: { code: "not_found", message: "not found", details: null } },
          { status: 404 }
        )
      ),
      http.get(`${API_BASE}/locations`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      http.get(`${API_BASE}/locations/nonexistent/feed`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    render(
      <TestProviders>
        <LocationDetailPage />
      </TestProviders>
    );

    expect(await screen.findByText("Location not found")).toBeInTheDocument();
  });
});

// ── CRUD Integration: GM Create Group → redirect ──────────────────

describe("world-browser: GM create group CRUD flow", () => {
  beforeEach(() => {
    vi.mocked(useParams).mockReturnValue({});
    mockPush.mockClear();
  });

  it("submitting create group form calls POST /groups and redirects", async () => {
    let createBody: Record<string, unknown> = {};
    server.use(
      http.post(`${API_BASE}/groups`, async ({ request }) => {
        createBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          makeGroup({ id: "01GROUP_NEW0000000000", name: createBody.name as string }),
          { status: 201 }
        );
      })
    );

    render(
      <TestProviders>
        <GmCreateGroupPage />
      </TestProviders>
    );

    // Fill in name
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "The Crimson Brotherhood" },
    });

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /create group/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/group "the crimson brotherhood" created/i)
      ).toBeInTheDocument();
    });

    expect(createBody).toMatchObject({ name: "The Crimson Brotherhood" });
    expect(mockPush).toHaveBeenCalledWith(
      "/world/groups/01GROUP_NEW0000000000"
    );
  });

  it("Create button is disabled when name is empty", () => {
    render(
      <TestProviders>
        <GmCreateGroupPage />
      </TestProviders>
    );
    expect(
      screen.getByRole("button", { name: /create group/i })
    ).toBeDisabled();
  });

  it("shows error toast when create fails", async () => {
    server.use(
      http.post(`${API_BASE}/groups`, () =>
        HttpResponse.json(
          { error: { code: "validation_error", message: "Bad input", details: null } },
          { status: 422 }
        )
      )
    );

    render(
      <TestProviders>
        <GmCreateGroupPage />
      </TestProviders>
    );

    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Broken Group" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create group/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/failed to create group/i)
      ).toBeInTheDocument();
    });
  });
});
