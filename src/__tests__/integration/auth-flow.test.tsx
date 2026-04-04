/**
 * Integration tests: auth-flow
 *
 * Full page rendering through MSW for every auth scenario described in
 * spec/architecture/auth.md and the Priority 1 critical test scenarios
 * from spec/testing/strategy.md.
 *
 * Each describe block maps to one auth journey. Tests render real page
 * components through TestProviders so all React hooks, form logic, and
 * toast wiring is exercised together.
 */
import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { gmUser, playerA } from "@/mocks/fixtures/users";
import LoginPage from "@/app/(auth)/login/page";
import LoginCodePage from "@/app/(auth)/login/[code]/page";
import SetupPage from "@/app/(auth)/setup/page";
import JoinPage from "@/app/(auth)/join/page";

// ── Constants ──────────────────────────────────────────────────────

const API_BASE = "http://localhost:8000/api/v1";

// ── Router / params mocks ──────────────────────────────────────────

const mockPush = vi.fn();
let mockCode = "valid-user-code";
let mockSearchParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ code: mockCode }),
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams[key] ?? null,
  }),
}));

// ── MSW server lifecycle ───────────────────────────────────────────

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  mockPush.mockReset();
  mockCode = "valid-user-code";
  mockSearchParams = {};
});
afterAll(() => server.close());

// ── Helpers ────────────────────────────────────────────────────────

function renderLogin() {
  return render(
    <TestProviders>
      <LoginPage />
    </TestProviders>
  );
}

function renderLoginCode() {
  return render(
    <TestProviders>
      <LoginCodePage />
    </TestProviders>
  );
}

function renderSetup() {
  return render(
    <TestProviders>
      <SetupPage />
    </TestProviders>
  );
}

function renderJoin() {
  return render(
    <TestProviders>
      <JoinPage />
    </TestProviders>
  );
}

// ── Journey 1: Manual login form ───────────────────────────────────

describe("auth-flow: manual login form", () => {
  it("GM enters valid code and is redirected to /gm", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-user-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("player enters valid code and is redirected to /", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-player-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("invite code redirects to /join with code query param", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "valid-invite-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/join?code=valid-invite-code");
    });
  });

  it("unknown code shows error toast and does not redirect", async () => {
    renderLogin();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "bad-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/wasn't found/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("empty code shows inline validation error without hitting the API", async () => {
    // Replace the login handler with a spy so we can detect if it fires
    let apiCalled = false;
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        apiCalled = true;
        return HttpResponse.json({});
      })
    );

    renderLogin();
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/enter your magic link code/i);
    });
    expect(apiCalled).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("viewer code redirects to /gm", async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json({
          id: "01VW000000000000000000000",
          display_name: "Viewer",
          role: "viewer",
          character_id: null,
        });
      })
    );

    renderLogin();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "viewer-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("network error shows generic error toast and does not redirect", async () => {
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        return HttpResponse.json(
          { error: { code: "server_error", message: "Server error", details: null } },
          { status: 500 }
        );
      })
    );

    renderLogin();
    fireEvent.change(screen.getByLabelText(/magic link code/i), {
      target: { value: "some-code" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));
    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Journey 2: Magic link deep-link auto-submit ────────────────────

describe("auth-flow: magic link deep-link (/login/[code])", () => {
  it("auto-submits GM code on mount and redirects to /gm", async () => {
    mockCode = "valid-user-code";
    renderLoginCode();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("auto-submits player code on mount and redirects to /", async () => {
    mockCode = "valid-player-code";
    renderLoginCode();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("auto-submits invite code and redirects to /join", async () => {
    mockCode = "valid-invite-code";
    renderLoginCode();
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/join?code=valid-invite-code");
    });
  });

  it("shows branded loading state on mount before API resolves", () => {
    // Slow the API so we can observe the loading state
    server.use(
      http.post(`${API_BASE}/auth/login`, async () => {
        await new Promise((r) => setTimeout(r, 500));
        return HttpResponse.json(gmUser);
      })
    );

    mockCode = "valid-user-code";
    renderLoginCode();
    expect(screen.getByRole("status")).toHaveTextContent(/signing in/i);
  });

  it("shows error heading and retry link on invalid code", async () => {
    mockCode = "bad-code";
    renderLoginCode();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /sign-in failed/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /enter code manually/i })
    ).toHaveAttribute("href", "/login");
  });

  it("auto-submits exactly once even on StrictMode double-mount", async () => {
    mockCode = "valid-user-code";
    let callCount = 0;
    server.use(
      http.post(`${API_BASE}/auth/login`, () => {
        callCount++;
        return HttpResponse.json(gmUser);
      })
    );

    renderLoginCode();
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    expect(callCount).toBe(1);
  });
});

// ── Journey 3: First-time GM setup ────────────────────────────────

