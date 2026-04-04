import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActionTypeBadge } from "./ActionTypeBadge";

describe("ActionTypeBadge", () => {
  it("renders session action with correct label", () => {
    render(<ActionTypeBadge actionType="use_skill" />);
    expect(screen.getByText("Use Skill")).toBeInTheDocument();
  });

  it("renders downtime action with correct label", () => {
    render(<ActionTypeBadge actionType="rest" />);
    expect(screen.getByText("Rest")).toBeInTheDocument();
  });

  it("renders system action with correct label", () => {
    render(<ActionTypeBadge actionType="resolve_trauma" />);
    expect(screen.getByText("Resolve Trauma")).toBeInTheDocument();
  });

  it("has aria-label with action type", () => {
    render(<ActionTypeBadge actionType="use_magic" />);
    expect(
      screen.getByLabelText("Action type: Use Magic")
    ).toBeInTheDocument();
  });

  it("applies session color class for use_skill", () => {
    const { container } = render(<ActionTypeBadge actionType="use_skill" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-brand-blue/20");
  });

  it("applies downtime color class for rest", () => {
    const { container } = render(<ActionTypeBadge actionType="rest" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-meter-ft/20");
  });

  it("applies system color class for resolve_clock", () => {
    const { container } = render(<ActionTypeBadge actionType="resolve_clock" />);
    const badge = container.querySelector("span");
    expect(badge?.className).toContain("bg-meter-stress/20");
  });
});
