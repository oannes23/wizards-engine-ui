import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MagicStatGrid } from "./MagicStatGrid";
import type { MagicStatName } from "@/lib/api/types";

const defaultMagicStats: Record<MagicStatName, { level: number; xp: number }> =
  {
    being: { level: 2, xp: 3 },
    wyrding: { level: 1, xp: 0 },
    summoning: { level: 0, xp: 0 },
    enchanting: { level: 1, xp: 4 },
    dreaming: { level: 0, xp: 0 },
  };

describe("MagicStatGrid", () => {
  it("renders all 5 magic stats", () => {
    render(<MagicStatGrid magicStats={defaultMagicStats} />);
    expect(screen.getByLabelText(/Being/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Wyrding/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Summoning/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enchanting/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Dreaming/)).toBeInTheDocument();
  });

  it("shows correct level badge", () => {
    render(<MagicStatGrid magicStats={defaultMagicStats} />);
    // Being at level 2
    expect(screen.getByText("Lv 2")).toBeInTheDocument();
  });

  it("shows XP progress bar with correct aria values", () => {
    render(<MagicStatGrid magicStats={defaultMagicStats} />);
    const beingXpBar = screen.getByLabelText("3 of 5 XP");
    expect(beingXpBar).toHaveAttribute("aria-valuenow", "3");
    expect(beingXpBar).toHaveAttribute("aria-valuemax", "5");
  });

  it("renders Magic heading", () => {
    render(<MagicStatGrid magicStats={defaultMagicStats} />);
    expect(screen.getByText("Magic")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <MagicStatGrid magicStats={defaultMagicStats} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
