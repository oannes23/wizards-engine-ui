import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GmProposalReviewCard } from "./GmProposalReviewCard";
import { makeProposal, makeApprovedProposal } from "@/mocks/fixtures/proposals";
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

describe("GmProposalReviewCard", () => {
  describe("player proposal", () => {
    it("renders action type badge", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByText("Use Skill")).toBeInTheDocument();
    });

    it("renders player name when provided", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal()}
          playerName="Alice"
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("renders proposal narrative", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal({
            narrative: "I attempt to pickpocket the merchant.",
          })}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(
        screen.getByText("I attempt to pickpocket the merchant.")
      ).toBeInTheDocument();
    });

    it("renders revision count badge for resubmitted proposals", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal({ revision_count: 3 })}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByText("Revised 3x")).toBeInTheDocument();
    });

    it("does not show revision badge when revision_count is 0", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal({ revision_count: 0 })}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.queryByText(/revised/i)).not.toBeInTheDocument();
    });

    it("renders Approve button", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Approve proposal")).toBeInTheDocument();
    });

    it("renders Reject button", () => {
      render(
        <GmProposalReviewCard
          proposal={makeProposal()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Reject proposal")).toBeInTheDocument();
    });

    it("calls onApprove with proposal id", () => {
      const onApprove = vi.fn();
      const proposal = makeProposal({ id: "01TEST_PROPOSAL000000000" });
      render(
        <GmProposalReviewCard
          proposal={proposal}
          onApprove={onApprove}
          onReject={vi.fn()}
        />
      );
      fireEvent.click(screen.getByLabelText("Approve proposal"));
      expect(onApprove).toHaveBeenCalledWith("01TEST_PROPOSAL000000000", {});
    });

    it("calls onReject with proposal id when rejection confirmed", () => {
      const onReject = vi.fn();
      const proposal = makeProposal({ id: "01TEST_PROPOSAL000000000" });
      render(
        <GmProposalReviewCard
          proposal={proposal}
          onApprove={vi.fn()}
          onReject={onReject}
        />
      );
      fireEvent.click(screen.getByLabelText("Reject proposal"));
      fireEvent.click(screen.getByLabelText("Confirm rejection"));
      expect(onReject).toHaveBeenCalledWith("01TEST_PROPOSAL000000000", {
        rejection_note: undefined,
      });
    });

    it("shows CalculatedEffectCard when calculated_effect is present", () => {
      render(
        <GmProposalReviewCard
          proposal={makeApprovedProposal({ status: "pending" })}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Calculated effect")).toBeInTheDocument();
    });
  });

  describe("system proposal — resolve_trauma", () => {
    it("shows system badge", () => {
      render(
        <GmProposalReviewCard
          proposal={makeSystemTraumaProposal()}
          characterBonds={[makeBond()]}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("System proposal")).toBeInTheDocument();
    });

    it("renders resolve trauma form instead of approve/reject", () => {
      render(
        <GmProposalReviewCard
          proposal={makeSystemTraumaProposal()}
          characterBonds={[makeBond()]}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Resolve trauma form")).toBeInTheDocument();
      expect(screen.queryByLabelText("Reject proposal")).not.toBeInTheDocument();
    });

    it("has distinct visual treatment (amber border)", () => {
      const { container } = render(
        <GmProposalReviewCard
          proposal={makeSystemTraumaProposal()}
          characterBonds={[makeBond()]}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      const article = container.querySelector("article");
      expect(article?.className).toContain("border-amber");
    });
  });

  describe("system proposal — resolve_clock", () => {
    it("shows system badge", () => {
      render(
        <GmProposalReviewCard
          proposal={makeSystemClockProposal()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("System proposal")).toBeInTheDocument();
    });

    it("renders resolve clock form", () => {
      render(
        <GmProposalReviewCard
          proposal={makeSystemClockProposal()}
          onApprove={vi.fn()}
          onReject={vi.fn()}
        />
      );
      expect(screen.getByLabelText("Resolve clock form")).toBeInTheDocument();
    });
  });
});
