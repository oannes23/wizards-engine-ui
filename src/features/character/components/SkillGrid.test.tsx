import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { SkillGrid } from "./SkillGrid";
import type { SkillName } from "@/lib/api/types";

const defaultSkills: Record<SkillName, number> = {
  awareness: 2,
  composure: 1,
  influence: 0,
  finesse: 3,
  speed: 2,
  power: 0,
  knowledge: 1,
  technology: 0,
};

describe("SkillGrid", () => {
  it("renders all 8 skills", () => {
    render(<SkillGrid skills={defaultSkills} />);
    expect(screen.getByLabelText(/Awareness/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Composure/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Influence/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Finesse/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Speed/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Power/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Knowledge/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Technology/)).toBeInTheDocument();
  });

  it("shows correct level in aria-label", () => {
    render(<SkillGrid skills={defaultSkills} />);
    expect(screen.getByLabelText("Awareness: level 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Finesse: level 3")).toBeInTheDocument();
    expect(screen.getByLabelText("Power: level 0")).toBeInTheDocument();
  });

  it("renders Skills heading", () => {
    render(<SkillGrid skills={defaultSkills} />);
    expect(screen.getByText("Skills")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(<SkillGrid skills={defaultSkills} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
