import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StoryEntryCard } from "./StoryEntryCard";
import type { FeedStoryEntryItem } from "../types";

// ── Fixtures ──────────────────────────────────────────────────────

function makeStoryEntry(
  overrides?: Partial<FeedStoryEntryItem>
): FeedStoryEntryItem {
  return {
    type: "story_entry",
    id: "01ENTRY000000000000000000",
    story_id: "01STORY000000000000000000",
    story_name: "The Heist",
    text: "In the shadows of the vault, she waited for her moment.",
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago
    author_id: "01PL_A0000000000000000000",
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────

describe("StoryEntryCard", () => {
  it("renders the story name as a link", () => {
    render(<StoryEntryCard item={makeStoryEntry()} />);
    const link = screen.getByRole("link", { name: /The Heist/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      "href",
      "/world/stories/01STORY000000000000000000"
    );
  });

  it("renders entry text", () => {
    render(<StoryEntryCard item={makeStoryEntry()} />);
    expect(
      screen.getByText(
        "In the shadows of the vault, she waited for her moment."
      )
    ).toBeInTheDocument();
  });

  it("renders author name when provided", () => {
    render(<StoryEntryCard item={makeStoryEntry()} authorName="Alice" />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("does not render author section when authorName is omitted", () => {
    render(<StoryEntryCard item={makeStoryEntry()} />);
    // Author element should not be present
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("renders relative timestamp", () => {
    render(<StoryEntryCard item={makeStoryEntry()} />);
    expect(screen.getByText("10m ago")).toBeInTheDocument();
  });

  it("has article role for accessibility", () => {
    render(<StoryEntryCard item={makeStoryEntry()} />);
    expect(screen.getByRole("article")).toBeInTheDocument();
  });

  it("article has accessible label", () => {
    render(<StoryEntryCard item={makeStoryEntry()} />);
    const article = screen.getByRole("article");
    expect(article).toHaveAttribute(
      "aria-label",
      "Story entry in The Heist"
    );
  });
});
