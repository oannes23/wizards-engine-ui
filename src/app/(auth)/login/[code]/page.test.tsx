import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import LoginCodePage from "./page";

// ── Router / params mocks ─────────────────────────────────────────

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ code: mockCode }),
}));

// Mutable so individual tests can change the code
let mockCode = "valid-user-code";

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  mockPush.mockReset();
  mockCode = "valid-user-code";
});
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <LoginCodePage />
    </TestProviders>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("LoginCodePage", () => {
  it("shows a loading state on mount", () => {
    renderPage();
    expect(screen.getByRole("status")).toHaveTextContent(/signing in/i);
  });

  it("auto-submits and redirects GM to /gm", async () => {
    mockCode = "valid-user-code";
    renderPage();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("auto-submits and redirects player to /", async () => {
    mockCode = "valid-player-code";
    renderPage();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("redirects to /join on invite code", async () => {
    mockCode = "valid-invite-code";
    renderPage();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/join?code=valid-invite-code");
    });
  });

  it("shows an error state on invalid code (404)", async () => {
    mockCode = "bad-code";
    renderPage();
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /sign-in failed/i })).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /enter code manually/i })).toBeInTheDocument();
  });

  it("does not submit the login request twice (StrictMode / remounts)", async () => {
    mockCode = "valid-user-code";
    renderPage();
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
  });
});
