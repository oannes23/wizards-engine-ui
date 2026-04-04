import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WizardProvider, useWizard, WIZARD_STEPS } from "./WizardProvider";
import { TestProviders } from "@/mocks/TestProviders";

// ── Minimal consumer component ─────────────────────────────────────

function WizardConsumer() {
  const { state, selectActionType, goBack, goToStep } = useWizard();
  return (
    <div>
      <p data-testid="step">{state.currentStep}</p>
      <p data-testid="action-type">{state.actionType ?? "none"}</p>
      <button onClick={() => selectActionType("rest")}>Select Rest</button>
      <button onClick={() => selectActionType("regain_gnosis")}>Select Regain Gnosis</button>
      <button onClick={() => goToStep(2)}>Go Step 3</button>
      <button onClick={goBack}>Back</button>
    </div>
  );
}

function renderWizard() {
  return render(
    <TestProviders>
      <WizardProvider skipDraftRestore>
        <WizardConsumer />
      </WizardProvider>
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("WizardProvider", () => {
  it("starts at step 0", () => {
    renderWizard();
    expect(screen.getByTestId("step")).toHaveTextContent("0");
  });

  it("starts with no action type", () => {
    renderWizard();
    expect(screen.getByTestId("action-type")).toHaveTextContent("none");
  });

  it("WIZARD_STEPS has 3 entries", () => {
    expect(WIZARD_STEPS).toHaveLength(3);
  });

  it("selectActionType sets actionType and advances to step 1", () => {
    renderWizard();
    fireEvent.click(screen.getByText("Select Rest"));
    expect(screen.getByTestId("action-type")).toHaveTextContent("rest");
    expect(screen.getByTestId("step")).toHaveTextContent("1");
  });

  it("goBack decrements step from step 1 to step 0", () => {
    renderWizard();
    fireEvent.click(screen.getByText("Select Rest"));
    expect(screen.getByTestId("step")).toHaveTextContent("1");
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("step")).toHaveTextContent("0");
  });

  it("goToStep navigates to specified step", () => {
    renderWizard();
    fireEvent.click(screen.getByText("Go Step 3"));
    expect(screen.getByTestId("step")).toHaveTextContent("2");
  });

  it("preserves actionType across step navigation", () => {
    renderWizard();
    fireEvent.click(screen.getByText("Select Regain Gnosis"));
    expect(screen.getByTestId("action-type")).toHaveTextContent("regain_gnosis");
    // Navigate to step 3 and back
    fireEvent.click(screen.getByText("Go Step 3"));
    fireEvent.click(screen.getByText("Back"));
    expect(screen.getByTestId("action-type")).toHaveTextContent("regain_gnosis");
  });

  it("useWizard throws outside provider", () => {
    // Suppress error boundary noise in test output
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    function BareConsumer() {
      useWizard();
      return null;
    }
    expect(() => render(<BareConsumer />)).toThrow(
      "useWizard must be used inside <WizardProvider>"
    );
    consoleSpy.mockRestore();
  });
});
