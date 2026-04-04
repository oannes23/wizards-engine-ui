import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { ChargeDots } from "./ChargeDots";

describe("ChargeDots", () => {
  it("renders correct number of dots", () => {
    const { container } = render(
      <ChargeDots charges={3} maxCharges={5} />
    );
    const dots = container.querySelectorAll("[aria-hidden='true']");
    expect(dots).toHaveLength(5);
  });

  it("reports charges in aria-label", () => {
    render(<ChargeDots charges={3} maxCharges={5} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-label", "Charges: 3 of 5");
  });

  it("renders degraded dots when degradations present", () => {
    render(<ChargeDots charges={2} maxCharges={5} degradations={2} />);
    const group = screen.getByRole("group");
    expect(group).toHaveAttribute("aria-label", "Charges: 2 of 3");
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <ChargeDots charges={3} maxCharges={5} degradations={1} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
