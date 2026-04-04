import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ClockBar } from "./ClockBar";

describe("ClockBar", () => {
  it("renders with correct progress", () => {
    render(<ClockBar segments={8} progress={3} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "3");
    expect(bar).toHaveAttribute("aria-valuemax", "8");
  });

  it("includes clock name in aria-label", () => {
    render(<ClockBar name="Ritual" segments={6} progress={4} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute(
      "aria-label",
      "Clock: Ritual. Progress: 4 of 6"
    );
  });

  it("shows completion indicator", () => {
    render(
      <ClockBar name="Done" segments={4} progress={4} isCompleted />
    );
    expect(screen.getByLabelText("Completed")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <ClockBar name="Test" segments={6} progress={3} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
