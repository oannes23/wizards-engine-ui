import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import SetupPage from "./page";

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
      <SetupPage />
    </TestProviders>
  );
}

// ── Tests ─────────────────────────────────────────────────────────

describe("SetupPage", () => {
  it("renders the setup form", () => {
    renderPage();
    expect(screen.getByRole("heading", { name: /game master setup/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create gm account/i })).toBeInTheDocument();
  });

  it("shows validation error when display name is empty", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/display name is required/i);
    });
  });

  it("redirects to /gm on successful setup", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "The Dungeon Master" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("shows error toast on 409 already-setup response", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "already-setup" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));
    await waitFor(() => {
      expect(screen.getByText(/already been set up/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("completes the submit flow without errors", async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "New GM" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));
    await waitFor(() => expect(mockPush).toHaveBeenCalled());
    // After completion the button should be re-enabled
    expect(screen.getByRole("button", { name: /create gm account/i })).not.toBeDisabled();
  });
});
