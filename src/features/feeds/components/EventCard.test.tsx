import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EventCard } from "./EventCard";
import type { FeedEventItem } from "../types";

// ── Fixtures ──────────────────────────────────────────────────────

function makeEventItem(overrides?: Partial<FeedEventItem>): FeedEventItem {
  return {
    type: "event",
    id: "01EVTITEM00000000000000000",
    event_type: "proposal.approved",
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 mins ago
    narrative: "Alice used Street Rat to sneak past the guards.",
    visibility: "public",
    targets: [
      {
        type: "character",
        id: "01CHAR000000000000000000",
        is_primary: true,
      },
    ],
    is_own: false,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────

describe("EventCard", () => {
  it("renders event type badge", () => {
    render(<EventCard item={makeEventItem()} />);
    expect(screen.getByText("Proposal: Approved")).toBeInTheDocument();
  });

  it("renders narrative text", () => {
    render(<EventCard item={makeEventItem()} />);
    expect(
      screen.getByText("Alice used Street Rat to sneak past the guards.")
    ).toBeInTheDocument();
  });

  it("renders timestamp", () => {
    render(<EventCard item={makeEventItem()} />);
    // Should display relative time
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("applies own event highlight border when is_own is true", () => {
    const { container } = render(
      <EventCard item={makeEventItem({ is_own: true })} />
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("border-brand-teal");
  });

  it("does not apply own event border when is_own is false", () => {
    const { container } = render(
      <EventCard item={makeEventItem({ is_own: false })} />
    );
    const article = container.querySelector("article");
    expect(article?.className).not.toContain("border-brand-teal");
  });

  it("renders actor information when eventDetail is provided", () => {
    render(
      <EventCard
        item={makeEventItem()}
        eventDetail={{
          actor_type: "player",
          actor_name: "Alice",
          changes_summary: "Stress: 3 → 5",
          narrative: null,
          parent_event_id: null,
        }}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows expand toggle when eventDetail with changes_summary is provided", () => {
    render(
      <EventCard
        item={makeEventItem()}
        eventDetail={{
          actor_type: "gm",
          actor_name: "The GM",
          changes_summary: "Stress: 3 → 5",
          narrative: null,
          parent_event_id: null,
        }}
      />
    );
    expect(screen.getByText("Show details")).toBeInTheDocument();
  });

  it("applies isRider styling when isRider is true", () => {
    const { container } = render(
      <EventCard item={makeEventItem()} isRider />
    );
    const article = container.querySelector("article");
    expect(article?.className).toContain("ml-4");
  });

  it("handles event with no narrative", () => {
    render(<EventCard item={makeEventItem({ narrative: null })} />);
    // Should not throw, type badge should be present
    expect(screen.getByText("Proposal: Approved")).toBeInTheDocument();
  });

  it("has article role for accessibility", () => {
    render(<EventCard item={makeEventItem()} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });
});
