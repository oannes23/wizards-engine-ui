import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders, createTestQueryClient } from "@/mocks/TestProviders";
import { playerA, gmUser } from "@/mocks/fixtures/users";
import { makeStory } from "@/mocks/fixtures/world";
import StoryDetailPage from "./page";

// ── Mocks ──────────────────────────────────────────────────────────

let mockStoryId = "story-01";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({ id: mockStoryId }),
}));

let mockAuthState = {
  user: playerA,
  isLoading: false,
  isGm: false,
  isPlayer: true,
  isViewer: false,
  canViewGmContent: false,
  canTakeGmActions: false,
  characterId: playerA.character_id,
  logout: vi.fn(),
};

vi.mock("@/lib/auth/useAuth", () => ({
  useAuth: () => mockAuthState,
}));

// ── Server lifecycle ────────────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => {
  server.resetHandlers();
  mockStoryId = "story-01";
  mockAuthState = {
    user: playerA,
    isLoading: false,
    isGm: false,
    isPlayer: true,
    isViewer: false,
    canViewGmContent: false,
    canTakeGmActions: false,
    characterId: playerA.character_id,
    logout: vi.fn(),
  };
});
afterAll(() => server.close());

// ── Helpers ────────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

/**
 * Render the page with a fresh query client to avoid cache pollution between tests.
 */
function renderPage() {
  const queryClient = createTestQueryClient();
  return render(
    <TestProviders queryClient={queryClient}>
      <StoryDetailPage />
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("StoryDetailPage", () => {
  it("renders story name and status badge", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
    });
    expect(screen.getByText("active")).toBeInTheDocument();
  });

  it("renders story tags", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("investigation")).toBeInTheDocument();
    });
    expect(screen.getByText("intrigue")).toBeInTheDocument();
  });

  it("renders story summary", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText("A web of intrigue threatens the city")
      ).toBeInTheDocument();
    });
  });

  it("renders existing entries newest first", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByText("We discovered the first clue at the docks.")
      ).toBeInTheDocument();
    });
    expect(
      screen.getByText("The merchant revealed the location of the safehouse.")
    ).toBeInTheDocument();

    // Newer entry (second in fixture with later date) should appear before older one
    const allText = document.body.textContent ?? "";
    const newerPos = allText.indexOf("The merchant revealed");
    const olderPos = allText.indexOf("We discovered the first clue");
    expect(newerPos).toBeLessThan(olderPos);
  });

  it("renders the entry input textarea", async () => {
    renderPage();
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText("Write an entry...")
      ).toBeInTheDocument();
    });
  });

  it("renders the Add Entry button disabled when textarea is empty", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
    });
    const button = screen.getByRole("button", { name: /Add Entry/i });
    expect(button).toBeDisabled();
  });

  it("enables Add Entry button when text is entered", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Write an entry...")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write an entry...");
    fireEvent.change(textarea, { target: { value: "A new entry about the investigation" } });

    const button = screen.getByRole("button", { name: /Add Entry/i });
    expect(button).toBeEnabled();
  });

  it("submits a new entry and clears the textarea", async () => {
    server.use(
      http.post(`${API_BASE}/stories/:id/entries`, async ({ request }) => {
        const body = (await request.json()) as { text: string };
        return HttpResponse.json({
          id: "new-entry-id",
          text: body.text,
          author_id: playerA.id,
          character_id: playerA.character_id,
          session_id: null,
          created_at: new Date().toISOString(),
        }, { status: 201 });
      })
    );

    renderPage();

    await waitFor(() => {
      expect(screen.getByPlaceholderText("Write an entry...")).toBeInTheDocument();
    });

    const textarea = screen.getByPlaceholderText("Write an entry...");
    fireEvent.change(textarea, { target: { value: "My new entry text" } });

    const button = screen.getByRole("button", { name: /Add Entry/i });
    await act(async () => {
      fireEvent.click(button);
    });

    // Textarea should clear after successful submit (mutation onSuccess)
    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("shows loading skeleton before data arrives", () => {
    server.use(
      http.get(`${API_BASE}/stories/:id`, async () => {
        await new Promise((r) => setTimeout(r, 500));
        return HttpResponse.json(makeStory());
      })
    );

    renderPage();
    // Loading skeleton should be visible before data loads
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("shows empty state when story is not found (404)", async () => {
    server.use(
      http.get(`${API_BASE}/stories/:id`, () =>
        HttpResponse.json(
          { error: { code: "not_found", message: "Not found" } },
          { status: 404 }
        )
      )
    );

    renderPage();
    await waitFor(() => {
      expect(screen.getByText("Story not found")).toBeInTheDocument();
    });
  });

  it("shows a back link to world page", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
    });
    const backLink = screen.getByRole("link", { name: /Stories/i });
    expect(backLink).toHaveAttribute("href", "/world?tab=stories");
  });

  it("shows entries section header", async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
    });
    expect(screen.getByText(/Entries/i)).toBeInTheDocument();
  });

  describe("parent link", () => {
    it("shows parent link when story has a parent", async () => {
      server.use(
        http.get(`${API_BASE}/stories/:id`, ({ params }) => {
          const { id } = params as { id: string };
          return HttpResponse.json(makeStory({ id, parent_id: "parent-story-01" }));
        })
      );

      renderPage();
      await waitFor(() => {
        expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
      });

      const parentLink = screen.getByRole("link", { name: /Parent Story/i });
      expect(parentLink).toHaveAttribute("href", "/world/stories/parent-story-01");
    });

    it("does not show parent link when story has no parent", async () => {
      renderPage();
      await waitFor(() => {
        expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
      });
      expect(screen.queryByRole("link", { name: /Parent Story/i })).not.toBeInTheDocument();
    });
  });

  describe("entry interactions for GM role", () => {
    beforeEach(() => {
      mockAuthState = {
        user: gmUser,
        isLoading: false,
        isGm: true,
        isPlayer: false,
        isViewer: false,
        canViewGmContent: true,
        canTakeGmActions: true,
        characterId: null,
        logout: vi.fn(),
      };
    });

    it("shows edit buttons for GM on entries", async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getByText("We discovered the first clue at the docks.")
        ).toBeInTheDocument();
      });
      const editButtons = screen.getAllByRole("button", { name: /Edit entry/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });

    it("shows delete buttons for GM on entries", async () => {
      renderPage();
      await waitFor(() => {
        expect(
          screen.getByText("We discovered the first clue at the docks.")
        ).toBeInTheDocument();
      });
      const deleteButtons = screen.getAllByRole("button", { name: /Delete entry/i });
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  describe("player cannot edit entries by other users", () => {
    it("does not show edit buttons for entries by other users", async () => {
      server.use(
        http.get(`${API_BASE}/stories/:id`, ({ params }) => {
          const { id } = params as { id: string };
          return HttpResponse.json(
            makeStory({
              id,
              entries: [
                {
                  id: "entry-by-other",
                  text: "Entry by another player",
                  author_id: "some-other-user-id",
                  character_id: null,
                  session_id: null,
                  created_at: "2026-01-01T00:00:00Z",
                },
              ],
            })
          );
        })
      );

      renderPage();
      await waitFor(() => {
        expect(screen.getByText("Entry by another player")).toBeInTheDocument();
      });

      expect(screen.queryByRole("button", { name: /Edit entry/i })).not.toBeInTheDocument();
    });
  });
});
