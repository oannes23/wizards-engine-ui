import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import JoinPage from "./page";

// ── Router / params mocks ─────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
}));

// Mutable so individual tests can change the query param
let mockSearchParams: Record<string, string> = { code: "valid-invite-code" };

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  mockPush.mockReset();
  mockSearchParams = { code: "valid-invite-code" };
});
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <JoinPage />
    </TestProviders>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("JoinPage — with code", () => {
  it("renders the join form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /join the game/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/character name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /join game/i })).toBeInTheDocument();
  });

  it("shows validation error when display name is empty", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/display name is required/i);
    });
  });

  it("submits with display_name and character_name, then redirects to /", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.change(screen.getByLabelText(/character name/i), {
      target: { value: "Seraphine" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("submits successfully without character name (viewer invite)", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Bob the Viewer" },
    });
    // Leave character_name empty
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("shows error toast on 404 invalid invite", async () => {
    mockSearchParams = { code: "invalid-invite" };
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid or has already been used/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows error toast on 409 consumed invite", async () => {
    mockSearchParams = { code: "consumed-invite" };
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(screen.getByText(/already been redeemed/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("completes the submit flow without errors", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    // After completion the button should be re-enabled
    expect(screen.getByRole("button", { name: /join game/i })).not.toBeDisabled();
  });
});

describe("JoinPage — without code", () => {
  it("shows no-invite-code state when no code param", () => {
    mockSearchParams = {};
    renderPage();
    expect(screen.getByRole("heading", { name: /no invite code/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to sign in/i })).toBeInTheDocument();
  });
});
