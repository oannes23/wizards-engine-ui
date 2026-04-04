import { describe, it, expect, vi } from "vitest";
import { middleware } from "./middleware";
import type { NextRequest } from "next/server";

// ── Minimal mock of NextRequest ────────────────────────────────────

function makeRequest(pathname: string, hasCookie = false): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    cookies: {
      get: (name: string) =>
        name === "login_code" && hasCookie ? { name, value: "some-code" } : undefined,
    },
  } as unknown as NextRequest;
}

// ── Helpers ────────────────────────────────────────────────────────

function getRedirectPath(req: NextRequest): string | null {
  const res = middleware(req);
  const location = res.headers?.get("Location") ?? null;
  if (!location) return null;
  try {
    return new URL(location).pathname;
  } catch {
    return location;
  }
}

function isNextResponse(req: NextRequest): boolean {
  // NextResponse.next() has no Location header
  const res = middleware(req);
  return !res.headers?.get("Location");
}

// ── Tests ──────────────────────────────────────────────────────────

describe("middleware — public routes", () => {
  it("allows /login without cookie", () => {
    const req = makeRequest("/login", false);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /login/some-code without cookie", () => {
    const req = makeRequest("/login/abc123", false);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /setup without cookie", () => {
    const req = makeRequest("/setup", false);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /join without cookie", () => {
    const req = makeRequest("/join", false);
    expect(isNextResponse(req)).toBe(true);
  });
});

describe("middleware — static assets", () => {
  it("allows /_next paths", () => {
    const req = makeRequest("/_next/static/chunk.js", false);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows paths with file extensions", () => {
    const req = makeRequest("/logo.png", false);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /api paths", () => {
    const req = makeRequest("/api/v1/me", false);
    expect(isNextResponse(req)).toBe(true);
  });
});

describe("middleware — protected routes without cookie", () => {
  it("redirects / to /login when no cookie", () => {
    const req = makeRequest("/", false);
    expect(getRedirectPath(req)).toBe("/login");
  });

  it("redirects /profile to /login when no cookie", () => {
    const req = makeRequest("/profile", false);
    expect(getRedirectPath(req)).toBe("/login");
  });

  it("redirects /character to /login when no cookie", () => {
    const req = makeRequest("/character", false);
    expect(getRedirectPath(req)).toBe("/login");
  });

  it("redirects /gm to /login when no cookie", () => {
    const req = makeRequest("/gm", false);
    expect(getRedirectPath(req)).toBe("/login");
  });

  it("redirects /gm/feed to /login when no cookie", () => {
    const req = makeRequest("/gm/feed", false);
    expect(getRedirectPath(req)).toBe("/login");
  });

  it("redirects /proposals to /login when no cookie", () => {
    const req = makeRequest("/proposals", false);
    expect(getRedirectPath(req)).toBe("/login");
  });
});

describe("middleware — protected routes with cookie", () => {
  it("allows / when cookie present", () => {
    const req = makeRequest("/", true);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /profile when cookie present", () => {
    const req = makeRequest("/profile", true);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /gm when cookie present", () => {
    const req = makeRequest("/gm", true);
    expect(isNextResponse(req)).toBe(true);
  });

  it("allows /gm/feed when cookie present", () => {
    const req = makeRequest("/gm/feed", true);
    expect(isNextResponse(req)).toBe(true);
  });
});
