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
import { gmUser, gmWithCharacter } from "@/mocks/fixtures/users";
import { makeCharacter } from "@/mocks/fixtures/characters";
import { paginatedList } from "@/mocks/fixtures/helpers";
import GmCharacterPage from "./page";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Router mock ───────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/gm/character",
}));

// ── Auth mock factory ──────────────────────────────��──────────────

const mockUseAuth = vi.fn();

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// ── Common MSW handlers ───────────────────────────────────────────

const gmCharacter = makeCharacter({
  id: gmWithCharacter.character_id!,
  name: "GM Character",
});

const characterHandler = http.get(
  `${API_BASE}/characters/${gmWithCharacter.character_id}`,
  () => HttpResponse.json(gmCharacter)
);

const feedHandler = http.get(
  `${API_BASE}/characters/${gmWithCharacter.character_id}/feed`,
  () => HttpResponse.json(paginatedList([]))
);

const activeSessionHandler = http.get(`${API_BASE}/sessions`, () =>
  HttpResponse.json(paginatedList([]))
);

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <GmCharacterPage />
    </TestProviders>
  );
}

// ── Story 3.4.4: GM Character ───────────────��────────────────────

describe("GmCharacterPage — no character linked", () => {
  beforeAll(() => {
    mockUseAuth.mockReturnValue({
      user: gmUser,
      isLoading: false,
      isGm: true,
      isPlayer: false,
      isViewer: false,
      canViewGmContent: true,
      canTakeGmActions: true,
      characterId: null,
      logout: vi.fn(),
    });
  });

  it("shows the create character prompt", () => {
    renderPage();
    expect(
      screen.getByRole("heading", { name: /create your character/i })
    ).toBeInTheDocument();
  });

  it("shows a form with name and description fields", () => {
    renderPage();
    expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
  });

  it("disables the submit button when name is empty", () => {
    renderPage();
    const submitBtn = screen.getByRole("button", { name: /create character/i });
    expect(submitBtn).toBeDisabled();
  });

  it("enables submit button when name is entered", () => {
    renderPage();
    const nameInput = screen.getByLabelText(/character name/i);
    fireEvent.change(nameInput, { target: { value: "Merlin" } });
    const submitBtn = screen.getByRole("button", { name: /create character/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("calls POST /me/character on submit", async () => {
    let requestBody: unknown;
    server.use(
      http.post(`${API_BASE}/me/character`, async ({ request }) => {
        requestBody = await request.json();
        return HttpResponse.json(
          { ...gmUser, character_id: "01CH_GM00000000000000000" },
          { status: 201 }
        );
      }),
      http.get(`${API_BASE}/characters/01CH_GM00000000000000000`, () =>
        HttpResponse.json(
          makeCharacter({ id: "01CH_GM00000000000000000", name: "Merlin" })
        )
      ),
      http.get(`${API_BASE}/characters/01CH_GM00000000000000000/feed`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      activeSessionHandler
    );

    renderPage();
    const nameInput = screen.getByLabelText(/character name/i);
    fireEvent.change(nameInput, { target: { value: "Merlin" } });

    const descInput = screen.getByLabelText(/description/i);
    fireEvent.change(descInput, { target: { value: "A wise old mage" } });

    const submitBtn = screen.getByRole("button", { name: /create character/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(requestBody).toEqual({
        name: "Merlin",
        description: "A wise old mage",
      });
    });
  });

  it("shows error toast when creation fails", async () => {
    server.use(
      http.post(`${API_BASE}/me/character`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error", details: null } },
          { status: 500 }
        )
      )
    );

    renderPage();
    const nameInput = screen.getByLabelText(/character name/i);
    fireEvent.change(nameInput, { target: { value: "Merlin" } });
    const submitBtn = screen.getByRole("button", { name: /create character/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/failed to create character/i)).toBeInTheDocument();
    });
  });

  it("shows character sheet after successful creation", async () => {
    server.use(
      http.post(`${API_BASE}/me/character`, async () => {
        return HttpResponse.json(
          { ...gmUser, character_id: "01CH_GM00000000000000000" },
          { status: 201 }
        );
      }),
      http.get(`${API_BASE}/characters/01CH_GM00000000000000000`, () =>
        HttpResponse.json(
          makeCharacter({ id: "01CH_GM00000000000000000", name: "Merlin" })
        )
      ),
      http.get(`${API_BASE}/characters/01CH_GM00000000000000000/feed`, () =>
        HttpResponse.json(paginatedList([]))
      ),
      activeSessionHandler
    );

    renderPage();
    const nameInput = screen.getByLabelText(/character name/i);
    fireEvent.change(nameInput, { target: { value: "Merlin" } });
    const submitBtn = screen.getByRole("button", { name: /create character/i });
    fireEvent.click(submitBtn);

    // After creation the character sheet renders (shows character name)
    expect(await screen.findByText("Merlin")).toBeInTheDocument();
    // The create form is gone
    expect(screen.queryByRole("heading", { name: /create your character/i })).not.toBeInTheDocument();
  });
});

describe("GmCharacterPage — character already linked", () => {
  beforeAll(() => {
    mockUseAuth.mockReturnValue({
      user: gmWithCharacter,
      isLoading: false,
      isGm: true,
      isPlayer: false,
      isViewer: false,
      canViewGmContent: true,
      canTakeGmActions: true,
      characterId: gmWithCharacter.character_id,
      logout: vi.fn(),
    });
  });

  it("shows the character sheet (not the create form)", async () => {
    server.use(characterHandler, feedHandler, activeSessionHandler);
    renderPage();
    expect(await screen.findByText("GM Character")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /create your character/i })
    ).not.toBeInTheDocument();
  });

  it("renders meter header with the character name", async () => {
    server.use(characterHandler, feedHandler, activeSessionHandler);
    renderPage();
    expect(await screen.findByText("GM Character")).toBeInTheDocument();
  });
});
