/**
 * Component tests: PresenceTiers
 *
 * Covers:
 * - Empty presence (all tiers empty) shows fallback text
 * - Non-empty tiers render tier labels and entity names
 * - Empty tiers are hidden
 * - Tier opacity classes are applied (aria-distinguishable via label)
 * - Entity names link to correct detail pages
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TestProviders } from "@/mocks/TestProviders";
import { PresenceTiers } from "./PresenceTiers";
import type { LocationDetailResponse } from "@/lib/api/types";

type PresenceProp = LocationDetailResponse["presence"];

function renderPresence(presence: PresenceProp) {
  return render(
    <TestProviders>
      <PresenceTiers presence={presence} />
    </TestProviders>
  );
}

// ── Empty state ────────────────────────────────────────────────────

describe("PresenceTiers: empty state", () => {
  it("shows fallback when all tiers are empty", () => {
    renderPresence([
      { tier: 1, label: "Commonly present", items: [] },
      { tier: 2, label: "Often present", items: [] },
      { tier: 3, label: "Sometimes present", items: [] },
    ]);
    expect(
      screen.getByText("No known presence at this location.")
    ).toBeInTheDocument();
  });

  it("shows fallback when presence array is empty", () => {
    renderPresence([]);
    expect(
      screen.getByText("No known presence at this location.")
    ).toBeInTheDocument();
  });
});

// ── Populated tiers ────────────────────────────────────────────────

describe("PresenceTiers: populated tiers", () => {
  const presence: PresenceProp = [
    {
      tier: 1,
      label: "Commonly present",
      items: [{ id: "char-1", name: "Kael", type: "character" }],
    },
    {
      tier: 2,
      label: "Often present",
      items: [{ id: "npc-1", name: "Merchant", type: "character" }],
    },
    {
      tier: 3,
      label: "Sometimes present",
      items: [],
    },
  ];

  it("renders tier label for non-empty tier", () => {
    renderPresence(presence);
    expect(screen.getByText("Commonly present")).toBeInTheDocument();
    expect(screen.getByText("Often present")).toBeInTheDocument();
  });

  it("hides empty tiers", () => {
    renderPresence(presence);
    expect(screen.queryByText("Sometimes present")).not.toBeInTheDocument();
  });

  it("renders entity names", () => {
    renderPresence(presence);
    expect(screen.getByText("Kael")).toBeInTheDocument();
    expect(screen.getByText("Merchant")).toBeInTheDocument();
  });

  it("entity names are links to detail pages", () => {
    renderPresence(presence);
    const kaelLink = screen.getByRole("link", { name: /Kael/i });
    expect(kaelLink).toHaveAttribute("href", "/world/characters/char-1");
  });

  it("renders only non-empty tiers when some are empty", () => {
    renderPresence([
      {
        tier: 1,
        label: "Commonly present",
        items: [{ id: "char-1", name: "Kael", type: "character" }],
      },
      { tier: 2, label: "Often present", items: [] },
      { tier: 3, label: "Sometimes present", items: [] },
    ]);
    // Only tier 1 label visible
    expect(screen.getByText("Commonly present")).toBeInTheDocument();
    expect(screen.queryByText("Often present")).not.toBeInTheDocument();
    expect(screen.queryByText("Sometimes present")).not.toBeInTheDocument();
  });

  it("renders multiple items in the same tier", () => {
    renderPresence([
      {
        tier: 1,
        label: "Commonly present",
        items: [
          { id: "char-1", name: "Kael", type: "character" },
          { id: "char-2", name: "Maren", type: "character" },
          { id: "grp-1", name: "The Night Watch", type: "group" },
        ],
      },
    ]);
    expect(screen.getByText("Kael")).toBeInTheDocument();
    expect(screen.getByText("Maren")).toBeInTheDocument();
    expect(screen.getByText("The Night Watch")).toBeInTheDocument();
  });
});
