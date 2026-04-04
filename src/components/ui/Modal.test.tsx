import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import { Modal, ConfirmModal } from "./Modal";

describe("Modal", () => {
  it("renders title and content when open", () => {
    render(
      <Modal open={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal content")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hidden Modal">
        <p>Hidden content</p>
      </Modal>
    );
    expect(screen.queryByText("Hidden Modal")).not.toBeInTheDocument();
  });

  it("passes axe accessibility check", async () => {
    const { container } = render(
      <Modal open={true} onClose={() => {}} title="Accessible Modal">
        <p>Content</p>
      </Modal>
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ConfirmModal", () => {
  it("calls onConfirm when confirm button clicked", () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        title="Confirm"
        message="Are you sure?"
        confirmLabel="Yes"
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it("shows Cancel and Confirm buttons", () => {
    render(
      <ConfirmModal
        open={true}
        onClose={() => {}}
        title="Delete?"
        message="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {}}
        variant="danger"
      />
    );
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });
});
