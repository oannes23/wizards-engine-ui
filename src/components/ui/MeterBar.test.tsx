import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MeterBar } from "./MeterBar";

describe("MeterBar", () => {
  it("renders with correct value and max", () => {
    render(
      <MeterBar label="Stress" value={5} max={9} color="meter-stress" />
    );
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuenow", "5");
    expect(meter).toHaveAttribute("aria-valuemax", "9");
    expect(meter).toHaveAttribute("aria-label", "Stress: 5 of 9");
  });

  it("renders with effective max", () => {
    render(
      <MeterBar
        label="Stress"
        value={5}
        max={9}
        effectiveMax={7}
        color="meter-stress"
      />
    );
    const meter = screen.getByRole("meter");
    expect(meter).toHaveAttribute("aria-valuemax", "7");
    expect(meter).toHaveAttribute("aria-label", "Stress: 5 of 7");
  });

  it("displays numeric label", () => {
    render(
      <MeterBar label="Plot" value={3} max={5} color="meter-plot" />
    );
    expect(screen.getByText("3/5")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <MeterBar
        label="Stress"
        value={5}
        max={9}
        effectiveMax={8}
        color="meter-stress"
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