describe("auth-flow: GM setup (/setup)", () => {
  it("successful setup redirects to /gm", async () => {
    renderSetup();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "The Dungeon Master" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/gm");
    });
  });

  it("empty display name shows inline validation without hitting the API", async () => {
    let apiCalled = false;
    server.use(
      http.post(`${API_BASE}/setup`, () => {
        apiCalled = true;
        return HttpResponse.json({});
      })
    );

    renderSetup();
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/display name is required/i);
    });
    expect(apiCalled).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("409 (GM already exists) shows error toast and does not redirect", async () => {
    renderSetup();
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: "already-setup" },
    });
    fireEvent.click(screen.getByRole("button", { name: /create gm account/i }));
    await waitFor(() => {
      expect(screen.getByText(/already been set up/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Journey 4: Player/viewer invite redemption ─────────────────────

describe("auth-flow: join flow (/join?code=...)", () => {
  it("no-code state: shows error page with link to /login", () => {
    mockSearchParams = {};
    renderJoin();
    expect(
      screen.getByRole("heading", { name: /no invite code/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /go to sign in/i })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("valid invite: submits display_name + character_name, redirects to /", async () => {
    mockSearchParams = { code: "valid-invite-code" };
    renderJoin();
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

  it("viewer invite: submits without character_name, still redirects to /", async () => {
    mockSearchParams = { code: "valid-invite-code" };
    renderJoin();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Silent Observer" },
    });
    // Leave character_name blank
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  it("empty display_name shows inline validation without API call", async () => {
    mockSearchParams = { code: "valid-invite-code" };
    let apiCalled = false;
    server.use(
      http.post(`${API_BASE}/game/join`, () => {
        apiCalled = true;
        return HttpResponse.json(playerA);
      })
    );

    renderJoin();
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(/display name is required/i);
    });
    expect(apiCalled).toBe(false);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("404 (invalid invite code) shows toast and does not redirect", async () => {
    mockSearchParams = { code: "invalid-invite" };
    renderJoin();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid or has already been used/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("409 (invite already consumed) shows toast and does not redirect", async () => {
    mockSearchParams = { code: "consumed-invite" };
    renderJoin();
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Alice" },
    });
    fireEvent.click(screen.getByRole("button", { name: /join game/i }));
    await waitFor(() => {
      expect(screen.getByText(/already been redeemed/i)).toBeInTheDocument();
    });
    expect(mockPush).not.toHaveBeenCalled();
  });
});

// ── Journey 5: Middleware cookie checks (fast path) ────────────────

describe("auth-flow: middleware cookie enforcement", () => {
  // These are unit tests on the middleware function imported directly.
  // They live here for proximity to the auth-flow story, even though they
  // don't render React components. The middleware.test.ts covers the same
  // ground in unit-test form; this set focuses on the cross-cutting spec
  // requirements (public vs protected) from a user-journey framing.

  it("public routes are always reachable (no cookie required)", async () => {
    const { middleware } = await import("@/middleware");

    for (const path of ["/login", "/login/abc123", "/setup", "/join"]) {
      const req = {
        nextUrl: { pathname: path },
        url: `http://localhost:3000${path}`,
        cookies: { get: () => undefined },
      } as unknown as Parameters<typeof middleware>[0];

      const res = middleware(req);
      expect(
        res.headers?.get("Location"),
        `Expected ${path} to be public (no redirect), but got Location header`
      ).toBeNull();
    }
  });

  it("protected routes redirect to /login when cookie is absent", async () => {
    const { middleware } = await import("@/middleware");

    for (const path of ["/", "/profile", "/character", "/gm", "/gm/feed"]) {
      const req = {
        nextUrl: { pathname: path },
        url: `http://localhost:3000${path}`,
        cookies: { get: () => undefined },
      } as unknown as Parameters<typeof middleware>[0];

      const res = middleware(req);
      const location = res.headers?.get("Location");
      expect(
        location,
        `Expected ${path} to redirect to /login when unauthenticated`
      ).not.toBeNull();

      const redirectPath = new URL(location!).pathname;
      expect(redirectPath).toBe("/login");
    }
  });

  it("protected routes pass through when login_code cookie is present", async () => {
    const { middleware } = await import("@/middleware");

    for (const path of ["/", "/profile", "/gm", "/gm/feed"]) {
      const req = {
        nextUrl: { pathname: path },
        url: `http://localhost:3000${path}`,
        cookies: {
          get: (name: string) =>
            name === "login_code" ? { name, value: "some-code" } : undefined,
        },
      } as unknown as Parameters<typeof middleware>[0];

      const res = middleware(req);
      expect(
        res.headers?.get("Location"),
        `Expected ${path} to allow through with cookie present`
      ).toBeNull();
    }
  });
});
