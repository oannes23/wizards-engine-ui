import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedList } from "./FeedList";
import type { FeedItemResponse } from "../types";
import type { InfiniteData } from "@tanstack/react-query";
import type { PaginatedResponse } from "@/lib/api/types";

// ── Fixtures ──────────────────────────────────────────────────────

function makeEventItem(id: string): FeedItemResponse {
  return {
    type: "event",
    id,
    event_type: "proposal.approved",
    timestamp: new Date().toISOString(),
    narrative: `Event ${id}`,
    visibility: "public",
    targets: [],
    is_own: false,
  };
}

function makeInfiniteData(
  items: FeedItemResponse[],
  hasMore = false
): InfiniteData<PaginatedResponse<FeedItemResponse>> {
  return {
    pages: [
      {
        items,
        next_cursor: hasMore ? "01CURSOR00000000000000000" : null,
        has_more: hasMore,
      },
    ],
    pageParams: [undefined],
  };
}

// ── Tests ─────────────────────────────────────────────────────────

describe("FeedList", () => {
  const baseProps = {
    isLoading: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: vi.fn(),
    isError: false,
  };

  it("shows loading skeleton when isLoading is true", () => {
    render(<FeedList {...baseProps} data={undefined} isLoading />);
    expect(screen.getByLabelText("Loading feed")).toBeInTheDocument();
  });

  it("shows empty state when there are no items", () => {
    render(
      <FeedList
        {...baseProps}
        data={makeInfiniteData([])}
      />
    );
    expect(
      screen.getByText("No events in your feed yet")
    ).toBeInTheDocument();
  });

  it("renders feed items", () => {
    const items = [
      makeEventItem("01EVT_A000000000000000000"),
      makeEventItem("01EVT_B000000000000000000"),
    ];
    render(
      <FeedList
        {...baseProps}
        data={makeInfiniteData(items)}
      />
    );

    // Two event cards with narratives
    expect(
      screen.getByText(`Event 01EVT_A000000000000000000`)
    ).toBeInTheDocument();
    expect(
      screen.getByText(`Event 01EVT_B000000000000000000`)
    ).toBeInTheDocument();
  });

  it("shows load more button when hasNextPage is true", () => {
    const items = [makeEventItem("01EVT_A000000000000000000")];
    render(
      <FeedList
        {...baseProps}
        data={makeInfiniteData(items, true)}
        hasNextPage
      />
    );
    expect(
      screen.getByRole("button", { name: /load more/i })
    ).toBeInTheDocument();
  });

  it("calls fetchNextPage when load more is clicked", () => {
    const fetchNextPage = vi.fn();
    const items = [makeEventItem("01EVT_A000000000000000000")];
    render(
      <FeedList
        {...baseProps}
        data={makeInfiniteData(items, true)}
        hasNextPage
        fetchNextPage={fetchNextPage}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(fetchNextPage).toHaveBeenCalledOnce();
  });

  it("does not show load more button when hasNextPage is false", () => {
    const items = [makeEventItem("01EVT_A000000000000000000")];
    render(
      <FeedList
        {...baseProps}
        data={makeInfiniteData(items, false)}
        hasNextPage={false}
      />
    );
    expect(
      screen.queryByRole("button", { name: /load more/i })
    ).not.toBeInTheDocument();
  });

  it("shows error state when isError is true", () => {
    render(
      <FeedList
        {...baseProps}
        data={undefined}
        isError
      />
    );
    expect(screen.getByText("Could not load feed")).toBeInTheDocument();
  });

  it("renders feed as an ordered list for accessibility", () => {
    const items = [makeEventItem("01EVT_A000000000000000000")];
    render(
      <FeedList
        {...baseProps}
        data={makeInfiniteData(items)}
      />
    );
    expect(screen.getByRole("list", { name: "Feed" })).toBeInTheDocument();
  });
});
