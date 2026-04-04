import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { BondItem, BondsSection } from "./BondItem";
import { makeBond } from "@/mocks/fixtures/characters";

describe("BondItem", () => {
  it("renders target name and label", () => {
    const bond = makeBond({ target_name: "Sibling", label: "Bonded to" });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.getByText("Sibling")).toBeInTheDocument();
    expect(screen.getByText("Bonded to")).toBeInTheDocument();
  });

  it("renders description when present", () => {
    const bond = makeBond({ description: "A close ally" });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.getByText("A close ally")).toBeInTheDocument();
  });

  it("enables Maintain when FT >= 1 and charges < effective max", () => {
    const bond = makeBond({ charges: 3, degradations: 0, is_trauma: false });
    render(<BondItem bond={bond} freeTime={3} />);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("disables Maintain when FT < 1", () => {
    const bond = makeBond({ charges: 3, is_trauma: false });
    render(<BondItem bond={bond} freeTime={0} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("disables Maintain when charges at effective max", () => {
    const bond = makeBond({ charges: 5, degradations: 0, effective_charges_max: 5, is_trauma: false });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("hides Maintain button for trauma bonds", () => {
    const bond = makeBond({ is_trauma: true });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows Trauma badge for trauma bonds", () => {
    const bond = makeBond({ is_trauma: true });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.getByLabelText("Trauma bond")).toBeInTheDocument();
  });

  it("shows trauma border style on trauma bonds", () => {
    const bond = makeBond({ is_trauma: true });
    const { container } = render(<BondItem bond={bond} freeTime={5} />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toMatch(/meter-stress/);
  });

  it("calls onMaintain with bond id when clicked", () => {
    const onMaintain = vi.fn();
    const bond = makeBond({ id: "01BOND_001", charges: 2, is_trauma: false });
    render(<BondItem bond={bond} freeTime={5} onMaintain={onMaintain} />);
    fireEvent.click(screen.getByRole("button"));
    expect(onMaintain).toHaveBeenCalledWith("01BOND_001");
  });

  it("shows degradation count when degradations > 0", () => {
    const bond = makeBond({ charges: 3, degradations: 2, effective_charges_max: 3 });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.getByText("(2 degraded)")).toBeInTheDocument();
  });

  it("shows effective max in charge display", () => {
    const bond = makeBond({ charges: 3, degradations: 2, effective_charges_max: 3 });
    render(<BondItem bond={bond} freeTime={5} />);
    expect(screen.getByText("3/3")).toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <BondItem bond={makeBond({ charges: 3 })} freeTime={3} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("passes axe accessibility check for trauma bond", async () => {
    const { container } = render(
      <BondItem bond={makeBond({ is_trauma: true })} freeTime={5} />
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("BondsSection", () => {
  it("renders section title with slot count", () => {
    const bonds = [makeBond()];
    render(
      <BondsSection bonds={bonds} slotLimit={8} freeTime={5} />
    );
    expect(screen.getByText("Bonds")).toBeInTheDocument();
    expect(screen.getByText("(1/8)")).toBeInTheDocument();
  });

  it("shows empty message when no bonds", () => {
    render(<BondsSection bonds={[]} slotLimit={8} freeTime={5} />);
    expect(screen.getByText(/no active bonds yet/i)).toBeInTheDocument();
  });

  it("renders all bonds", () => {
    const bonds = [
      makeBond({ id: "01B1", target_name: "Alice" }),
      makeBond({ id: "01B2", target_name: "Bob" }),
    ];
    render(<BondsSection bonds={bonds} slotLimit={8} freeTime={5} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
