import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { server } from "@/mocks/node";
import { TestProviders } from "@/mocks/TestProviders";
import { paginatedList } from "@/mocks/fixtures/helpers";
import { makeFeedEvent } from "@/mocks/fixtures/feeds";
import { SessionTimelineFeed } from "./SessionTimelineFeed";

const API_BASE = "http://localhost:8000/api/v1";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderTimeline(sessionId: string, isActive = false) {
  return render(
    <TestProviders>
      <SessionTimelineFeed sessionId={sessionId} isActiveSession={isActive} />
    </TestProviders>
  );
}

describe("SessionTimelineFeed", () => {
  it("renders a section with accessible label", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    renderTimeline("01SESSION000000000000000");
    expect(screen.getByRole("region", { name: "Session timeline" })).toBeInTheDocument();
  });

  it("shows loading skeleton initially", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, async () => {
        await new Promise(() => {}); // never resolves
        return HttpResponse.json(paginatedList([]));
      })
    );

    renderTimeline("01SESSION000000000000000");
    expect(screen.getByLabelText("Loading feed")).toBeInTheDocument();
  });

  it("displays events for the session", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(
          paginatedList([
            makeFeedEvent({
              id: "01EVT_SESSION0000000000000",
              narrative: "Session event occurred.",
            }),
          ])
        )
      )
    );

    renderTimeline("01SESSION000000000000000");
    expect(await screen.findByText("Session event occurred.")).toBeInTheDocument();
  });

  it("shows empty state when the session has no events", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(paginatedList([]))
      )
    );

    renderTimeline("01SESSION000000000000000");
    expect(await screen.findByText("No events in your feed yet")).toBeInTheDocument();
  });

  it("shows error state when the feed request fails", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(
          { error: { code: "server_error", message: "error" } },
          { status: 500 }
        )
      )
    );

    renderTimeline("01SESSION000000000000000");
    expect(await screen.findByText("Could not load feed")).toBeInTheDocument();
  });

  it("shows load more button when there are more pages", async () => {
    server.use(
      http.get(`${API_BASE}/me/feed`, () =>
        HttpResponse.json(
          paginatedList(
            [makeFeedEvent({ id: "01EVT_SESSION0000000000000" })],
            true // hasMore
          )
        )
      )
    );

    renderTimeline("01SESSION000000000000000");
    expect(
      await screen.findByRole("button", { name: /load more/i })
    ).toBeInTheDocument();
  });
});
