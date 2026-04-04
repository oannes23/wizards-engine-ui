/**
 * Component tests: BreadcrumbNav
 *
 * Covers:
 * - Empty ancestors renders nothing
 * - Single ancestor renders link + current item
 * - Multiple ancestors render all links + current item
 * - Deep hierarchy (> 4 levels) truncates middle with ellipsis
 * - Clicking ellipsis expands full path
 * - Current item is not a link (aria-current="page")
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TestProviders } from "@/mocks/TestProviders";
import { BreadcrumbNav, type BreadcrumbItem } from "./BreadcrumbNav";

function renderBreadcrumb(ancestors: BreadcrumbItem[], current: string) {
  return render(
    <TestProviders>
      <BreadcrumbNav ancestors={ancestors} current={current} />
    </TestProviders>
  );
}

// ── Edge cases ─────────────────────────────────────────────────────

describe("BreadcrumbNav: edge cases", () => {
  it("renders nothing when ancestors array is empty", () => {
    const { container } = renderBreadcrumb([], "The Docks");
    expect(container.firstChild).toBeNull();
  });
});

// ── Basic rendering ────────────────────────────────────────────────

describe("BreadcrumbNav: basic rendering", () => {
  it("renders single ancestor as a link", () => {
    renderBreadcrumb(
      [{ id: "city-1", name: "The City", href: "/world/locations/city-1" }],
      "Harbor District"
    );
    const cityLink = screen.getByRole("link", { name: "The City" });
    expect(cityLink).toHaveAttribute("href", "/world/locations/city-1");
  });

  it("renders current item as plain text (not a link)", () => {
    renderBreadcrumb(
      [{ id: "city-1", name: "The City", href: "/world/locations/city-1" }],
      "Harbor District"
    );
    // Current item should not be a link
    expect(screen.queryByRole("link", { name: "Harbor District" })).toBeNull();
    // But it should be visible as text
    expect(screen.getByText("Harbor District")).toBeInTheDocument();
  });

  it("marks current item with aria-current='page'", () => {
    renderBreadcrumb(
      [{ id: "city-1", name: "The City", href: "/world/locations/city-1" }],
      "Harbor District"
    );
    const current = screen.getByText("Harbor District");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders multiple ancestors as links", () => {
    renderBreadcrumb(
      [
        { id: "city-1", name: "The City", href: "/world/locations/city-1" },
        { id: "harbor-1", name: "Harbor District", href: "/world/locations/harbor-1" },
      ],
      "The Docks"
    );
    expect(screen.getByRole("link", { name: "The City" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Harbor District" })).toBeInTheDocument();
    expect(screen.getByText("The Docks")).toBeInTheDocument();
  });

  it("renders a nav element with breadcrumb aria-label", () => {
    renderBreadcrumb(
      [{ id: "city-1", name: "The City", href: "/world/locations/city-1" }],
      "Harbor District"
    );
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
  });
});

// ── Truncation ─────────────────────────────────────────────────────

describe("BreadcrumbNav: truncation for deep hierarchies", () => {
  const deepAncestors: BreadcrumbItem[] = [
    { id: "world-1", name: "World", href: "/world/locations/world-1" },
    { id: "continent-1", name: "Continent", href: "/world/locations/continent-1" },
    { id: "country-1", name: "Country", href: "/world/locations/country-1" },
    { id: "city-1", name: "City", href: "/world/locations/city-1" },
    { id: "district-1", name: "District", href: "/world/locations/district-1" },
  ];

  it("shows ellipsis when depth > 4 total", () => {
    renderBreadcrumb(deepAncestors, "The Alley");
    expect(screen.getByRole("button", { name: /show full path/i })).toBeInTheDocument();
  });

  it("hides middle ancestors when truncated", () => {
    renderBreadcrumb(deepAncestors, "The Alley");
    // Middle ancestors should not be visible
    expect(screen.queryByRole("link", { name: "Continent" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Country" })).toBeNull();
  });

  it("shows first ancestor and last two ancestors when truncated", () => {
    renderBreadcrumb(deepAncestors, "The Alley");
    // First ancestor visible
    expect(screen.getByRole("link", { name: "World" })).toBeInTheDocument();
    // Last two ancestors visible
    expect(screen.getByRole("link", { name: "City" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "District" })).toBeInTheDocument();
  });

  it("clicking ellipsis expands the full path", () => {
    renderBreadcrumb(deepAncestors, "The Alley");
    fireEvent.click(screen.getByRole("button", { name: /show full path/i }));
    // All ancestors now visible
    expect(screen.getByRole("link", { name: "World" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continent" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Country" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "City" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "District" })).toBeInTheDocument();
    expect(screen.getByText("The Alley")).toBeInTheDocument();
  });

  it("ellipsis button is gone after expanding", () => {
    renderBreadcrumb(deepAncestors, "The Alley");
    fireEvent.click(screen.getByRole("button", { name: /show full path/i }));
    expect(
      screen.queryByRole("button", { name: /show full path/i })
    ).not.toBeInTheDocument();
  });

  it("does not truncate when depth is exactly 4", () => {
    const shallowAncestors: BreadcrumbItem[] = [
      { id: "city-1", name: "The City", href: "/world/locations/city-1" },
      { id: "district-1", name: "District", href: "/world/locations/district-1" },
      { id: "harbor-1", name: "Harbor", href: "/world/locations/harbor-1" },
    ];
    renderBreadcrumb(shallowAncestors, "The Docks");
    // No ellipsis at depth 4 (3 ancestors + 1 current)
    expect(
      screen.queryByRole("button", { name: /show full path/i })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "The City" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "District" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Harbor" })).toBeInTheDocument();
  });
});
