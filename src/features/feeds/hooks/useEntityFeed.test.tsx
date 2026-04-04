import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { paginatedList } from "@/mocks/fixtures/helpers";
import { makeFeedEvent } from "@/mocks/fixtures/feeds";
import { useGroupFeed, useLocationFeed } from "./useEntityFeed";
import type { ReactNode } from "react";

const API_BASE = "http://localhost:8000/api/v1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  return <TestProviders>{children}</TestProviders>;
}

// ── useGroupFeed ──────────────────────────────────────────────────────

describe("useGroupFeed", () => {
  it("fetches group feed events successfully", async () => {
    const groupId = "01GROUP00000000000000000";
    server.use(
      http.get(`${API_BASE}/groups/${groupId}/feed`, () =>
        HttpResponse.json(
          paginatedList([
            makeFeedEvent({ id: "01EVT_GROUP000000000000000", narrative: "Group event." }),
          ])
        )
      )
    );

    const { result } = renderHook(() => useGroupFeed(groupId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items[0].narrative).toBe("Group event.");
  });

  it("is disabled when groupId is null", () => {
    const { result } = renderHook(() => useGroupFeed(null), { wrapper });
    // Query should not be loading when disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("is disabled when groupId is undefined", () => {
    const { result } = renderHook(() => useGroupFeed(undefined), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("is disabled when groupId is an empty string", () => {
    const { result } = renderHook(() => useGroupFeed(""), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("returns has_more pagination information", async () => {
    const groupId = "01GROUP00000000000000000";
    server.use(
      http.get(`${API_BASE}/groups/${groupId}/feed`, () =>
        HttpResponse.json(
          paginatedList(
            [makeFeedEvent({ id: "01EVT_GROUP000000000000000" })],
            true
          )
        )
      )
    );

    const { result } = renderHook(() => useGroupFeed(groupId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });
});

// ── useLocationFeed ───────────────────────────────────────────────────

describe("useLocationFeed", () => {
  it("fetches location feed events successfully", async () => {
    const locationId = "01LOC00000000000000000000";
    server.use(
      http.get(`${API_BASE}/locations/${locationId}/feed`, () =>
        HttpResponse.json(
          paginatedList([
            makeFeedEvent({
              id: "01EVT_LOC00000000000000000",
              narrative: "Location event.",
            }),
          ])
        )
      )
    );

    const { result } = renderHook(() => useLocationFeed(locationId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.pages[0].items[0].narrative).toBe("Location event.");
  });

  it("is disabled when locationId is null", () => {
    const { result } = renderHook(() => useLocationFeed(null), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("is disabled when locationId is undefined", () => {
    const { result } = renderHook(() => useLocationFeed(undefined), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("returns has_more pagination information", async () => {
    const locationId = "01LOC00000000000000000000";
    server.use(
      http.get(`${API_BASE}/locations/${locationId}/feed`, () =>
        HttpResponse.json(
          paginatedList(
            [makeFeedEvent({ id: "01EVT_LOC00000000000000000" })],
            true
          )
        )
      )
    );

    const { result } = renderHook(() => useLocationFeed(locationId), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(true);
  });
});
