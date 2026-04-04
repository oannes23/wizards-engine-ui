import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { StepIndicator } from "./StepIndicator";

describe("StepIndicator", () => {
  it("marks current step with aria-current", () => {
    render(
      <StepIndicator
        steps={["Choose", "Details", "Review"]}
        currentStep={1}
      />
    );
    const currentStep = screen.getByText("Details").closest("[aria-current]");
    expect(currentStep).toHaveAttribute("aria-current", "step");
  });

  it("renders all step labels", () => {
    render(
      <StepIndicator
        steps={["Choose", "Details", "Review"]}
        currentStep={0}
      />
    );
    expect(screen.getByText("Choose")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <StepIndicator
        steps={["Step 1", "Step 2", "Step 3"]}
        currentStep={1}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
