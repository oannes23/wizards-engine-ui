import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiFetch } from "./client";
import { ApiError } from "./errors";

describe("apiFetch", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://test-api:8000");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.unstubAllEnvs();
  });

  it("includes credentials: include on all requests", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: "test" }),
    });

    await apiFetch("/test");

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ credentials: "include" })
    );
  });

  it("throws ApiError on non-2xx response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: () =>
        Promise.resolve({
          error: {
            code: "not_found",
            message: "Not found",
            details: null,
          },
        }),
    });

    await expect(apiFetch("/missing")).rejects.toThrow(ApiError);
    try {
      await apiFetch("/missing");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
      expect((err as ApiError).code).toBe("not_found");
    }
  });

  it("handles 204 No Content", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.reject("No content"),
    });

    const result = await apiFetch("/logout");
    expect(result).toBeUndefined();
  });

  it("builds query params, omitting null/undefined", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ items: [] }),
    });

    await apiFetch("/items", {
      params: { status: "active", after: undefined, limit: 20 },
    });

    const calledUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(calledUrl).toContain("status=active");
    expect(calledUrl).toContain("limit=20");
    expect(calledUrl).not.toContain("after");
  });

  it("sets Content-Type for POST with body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ code: "test" }),
    });

    const calledInit = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(calledInit.headers["Content-Type"]).toBe("application/json");
  });
});
