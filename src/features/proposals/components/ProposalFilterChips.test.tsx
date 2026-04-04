import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProposalFilterChips } from "./ProposalFilterChips";

describe("ProposalFilterChips", () => {
  it("renders all four chips", () => {
    render(
      <ProposalFilterChips active="all" pendingCount={0} onChange={vi.fn()} />
    );
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
  });

  it("marks the active chip with aria-pressed=true", () => {
    render(
      <ProposalFilterChips active="pending" pendingCount={2} onChange={vi.fn()} />
    );
    const pendingBtn = screen.getByRole("button", { name: /pending/i });
    expect(pendingBtn).toHaveAttribute("aria-pressed", "true");

    const allBtn = screen.getByRole("button", { name: "All" });
    expect(allBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("shows pending count badge when pendingCount > 0", () => {
    render(
      <ProposalFilterChips active="all" pendingCount={3} onChange={vi.fn()} />
    );
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByLabelText("3 pending")).toBeInTheDocument();
  });

  it("does not show pending count badge when pendingCount is 0", () => {
    render(
      <ProposalFilterChips active="all" pendingCount={0} onChange={vi.fn()} />
    );
    expect(screen.queryByLabelText(/pending/)).not.toBeInTheDocument();
  });

  it("calls onChange with correct filter when chip is clicked", () => {
    const onChange = vi.fn();
    render(
      <ProposalFilterChips active="all" pendingCount={0} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole("button", { name: "Approved" }));
    expect(onChange).toHaveBeenCalledWith("approved");
  });

  it("calls onChange with 'all' when All chip is clicked", () => {
    const onChange = vi.fn();
    render(
      <ProposalFilterChips active="pending" pendingCount={1} onChange={onChange} />
    );
    fireEvent.click(screen.getByRole("button", { name: "All" }));
    expect(onChange).toHaveBeenCalledWith("all");
  });
});
