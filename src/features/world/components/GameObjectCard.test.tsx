import { render, screen } from "@testing-library/react";
import { GameObjectCard } from "./GameObjectCard";
import { TestProviders } from "@/mocks/TestProviders";

// ── Helpers ────────────────────────────────────────────────────────

function renderCard(props: React.ComponentProps<typeof GameObjectCard>) {
  return render(
    <TestProviders>
      <GameObjectCard {...props} />
    </TestProviders>
  );
}

// ── Tests ──────────────────────────────────────────────────────────

describe("GameObjectCard", () => {
  describe("character card", () => {
    it("renders character name", () => {
      renderCard({
        type: "character",
        id: "char-01",
        name: "Kael",
        detailLevel: "full",
      });
      expect(screen.getByText("Kael")).toBeInTheDocument();
    });

    it("shows PC subtitle for full detail_level", () => {
      renderCard({
        type: "character",
        id: "char-01",
        name: "Kael",
        detailLevel: "full",
      });
      expect(screen.getByText(/PC/)).toBeInTheDocument();
    });

    it("shows NPC subtitle for simplified detail_level", () => {
      renderCard({
        type: "character",
        id: "npc-01",
        name: "Merchant",
        detailLevel: "simplified",
      });
      expect(screen.getByText(/NPC/)).toBeInTheDocument();
    });

    it("shows player name if provided", () => {
      renderCard({
        type: "character",
        id: "char-01",
        name: "Kael",
        detailLevel: "full",
        playerName: "Alice",
      });
      expect(screen.getByText(/Alice/)).toBeInTheDocument();
    });

    it("links to character detail page", () => {
      renderCard({
        type: "character",
        id: "char-01",
        name: "Kael",
        detailLevel: "full",
      });
      const link = screen.getByRole("link", { name: /View character: Kael/i });
      expect(link).toHaveAttribute("href", "/world/characters/char-01");
    });

    it("shows description excerpt if provided", () => {
      renderCard({
        type: "character",
        id: "char-01",
        name: "Kael",
        detailLevel: "full",
        description: "A cunning rogue who grew up on the streets",
      });
      expect(screen.getByText(/cunning rogue/)).toBeInTheDocument();
    });

    it("truncates long descriptions", () => {
      const longDesc = "A".repeat(200);
      renderCard({
        type: "character",
        id: "char-01",
        name: "Kael",
        detailLevel: "full",
        description: longDesc,
      });
      // Should not show the full 200 chars
      const excerpt = screen.getByText(/A+…/);
      expect(excerpt.textContent?.length).toBeLessThan(200);
    });
  });

  describe("group card", () => {
    it("renders group name and tier badge", () => {
      renderCard({
        type: "group",
        id: "grp-01",
        name: "The Night Watch",
        tier: 3,
      });
      expect(screen.getByText("The Night Watch")).toBeInTheDocument();
      expect(screen.getByText(/Tier 3/)).toBeInTheDocument();
    });

    it("shows member count if provided", () => {
      renderCard({
        type: "group",
        id: "grp-01",
        name: "The Night Watch",
        tier: 3,
        memberCount: 5,
      });
      expect(screen.getByText(/5 members/)).toBeInTheDocument();
    });

    it("links to group detail page", () => {
      renderCard({
        type: "group",
        id: "grp-01",
        name: "The Night Watch",
        tier: 2,
      });
      const link = screen.getByRole("link", { name: /View group: The Night Watch/i });
      expect(link).toHaveAttribute("href", "/world/groups/grp-01");
    });
  });

  describe("location card", () => {
    it("renders location name and parent", () => {
      renderCard({
        type: "location",
        id: "loc-01",
        name: "The Docks",
        parentName: "Harbor District",
      });
      expect(screen.getByText("The Docks")).toBeInTheDocument();
      expect(screen.getByText(/Harbor District/)).toBeInTheDocument();
    });

    it('shows "(top-level)" when no parent', () => {
      renderCard({
        type: "location",
        id: "loc-01",
        name: "The City",
        parentName: null,
      });
      expect(screen.getByText(/top-level/)).toBeInTheDocument();
    });

    it("links to location detail page", () => {
      renderCard({
        type: "location",
        id: "loc-01",
        name: "The Docks",
      });
      const link = screen.getByRole("link", { name: /View location: The Docks/i });
      expect(link).toHaveAttribute("href", "/world/locations/loc-01");
    });
  });

  describe("story card", () => {
    it("renders story name and status badge", () => {
      renderCard({
        type: "story",
        id: "story-01",
        name: "The Shadow Conspiracy",
        status: "active",
      });
      expect(screen.getByText("The Shadow Conspiracy")).toBeInTheDocument();
      expect(screen.getByText("active")).toBeInTheDocument();
    });

    it("renders tags as chips", () => {
      renderCard({
        type: "story",
        id: "story-01",
        name: "Mystery",
        status: "active",
        tags: ["investigation", "intrigue"],
      });
      expect(screen.getByText("investigation")).toBeInTheDocument();
      expect(screen.getByText("intrigue")).toBeInTheDocument();
    });

    it("limits tags to 3", () => {
      renderCard({
        type: "story",
        id: "story-01",
        name: "Mystery",
        status: "active",
        tags: ["a", "b", "c", "d", "e"],
      });
      // Only first 3 tags shown
      expect(screen.getByText("a")).toBeInTheDocument();
      expect(screen.getByText("b")).toBeInTheDocument();
      expect(screen.getByText("c")).toBeInTheDocument();
      expect(screen.queryByText("d")).not.toBeInTheDocument();
    });

    it("links to story detail page", () => {
      renderCard({
        type: "story",
        id: "story-01",
        name: "Mystery",
        status: "active",
      });
      const link = screen.getByRole("link", { name: /View story: Mystery/i });
      expect(link).toHaveAttribute("href", "/world/stories/story-01");
    });
  });
});
