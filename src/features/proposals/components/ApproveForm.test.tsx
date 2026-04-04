import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ApproveForm } from "./ApproveForm";
import { makeProposal } from "@/mocks/fixtures/proposals";
import {
  makeSystemTraumaProposal,
  makeSystemClockProposal,
} from "@/mocks/handlers/gm";
import type { BondDisplayResponse } from "@/lib/api/types";

function makeBond(overrides?: Partial<BondDisplayResponse>): BondDisplayResponse {
  return {
    id: "01BOND_A0000000000000000",
    slot_type: "pc_bond",
    target_type: "character",
    target_id: "01CH_B0000000000000000000",
    target_name: "Bob",
    label: "Friend",
    description: null,
    is_active: true,
    bidirectional: false,
    charges: 5,
    degradations: 0,
    is_trauma: false,
    effective_charges_max: 5,
    ...overrides,
  };
}

describe("ApproveForm", () => {
  describe("player proposal (use_skill)", () => {
    it("renders quick Approve button", () => {
      const onApprove = vi.fn();
      render(
        <ApproveForm
          proposal={makeProposal()}
          onApprove={onApprove}
        />
      );
      expect(screen.getByLabelText("Approve proposal")).toBeInTheDocument();
    });

    it("calls onApprove with empty payload on quick approve", () => {
      const onApprove = vi.fn();
      render(
        <ApproveForm
          proposal={makeProposal()}
          onApprove={onApprove}
        />
      );
      fireEvent.click(screen.getByLabelText("Approve proposal"));
      expect(onApprove).toHaveBeenCalledWith({});
    });

    it("shows Options toggle button", () => {
      render(
        <ApproveForm proposal={makeProposal()} onApprove={vi.fn()} />
      );
      expect(screen.getByRole("button", { name: /options/i })).toBeInTheDocument();
    });

    it("expands options panel when Options is clicked", () => {
      render(
        <ApproveForm proposal={makeProposal()} onApprove={vi.fn()} />
      );
      expect(screen.queryByLabelText("Approve with options")).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: /options/i }));
      expect(screen.getByLabelText("Approve with options")).toBeInTheDocument();
    });

    it("shows narrative override textarea in options", () => {
      render(
        <ApproveForm proposal={makeProposal()} onApprove={vi.fn()} />
      );
      fireEvent.click(screen.getByRole("button", { name: /options/i }));
      expect(screen.getByLabelText(/narrative override/i)).toBeInTheDocument();
    });

    it("shows Force and Bond strained checkboxes", () => {
      render(
        <ApproveForm proposal={makeProposal()} onApprove={vi.fn()} />
      );
      fireEvent.click(screen.getByRole("button", { name: /options/i }));
      expect(
        screen.getByLabelText(/force approval despite insufficient resources/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/bond strained/i)).toBeInTheDocument();
    });

    it("does not show Magic Overrides for non-magic proposals", () => {
      render(
        <ApproveForm proposal={makeProposal({ action_type: "use_skill" })} onApprove={vi.fn()} />
      );
      fireEvent.click(screen.getByRole("button", { name: /options/i }));
      expect(screen.queryByText("Magic Overrides")).not.toBeInTheDocument();
    });

    it("shows Magic Overrides section for use_magic", () => {
      render(
        <ApproveForm
          proposal={makeProposal({ action_type: "use_magic" })}
          onApprove={vi.fn()}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /options/i }));
      expect(screen.getByText("Magic Overrides")).toBeInTheDocument();
    });

    it("disables Approve button when isSubmitting", () => {
      render(
        <ApproveForm
          proposal={makeProposal()}
          onApprove={vi.fn()}
          isSubmitting={true}
        />
      );
      expect(screen.getByLabelText("Approve proposal")).toBeDisabled();
    });

    it("calls onApprove with narrative and force when options set", () => {
      const onApprove = vi.fn();
      render(
        <ApproveForm proposal={makeProposal()} onApprove={onApprove} />
      );
      fireEvent.click(screen.getByRole("button", { name: /options/i }));

      const narrativeInput = screen.getByLabelText(/narrative override/i);
      fireEvent.change(narrativeInput, { target: { value: "GM says no" } });

      const forceCheckbox = screen.getByLabelText(
        /force approval despite insufficient resources/i
      );
      fireEvent.click(forceCheckbox);

      fireEvent.click(screen.getByLabelText("Approve with options"));
      expect(onApprove).toHaveBeenCalledWith(
        expect.objectContaining({
          narrative: "GM says no",
          gm_overrides: expect.objectContaining({ force: true }),
        })
      );
    });

    it("pre-fills rider event for work_on_project with clock_id", () => {
      render(
        <ApproveForm
          proposal={makeProposal({
            action_type: "work_on_project",
            clock_id: "01CLOCK_TEST00000000000",
          })}
          onApprove={vi.fn()}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: /options/i }));
      // Rider should be pre-filled
      expect(screen.getByLabelText("Rider event type")).toHaveValue("clock.advanced");
    });
  });

  describe("system proposal — resolve_trauma", () => {
    it("renders the resolve trauma form", () => {
      const proposal = makeSystemTraumaProposal();
      render(
        <ApproveForm
          proposal={proposal}
          onApprove={vi.fn()}
          characterBonds={[makeBond()]}
        />
      );
      expect(screen.getByLabelText("Resolve trauma form")).toBeInTheDocument();
      expect(screen.getByLabelText("Resolve trauma")).toBeInTheDocument();
    });

    it("shows bond selector dropdown", () => {
      render(
        <ApproveForm
          proposal={makeSystemTraumaProposal()}
          onApprove={vi.fn()}
          characterBonds={[makeBond({ target_name: "Bob", label: "Friend" })]}
        />
      );
      expect(
        screen.getByLabelText("Bond becomes Trauma *" as string)
      ).toBeInTheDocument();
      expect(screen.getByText("Bob — Friend")).toBeInTheDocument();
    });

    it("shows trauma name and description fields", () => {
      render(
        <ApproveForm
          proposal={makeSystemTraumaProposal()}
          onApprove={vi.fn()}
          characterBonds={[makeBond()]}
        />
      );
      expect(screen.getByLabelText("Trauma name *" as string)).toBeInTheDocument();
      expect(screen.getByLabelText("Trauma description *" as string)).toBeInTheDocument();
    });

    it("disables Resolve button until required fields filled", () => {
      render(
        <ApproveForm
          proposal={makeSystemTraumaProposal()}
          onApprove={vi.fn()}
          characterBonds={[makeBond()]}
        />
      );
      expect(screen.getByLabelText("Resolve trauma")).toBeDisabled();
    });

    it("calls onApprove with gm_overrides when resolved", () => {
      const onApprove = vi.fn();
      render(
        <ApproveForm
          proposal={makeSystemTraumaProposal()}
          onApprove={onApprove}
          characterBonds={[makeBond({ id: "01BOND_A0000000000000000" })]}
        />
      );

      // Select bond
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "01BOND_A0000000000000000" },
      });

      // Fill name
      fireEvent.change(screen.getByLabelText("Trauma name *" as string), {
        target: { value: "Broken Mirrors" },
      });

      // Fill description
      fireEvent.change(screen.getByLabelText("Trauma description *" as string), {
        target: { value: "The night Alice lost everything." },
      });

      fireEvent.click(screen.getByLabelText("Resolve trauma"));
      expect(onApprove).toHaveBeenCalledWith({
        gm_overrides: {
          trauma_bond_id: "01BOND_A0000000000000000",
          trauma_name: "Broken Mirrors",
          trauma_description: "The night Alice lost everything.",
        },
      });
    });

    it("does not show Approve/Reject buttons", () => {
      render(
        <ApproveForm
          proposal={makeSystemTraumaProposal()}
          onApprove={vi.fn()}
          characterBonds={[makeBond()]}
        />
      );
      expect(
        screen.queryByRole("button", { name: /^approve$/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("system proposal — resolve_clock", () => {
    it("renders the resolve clock form", () => {
      render(
        <ApproveForm
          proposal={makeSystemClockProposal()}
          onApprove={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Resolve clock form")).toBeInTheDocument();
      expect(screen.getByLabelText("Resolve clock")).toBeInTheDocument();
    });

    it("shows narrative textarea", () => {
      render(
        <ApproveForm
          proposal={makeSystemClockProposal()}
          onApprove={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Resolve clock")).toBeInTheDocument();
    });

    it("calls onApprove with narrative on resolve", () => {
      const onApprove = vi.fn();
      render(
        <ApproveForm
          proposal={makeSystemClockProposal()}
          onApprove={onApprove}
        />
      );
      fireEvent.change(screen.getByPlaceholderText(/what happens when/i), {
        target: { value: "The city falls." },
      });
      fireEvent.click(screen.getByLabelText("Resolve clock"));
      expect(onApprove).toHaveBeenCalledWith({ narrative: "The city falls." });
    });
  });
});
