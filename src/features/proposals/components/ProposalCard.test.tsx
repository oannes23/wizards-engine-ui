import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProposalCard } from "./ProposalCard";
import {
  makeProposal,
  makeApprovedProposal,
  makeRejectedProposal,
} from "@/mocks/fixtures/proposals";

// Mock Next.js Link
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("ProposalCard", () => {
  describe("pending proposal", () => {
    it("renders action type badge", () => {
      render(<ProposalCard proposal={makeProposal()} />);
      expect(screen.getByText("Use Skill")).toBeInTheDocument();
    });

    it("renders narrative excerpt", () => {
      render(
        <ProposalCard
          proposal={makeProposal({
            narrative: "I attempt to pickpocket the merchant.",
          })}
        />
      );
      expect(
        screen.getByText("I attempt to pickpocket the merchant.")
      ).toBeInTheDocument();
    });

    it("truncates long narratives to 120 chars", () => {
      const longNarrative = "A".repeat(150);
      render(
        <ProposalCard proposal={makeProposal({ narrative: longNarrative })} />
      );
      const excerpt = screen.getByText(/A+…/);
      expect(excerpt.textContent).toHaveLength(121); // 120 + ellipsis
    });

    it("shows 'No narrative provided' when narrative is null", () => {
      render(
        <ProposalCard proposal={makeProposal({ narrative: null })} />
      );
      expect(screen.getByText(/no narrative provided/i)).toBeInTheDocument();
    });

    it("shows pending status badge", () => {
      render(<ProposalCard proposal={makeProposal()} />);
      expect(screen.getByText("pending")).toBeInTheDocument();
    });

    it("shows Edit link", () => {
      const proposal = makeProposal({ id: "01TEST_PROPOSAL000000000" });
      render(<ProposalCard proposal={proposal} />);
      const editLink = screen.getByLabelText("Edit proposal");
      expect(editLink).toHaveAttribute(
        "href",
        `/proposals/${proposal.id}/edit`
      );
    });

    it("shows Delete button", () => {
      render(<ProposalCard proposal={makeProposal()} />);
      expect(screen.getByLabelText("Delete proposal")).toBeInTheDocument();
    });

    it("calls onDelete with proposal id when Delete is clicked", () => {
      const onDelete = vi.fn();
      const proposal = makeProposal({ id: "01TEST_PROPOSAL000000000" });
      render(<ProposalCard proposal={proposal} onDelete={onDelete} />);
      fireEvent.click(screen.getByLabelText("Delete proposal"));
      expect(onDelete).toHaveBeenCalledWith(proposal.id);
    });

    it("disables Delete button when isDeleting is true", () => {
      render(
        <ProposalCard proposal={makeProposal()} isDeleting={true} />
      );
      expect(screen.getByLabelText("Delete proposal")).toBeDisabled();
    });

    it("shows revision badge when revision_count > 0", () => {
      render(
        <ProposalCard proposal={makeProposal({ revision_count: 2 })} />
      );
      expect(screen.getByText("Revised 2x")).toBeInTheDocument();
    });

    it("does not show revision badge when revision_count is 0", () => {
      render(
        <ProposalCard proposal={makeProposal({ revision_count: 0 })} />
      );
      expect(screen.queryByText(/revised/i)).not.toBeInTheDocument();
    });
  });

  describe("approved proposal", () => {
    it("renders approved status badge", () => {
      render(<ProposalCard proposal={makeApprovedProposal()} />);
      expect(screen.getByText("approved")).toBeInTheDocument();
    });

    it("renders CalculatedEffectCard when calculated_effect is present", () => {
      render(<ProposalCard proposal={makeApprovedProposal()} />);
      expect(screen.getByLabelText("Calculated effect")).toBeInTheDocument();
    });

    it("renders GM note when present", () => {
      render(
        <ProposalCard
          proposal={makeApprovedProposal({
            gm_notes: "Excellent approach!",
          })}
        />
      );
      expect(screen.getByText("Excellent approach!")).toBeInTheDocument();
      expect(screen.getByText("GM Note")).toBeInTheDocument();
    });

    it("does not show Edit or Delete buttons for approved", () => {
      render(<ProposalCard proposal={makeApprovedProposal()} />);
      expect(screen.queryByLabelText("Edit proposal")).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText("Delete proposal")
      ).not.toBeInTheDocument();
    });
  });

  describe("rejected proposal", () => {
    it("renders rejected status badge", () => {
      render(<ProposalCard proposal={makeRejectedProposal()} />);
      expect(screen.getByText("rejected")).toBeInTheDocument();
    });

    it("renders rejection reason", () => {
      render(
        <ProposalCard
          proposal={makeRejectedProposal({
            gm_notes: "Out of scope for this scene.",
          })}
        />
      );
      expect(
        screen.getByText("Out of scope for this scene.")
      ).toBeInTheDocument();
      expect(screen.getByText("Rejection Reason")).toBeInTheDocument();
    });

    it("shows Revise button linking to edit page", () => {
      const proposal = makeRejectedProposal({ id: "01TEST_REJECTED000000000" });
      render(<ProposalCard proposal={proposal} />);
      const reviseLink = screen.getByLabelText("Revise proposal");
      expect(reviseLink).toHaveAttribute(
        "href",
        `/proposals/${proposal.id}/edit`
      );
    });

    it("shows Delete button for rejected proposals", () => {
      render(<ProposalCard proposal={makeRejectedProposal()} />);
      expect(screen.getByLabelText("Delete proposal")).toBeInTheDocument();
    });
  });
});
