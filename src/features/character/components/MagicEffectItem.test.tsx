import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { MagicEffectItem, MagicEffectsSection } from "./MagicEffectItem";
import { makeMagicEffect } from "@/mocks/fixtures/characters";

// ── MagicEffectItem ───────────────────────────────────────────────

describe("MagicEffectItem", () => {
  it("renders effect name", () => {
    const effect = makeMagicEffect({ name: "Shadow Sight" });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.getByText("Shadow Sight")).toBeInTheDocument();
  });

  it("renders power level", () => {
    const effect = makeMagicEffect({ power_level: 3 });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.getByText("Lv 3")).toBeInTheDocument();
  });

  it("renders type badge for permanent effect", () => {
    const effect = makeMagicEffect({ effect_type: "permanent" });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.getByLabelText("permanent effect")).toBeInTheDocument();
  });

  it("renders type badge for charged effect", () => {
    const effect = makeMagicEffect({
      effect_type: "charged",
      charges_current: 3,
      charges_max: 5,
    });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.getByLabelText("charged effect")).toBeInTheDocument();
  });

  it("renders type badge for instant effect", () => {
    const effect = makeMagicEffect({ effect_type: "instant" });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.getByLabelText("instant effect")).toBeInTheDocument();
  });

  // ── Charged effects ──────────────────────────────────────────────

  it("shows charge count for charged effects", () => {
    const effect = makeMagicEffect({
      effect_type: "charged",
      charges_current: 3,
      charges_max: 5,
    });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.getByText("3/5 charges")).toBeInTheDocument();
  });

  it("enables Use button when charged effect has charges", () => {
    const effect = makeMagicEffect({
      effect_type: "charged",
      charges_current: 2,
      charges_max: 5,
    });
    render(<MagicEffectItem effect={effect} />);
    const useBtn = screen.getByRole("button", { name: /use shadow sight/i });
    expect(useBtn).not.toBeDisabled();
  });

  it("disables Use button when charged effect has 0 charges", () => {
    const effect = makeMagicEffect({
      effect_type: "charged",
      charges_current: 0,
      charges_max: 5,
    });
    render(<MagicEffectItem effect={effect} />);
    const useBtn = screen.getByRole("button", { name: /cannot use/i });
    expect(useBtn).toBeDisabled();
  });

  it("calls onUse with effect id when Use is clicked", () => {
    const onUse = vi.fn();
    const effect = makeMagicEffect({
      id: "01EFFECT_001",
      effect_type: "charged",
      charges_current: 2,
      charges_max: 5,
    });
    render(<MagicEffectItem effect={effect} onUse={onUse} />);
    const useBtn = screen.getByRole("button", { name: /use shadow sight/i });
    fireEvent.click(useBtn);
    expect(onUse).toHaveBeenCalledWith("01EFFECT_001");
  });

  it("does not render Use button for permanent effects", () => {
    const effect = makeMagicEffect({ effect_type: "permanent" });
    render(<MagicEffectItem effect={effect} />);
    expect(screen.queryByRole("button", { name: /use/i })).not.toBeInTheDocument();
  });

  it("does not render Use or Retire buttons for instant effects", () => {
    const effect = makeMagicEffect({ effect_type: "instant" });
    render(<MagicEffectItem effect={effect} />);
    // Defensive guard: backend should not return instants in active list,
    // but if it does, no action buttons are shown.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  // ── Retire ───────────────────────────────────────────────────────

  it("renders Retire button for charged and permanent effects", () => {
    for (const type of ["charged", "permanent"] as const) {
      const { unmount } = render(
        <MagicEffectItem
          effect={makeMagicEffect({
            effect_type: type,
            charges_current: type === "charged" ? 3 : null,
            charges_max: type === "charged" ? 5 : null,
          })}
        />
      );
      expect(
        screen.getByRole("button", { name: /retire shadow sight/i })
      ).toBeInTheDocument();
      unmount();
    }
  });

  it("does not render Retire button for instant effects", () => {
    render(
      <MagicEffectItem effect={makeMagicEffect({ effect_type: "instant" })} />
    );
    expect(
      screen.queryByRole("button", { name: /retire shadow sight/i })
    ).not.toBeInTheDocument();
  });

  it("opens confirm dialog when Retire is clicked", () => {
    const effect = makeMagicEffect({ name: "Shadow Sight" });
    render(<MagicEffectItem effect={effect} />);
    fireEvent.click(screen.getByRole("button", { name: /retire shadow sight/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/retire shadow sight\?/i)).toBeInTheDocument();
  });

  it("calls onRetire with effect id when confirmed in dialog", () => {
    const onRetire = vi.fn();
    const effect = makeMagicEffect({ id: "01EFFECT_002", name: "Shadow Sight" });
    render(<MagicEffectItem effect={effect} onRetire={onRetire} />);
    fireEvent.click(screen.getByRole("button", { name: /retire shadow sight/i }));
    fireEvent.click(screen.getByRole("button", { name: /retire effect/i }));
    expect(onRetire).toHaveBeenCalledWith("01EFFECT_002");
  });

  it("does not call onRetire when dialog is cancelled", () => {
    const onRetire = vi.fn();
    const effect = makeMagicEffect({ name: "Shadow Sight" });
    render(<MagicEffectItem effect={effect} onRetire={onRetire} />);
    fireEvent.click(screen.getByRole("button", { name: /retire shadow sight/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onRetire).not.toHaveBeenCalled();
  });

  it("disables Retire button when isRetiring is true", () => {
    const effect = makeMagicEffect();
    render(<MagicEffectItem effect={effect} isRetiring={true} />);
    expect(screen.getByRole("button", { name: /retire shadow sight/i })).toBeDisabled();
  });

  it("shows retiring label when isRetiring is true", () => {
    const effect = makeMagicEffect();
    render(<MagicEffectItem effect={effect} isRetiring={true} />);
    expect(screen.getByText(/retiring/i)).toBeInTheDocument();
  });

  // ── Accessibility ────────────────────────────────────────────────

  it("passes axe accessibility check for permanent effect", async () => {
    const { container } = render(
      <MagicEffectItem effect={makeMagicEffect({ effect_type: "permanent" })} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("passes axe accessibility check for charged effect", async () => {
    const { container } = render(
      <MagicEffectItem
        effect={makeMagicEffect({
          effect_type: "charged",
          charges_current: 3,
          charges_max: 5,
        })}
      />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

// ── MagicEffectsSection ───────────────────────────────────────────

describe("MagicEffectsSection", () => {
  it("renders section title with slot count", () => {
    const effects = [makeMagicEffect()];
    render(<MagicEffectsSection effects={effects} />);
    expect(screen.getByText("Magic Effects")).toBeInTheDocument();
    expect(screen.getByText("(1/9)")).toBeInTheDocument();
  });

  it("shows empty message when no effects", () => {
    render(<MagicEffectsSection effects={[]} />);
    expect(screen.getByText(/no active magic effects/i)).toBeInTheDocument();
  });

  it("renders all effects", () => {
    const effects = [
      makeMagicEffect({ id: "01E1", name: "Shadow Sight" }),
      makeMagicEffect({ id: "01E2", name: "Fire Shield" }),
    ];
    render(<MagicEffectsSection effects={effects} />);
    expect(screen.getByText("Shadow Sight")).toBeInTheDocument();
    expect(screen.getByText("Fire Shield")).toBeInTheDocument();
  });

  it("passes onUse and isUsing to the correct effect", () => {
    const onUse = vi.fn();
    const effects = [
      makeMagicEffect({
        id: "01E1",
        name: "Charge Effect",
        effect_type: "charged",
        charges_current: 3,
        charges_max: 5,
      }),
    ];
    render(
      <MagicEffectsSection effects={effects} onUse={onUse} usingId={null} />
    );
    fireEvent.click(screen.getByRole("button", { name: /use charge effect/i }));
    expect(onUse).toHaveBeenCalledWith("01E1");
  });
});
