import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MeterHeader } from "./MeterHeader";
import { makeCharacter, makeNpcCharacter } from "@/mocks/fixtures/characters";

describe("MeterHeader", () => {
  it("renders character name", () => {
    render(<MeterHeader character={makeCharacter({ name: "Kael" })} />);
    expect(screen.getByText("Kael")).toBeInTheDocument();
  });

  it("renders all 4 meters", () => {
    const character = makeCharacter({
      stress: 3,
      free_time: 8,
      plot: 2,
      gnosis: 10,
      effective_stress_max: 9,
    });
    render(<MeterHeader character={character} />);
    expect(screen.getByLabelText(/Stress:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Free Time:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Plot:/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Gnosis:/)).toBeInTheDocument();
  });

  it("uses effective_stress_max for stress meter", () => {
    const character = makeCharacter({
      stress: 5,
      effective_stress_max: 7, // reduced by 2 trauma
    });
    render(<MeterHeader character={character} />);
    const stressMeter = screen.getByLabelText("Stress: 5 of 7");
    expect(stressMeter).toHaveAttribute("aria-valuemax", "7");
  });

  it("returns null for NPC (simplified) characters", () => {
    const { container } = render(<MeterHeader character={makeNpcCharacter()} />);
    expect(container.firstChild).toBeNull();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <MeterHeader character={makeCharacter()} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
