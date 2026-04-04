import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { TraitItem, TraitsSection } from "./TraitItem";
import { makeTrait } from "@/mocks/fixtures/characters";

describe("TraitItem", () => {
  it("renders trait name and description", () => {
    const trait = makeTrait({ name: "Street Rat", description: "A cunning rogue" });
    render(<TraitItem trait={trait} freeTime={5} />);
    expect(screen.getByText("Street Rat")).toBeInTheDocument();
    expect(screen.getByText("A cunning rogue")).toBeInTheDocument();
  });

  it("shows Core badge for core_trait", () => {
    const trait = makeTrait({ slot_type: "core_trait" });
    render(<TraitItem trait={trait} freeTime={5} />);
    expect(screen.getByLabelText("Core trait")).toBeInTheDocument();
  });

  it("shows Role badge for role_trait", () => {
    const trait = makeTrait({ slot_type: "role_trait" });
    render(<TraitItem trait={trait} freeTime={5} />);
    expect(screen.getByLabelText("Role trait")).toBeInTheDocument();
  });

  it("enables Recharge button when FT >= 1 and charges < 5", () => {
    const trait = makeTrait({ charge: 3 });
    render(<TraitItem trait={trait} freeTime={3} />);
    const btn = screen.getByRole("button");
    expect(btn).not.toBeDisabled();
  });

  it("disables Recharge when charges = 5 (full)", () => {
    const trait = makeTrait({ charge: 5 });
    render(<TraitItem trait={trait} freeTime={5} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables Recharge when FT < 1", () => {
    const trait = makeTrait({ charge: 2 });
    render(<TraitItem trait={trait} freeTime={0} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onRecharge with trait id when clicked", () => {
    const onRecharge = vi.fn();
    const trait = makeTrait({ id: "01TRAIT_001", charge: 2 });
    render(<TraitItem trait={trait} freeTime={3} onRecharge={onRecharge} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onRecharge).toHaveBeenCalledWith("01TRAIT_001");
  });

  it("shows charge count", () => {
    const trait = makeTrait({ charge: 3 });
    render(<TraitItem trait={trait} freeTime={5} />);
    expect(screen.getByText("3/5")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <TraitItem trait={makeTrait({ charge: 3 })} freeTime={3} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TraitsSection", () => {
  it("renders section title with slot count", () => {
    const traits = [makeTrait()];
    render(
      <TraitsSection
        title="Core Traits"
        traits={traits}
        slotLimit={2}
        freeTime={5}
      />
    );
    expect(screen.getByText("Core Traits")).toBeInTheDocument();
    expect(screen.getByText("(1/2)")).toBeInTheDocument();
  });

  it("shows empty message when no traits", () => {
    render(
      <TraitsSection
        title="Core Traits"
        traits={[]}
        slotLimit={2}
        freeTime={5}
      />
    );
    expect(screen.getByText(/no core traits yet/i)).toBeInTheDocument();
  });

  it("renders all traits", () => {
    const traits = [
      makeTrait({ id: "01T1", name: "Trait A" }),
      makeTrait({ id: "01T2", name: "Trait B", slot_type: "core_trait" }),
    ];
    render(
      <TraitsSection
        title="Core Traits"
        traits={traits}
        slotLimit={2}
        freeTime={5}
      />
    );
    expect(screen.getByText("Trait A")).toBeInTheDocument();
    expect(screen.getByText("Trait B")).toBeInTheDocument();
  });
});
