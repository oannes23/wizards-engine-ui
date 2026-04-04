import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RejectForm } from "./RejectForm";

describe("RejectForm", () => {
  it("renders the Reject button in collapsed state", () => {
    render(<RejectForm onReject={vi.fn()} />);
    expect(screen.getByLabelText("Reject proposal")).toBeInTheDocument();
  });

  it("is not expanded by default", () => {
    render(<RejectForm onReject={vi.fn()} />);
    expect(screen.queryByLabelText("Rejection form")).not.toBeInTheDocument();
  });

  it("expands the form when Reject button is clicked", () => {
    render(<RejectForm onReject={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Reject proposal"));
    expect(screen.getByLabelText("Rejection form")).toBeInTheDocument();
  });

  it("shows rejection note textarea when expanded", () => {
    render(<RejectForm onReject={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Reject proposal"));
    expect(screen.getByLabelText(/rejection note/i)).toBeInTheDocument();
  });

  it("shows Confirm Rejection button when expanded", () => {
    render(<RejectForm onReject={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Reject proposal"));
    expect(screen.getByLabelText("Confirm rejection")).toBeInTheDocument();
  });

  it("calls onReject with empty note when note is blank", () => {
    const onReject = vi.fn();
    render(<RejectForm onReject={onReject} />);
    fireEvent.click(screen.getByLabelText("Reject proposal"));
    fireEvent.click(screen.getByLabelText("Confirm rejection"));
    expect(onReject).toHaveBeenCalledWith({ rejection_note: undefined });
  });

  it("calls onReject with note when note is provided", () => {
    const onReject = vi.fn();
    render(<RejectForm onReject={onReject} />);
    fireEvent.click(screen.getByLabelText("Reject proposal"));
    fireEvent.change(screen.getByLabelText(/rejection note/i), {
      target: { value: "Out of scope for this scene." },
    });
    fireEvent.click(screen.getByLabelText("Confirm rejection"));
    expect(onReject).toHaveBeenCalledWith({
      rejection_note: "Out of scope for this scene.",
    });
  });

  it("collapses back when Cancel is clicked", () => {
    render(<RejectForm onReject={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Reject proposal"));
    expect(screen.getByLabelText("Rejection form")).toBeInTheDocument();
    // Click the text Cancel button (not the header close button)
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByLabelText("Rejection form")).not.toBeInTheDocument();
  });

  it("disables Reject button when isSubmitting", () => {
    render(<RejectForm onReject={vi.fn()} isSubmitting={true} />);
    expect(screen.getByLabelText("Reject proposal")).toBeDisabled();
  });
});
