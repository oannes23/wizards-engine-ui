import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import LoginPage from "./page";

// ── Router mock ───────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

// ── MSW server lifecycle ──────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  mockPush.mockReset();
});
afterAll(() => server.close());

// ── Helpers ───────────────────────────────────────────────────────

function renderPage() {
  return render(
    <TestProviders>
      <LoginPage />
    </TestProviders>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("LoginPage", () => {
  it("renders the sign-in form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/magic link code/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("shows validation error when code is empty", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/enter your magic link code/i);
    });
  });

  it("redirects GM to /gm on valid GM user code", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-user-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("redirects player to / on valid player code", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-player-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("redirects to /join on invite code", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-invite-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/join?code=valid-invite-code");
    });
  });

  it("shows error toast on unknown code (404)", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "bad-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/wasn't found/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("completes the submit flow without errors", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-user-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    // After completion the button should be re-enabled
    expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
  });
});
