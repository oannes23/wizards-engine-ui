import { describe, it, expect, beforeAll, afterAll, afterEach, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import { QueryClient } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { playerA } from "@/mocks/fixtures/users";
import { starredFixture } from "@/mocks/handlers/users";
import ProfilePage from "./page";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Router mock ───────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// ── Auth mock ─────────────────────────────────────────────────────

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

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage(queryClient?: QueryClient) {
  return render(
    <TestProviders queryClient={queryClient}>
      <ProfilePage />
    </TestProviders>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("ProfilePage — display name", () => {
  it("renders the user's display name", async () => {
    renderPage();
    expect(await screen.findByText("Alice")).toBeInTheDocument();
  });

  it("clicking display name shows an editable input", async () => {
    renderPage();
    const nameButton = await screen.findByRole("button", { name: /edit display name/i });
    fireEvent.click(nameButton);
    expect(screen.getByRole("textbox", { name: /edit display name/i })).toBeInTheDocument();
  });

  it("saves display name on Enter key", async () => {
    let patchedName: string | undefined;
    server.use(
      http.patch(`${API_BASE}/me`, async ({ request }) => {
        const body = await request.json() as { display_name?: string };
        patchedName = body.display_name;
        return HttpResponse.json({ ...playerA, display_name: body.display_name ?? playerA.display_name });
      })
    );

    renderPage();
    const nameButton = await screen.findByRole("button", { name: /edit display name/i });
    fireEvent.click(nameButton);

    const input = screen.getByRole("textbox", { name: /edit display name/i });
    fireEvent.change(input, { target: { value: "Alicia" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(patchedName).toBe("Alicia");
    });
  });

  it("cancels edit on Escape key", async () => {
    renderPage();
    const nameButton = await screen.findByRole("button", { name: /edit display name/i });
    fireEvent.click(nameButton);

    const input = screen.getByRole("textbox", { name: /edit display name/i });
    fireEvent.change(input, { target: { value: "Something Else" } });
    fireEvent.keyDown(input, { key: "Escape" });

    // Input is gone, original name button restored
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /edit display name/i })).toBeInTheDocument();
  });

  it("does not save when name is unchanged", async () => {
    const patchSpy = vi.fn().mockResolvedValue({ ...playerA });
    server.use(
      http.patch(`${API_BASE}/me`, async () => {
        patchSpy();
        return HttpResponse.json(playerA);
      })
    );

    renderPage();
    const nameButton = await screen.findByRole("button", { name: /edit display name/i });
    fireEvent.click(nameButton);

    const input = screen.getByRole("textbox", { name: /edit display name/i });
    // Don't change the value — blur immediately
    fireEvent.blur(input);

    await waitFor(() => {
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });
    expect(patchSpy).not.toHaveBeenCalled();
  });

  it("shows error toast on save failure", async () => {
    server.use(
      http.patch(`${API_BASE}/me`, () => {
        return HttpResponse.json(
          { error: { code: "server_error", message: "Internal server error", details: null } },
          { status: 500 }
        );
      })
    );

    renderPage();
    const nameButton = await screen.findByRole("button", { name: /edit display name/i });
    fireEvent.click(nameButton);

    const input = screen.getByRole("textbox", { name: /edit display name/i });
    fireEvent.change(input, { target: { value: "New Name" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByText(/failed to update name/i)).toBeInTheDocument();
    });
  });
});

describe("ProfilePage — role badge", () => {
  it("shows the player role badge", async () => {
    renderPage();
    expect(await screen.findByText("player")).toBeInTheDocument();
  });
});

describe("ProfilePage — character link", () => {
  it("shows a character entity link", async () => {
    renderPage();
    const link = await screen.findByRole("link", { name: /my character/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", expect.stringContaining(playerA.character_id!));
  });
});

describe("ProfilePage — starred objects", () => {
  // Default: return the fixture with items
  beforeEach(() => {
    server.use(
      http.get(`${API_BASE}/me/starred`, () => {
        return HttpResponse.json(starredFixture);
      })
    );
  });

  it("renders a list of starred objects", async () => {
    renderPage();
    expect(await screen.findByText("Mira Dusk")).toBeInTheDocument();
    expect(screen.getByText("The Council")).toBeInTheDocument();
    expect(screen.getByText("The Archive")).toBeInTheDocument();
  });

  it("shows each starred item as an entity link", async () => {
    renderPage();
    const link = await screen.findByRole("link", { name: /mira dusk/i });
    expect(link).toHaveAttribute("href", "/world/characters/01CH_NPC000000000000000");
  });

  it("unstar button removes item optimistically", async () => {
    renderPage();
    await screen.findByText("Mira Dusk");

    // Find the unstar button for Mira Dusk
    const miraRow = screen.getByText("Mira Dusk").closest("li")!;
    const unstarBtn = within(miraRow).getByRole("button", { name: /remove mira dusk/i });
    fireEvent.click(unstarBtn);

    await waitFor(() => {
      expect(screen.queryByText("Mira Dusk")).not.toBeInTheDocument();
    });
  });

  it("shows empty state when no starred objects", async () => {
    // Override to return empty
    server.use(
      http.get(`${API_BASE}/me/starred`, () => {
        return HttpResponse.json({ items: [] });
      })
    );

    renderPage();
    expect(await screen.findByText(/haven't starred anything yet/i)).toBeInTheDocument();
  });

  it("shows error state on fetch failure", async () => {
    server.use(
      http.get(`${API_BASE}/me/starred`, () => {
        return HttpResponse.json(
          { error: { code: "server_error", message: "error", details: null } },
          { status: 500 }
        );
      })
    );

    renderPage();
    expect(await screen.findByText(/could not load starred objects/i)).toBeInTheDocument();
  });
});

describe("ProfilePage — refresh magic link", () => {
  it("renders the refresh link button", async () => {
    renderPage();
    expect(await screen.findByRole("button", { name: /generate new magic link/i })).toBeInTheDocument();
  });

  it("shows the new link after clicking refresh", async () => {
    renderPage();
    const btn = await screen.findByRole("button", { name: /generate new magic link/i });
    fireEvent.click(btn);

    expect(await screen.findByText(/new-rotated-code-abc123/i)).toBeInTheDocument();
  });

  it("shows copy button after generating link", async () => {
    renderPage();
    const btn = await screen.findByRole("button", { name: /generate new magic link/i });
    fireEvent.click(btn);

    expect(await screen.findByRole("button", { name: /copy magic link/i })).toBeInTheDocument();
  });

  it("shows error toast when refresh fails", async () => {
    server.use(
      http.post(`${API_BASE}/me/refresh-link`, () => {
        return HttpResponse.json(
          { error: { code: "server_error", message: "Server error", details: null } },
          { status: 500 }
        );
      })
    );

    renderPage();
    const btn = await screen.findByRole("button", { name: /generate new magic link/i });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(screen.getByText(/failed to generate a new link/i)).toBeInTheDocument();
    });
  });
});
