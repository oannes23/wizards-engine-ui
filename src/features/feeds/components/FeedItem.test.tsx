import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FeedItem } from "./FeedItem";
import type { FeedItemResponse, FeedEventItem } from "../types";

// ── Fixtures ──────────────────────────────────────────────────────

function makeEventFeedItem(
  overrides?: Partial<FeedEventItem>
): FeedEventItem {
  return {
    type: "event",
    id: "01EVTITEM00000000000000000",
    event_type: "proposal.approved",
    timestamp: new Date().toISOString(),
    narrative: "A proposal was approved.",
    visibility: "public",
    targets: [],
    is_own: false,
    ...overrides,
  };
}

const storyEntryItem: FeedItemResponse = {
  type: "story_entry",
  id: "01ENTRY000000000000000000",
  story_id: "01STORY000000000000000000",
  story_name: "The Heist",
  text: "She slipped through the shadows.",
  timestamp: new Date().toISOString(),
  author_id: "01PL_A0000000000000000000",
};

// ── Tests ─────────────────────────────────────────────────────────

describe("FeedItem", () => {
  it("renders EventCard for event items", () => {
    render(<FeedItem item={makeEventFeedItem()} />);
    expect(screen.getByText("Proposal: Approved")).toBeInTheDocument();
  });

  it("renders StoryEntryCard for story_entry items", () => {
    render(<FeedItem item={storyEntryItem} />);
    expect(
      screen.getByRole("link", { name: /The Heist/i })
    ).toBeInTheDocument();
  });

  it("shows rider toggle when riderItems are provided", () => {
    const parent = makeEventFeedItem({ id: "01PARENT00000000000000000" });
    const rider = makeEventFeedItem({
      id: "01RIDER000000000000000000",
      event_type: "clock.advanced",
    });

    render(<FeedItem item={parent} riderItems={[rider]} />);
    expect(screen.getByText("1 rider event")).toBeInTheDocument();
  });

  it("expands rider events on toggle click", () => {
    const parent = makeEventFeedItem({ id: "01PARENT00000000000000000" });
    const rider = makeEventFeedItem({
      id: "01RIDER000000000000000000",
      event_type: "clock.advanced",
      narrative: "The clock ticked forward.",
    });

    render(<FeedItem item={parent} riderItems={[rider]} />);

    // Rider narrative should not be visible yet
    expect(
      screen.queryByText("The clock ticked forward.")
    ).not.toBeInTheDocument();

    // Click the expand toggle
    fireEvent.click(screen.getByText("1 rider event"));

    // Rider narrative should now be visible
    expect(
      screen.getByText("The clock ticked forward.")
    ).toBeInTheDocument();
  });

  it("collapses rider events on second toggle click", () => {
    const parent = makeEventFeedItem({ id: "01PARENT00000000000000000" });
    const rider = makeEventFeedItem({
      id: "01RIDER000000000000000000",
      event_type: "clock.advanced",
      narrative: "The clock ticked forward.",
    });

    render(<FeedItem item={parent} riderItems={[rider]} />);
    const toggle = screen.getByText("1 rider event");

    fireEvent.click(toggle);
    expect(
      screen.getByText("The clock ticked forward.")
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText("Hide rider events"));
    expect(
      screen.queryByText("The clock ticked forward.")
    ).not.toBeInTheDocument();
  });

  it("shows plural label for multiple rider events", () => {
    const parent = makeEventFeedItem({ id: "01PARENT00000000000000000" });
    const riders = [
      makeEventFeedItem({ id: "01RIDER1000000000000000000", event_type: "clock.advanced" }),
      makeEventFeedItem({ id: "01RIDER2000000000000000000", event_type: "character.meter_updated" }),
    ];

    render(<FeedItem item={parent} riderItems={riders} />);
    expect(screen.getByText("2 rider events")).toBeInTheDocument();
  });

  it("does not show rider toggle when riderItems is empty", () => {
    render(<FeedItem item={makeEventFeedItem()} riderItems={[]} />);
    expect(screen.queryByText(/rider event/)).not.toBeInTheDocument();
  });
});
