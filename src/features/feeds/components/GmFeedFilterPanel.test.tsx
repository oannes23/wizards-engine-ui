import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GmFeedFilterPanel, type GmFeedFilterState } from "./GmFeedFilterPanel";

// ── Helpers ───────────────────────────────────────────────────────────

function renderPanel(
  filters: GmFeedFilterState = {},
  onChange = vi.fn(),
  onReset = vi.fn()
) {
  return render(
    <GmFeedFilterPanel filters={filters} onChange={onChange} onReset={onReset} />
  );
}

// ── Tests ─────────────────────────────────────────────────────────────

describe("GmFeedFilterPanel — layout", () => {
  it("renders the Advanced Filters heading", () => {
    renderPanel();
    expect(screen.getByText("Advanced Filters")).toBeInTheDocument();
  });

  it("renders the Target Type select", () => {
    renderPanel();
    expect(screen.getByLabelText("Target Type")).toBeInTheDocument();
  });

  it("renders the Actor Type select", () => {
    renderPanel();
    expect(screen.getByLabelText("Actor Type")).toBeInTheDocument();
  });

  it("renders the Since date input", () => {
    renderPanel();
    expect(screen.getByLabelText("Since")).toBeInTheDocument();
  });

  it("renders the Until date input", () => {
    renderPanel();
    expect(screen.getByLabelText("Until")).toBeInTheDocument();
  });

  it("renders item type radio buttons", () => {
    renderPanel();
    expect(screen.getByLabelText("Events only")).toBeInTheDocument();
    expect(screen.getByLabelText("Story entries only")).toBeInTheDocument();
  });
});

describe("GmFeedFilterPanel — no active filters", () => {
  it("does not show the Reset button when no filters are set", () => {
    renderPanel({});
    expect(
      screen.queryByRole("button", { name: /reset all filters/i })
    ).not.toBeInTheDocument();
  });

  it("does not show 'Filters active' message when no filters are set", () => {
    renderPanel({});
    expect(screen.queryByText(/filters active/i)).not.toBeInTheDocument();
  });
});

describe("GmFeedFilterPanel — active filters", () => {
  it("shows the Reset button when actor_type filter is active", () => {
    renderPanel({ actor_type: "gm" });
    expect(
      screen.getByRole("button", { name: /reset all filters/i })
    ).toBeInTheDocument();
  });

  it("shows the Reset button when target_type filter is active", () => {
    renderPanel({ target_type: "character" });
    expect(
      screen.getByRole("button", { name: /reset all filters/i })
    ).toBeInTheDocument();
  });

  it("shows the Reset button when since filter is active", () => {
    renderPanel({ since: "2026-01-01" });
    expect(
      screen.getByRole("button", { name: /reset all filters/i })
    ).toBeInTheDocument();
  });

  it("shows 'Filters active' message when any filter is active", () => {
    renderPanel({ actor_type: "player" });
    expect(screen.getByText(/filters active/i)).toBeInTheDocument();
  });

  it("shows the Reset button when type filter is active", () => {
    renderPanel({ type: "event" });
    expect(
      screen.getByRole("button", { name: /reset all filters/i })
    ).toBeInTheDocument();
  });
});

describe("GmFeedFilterPanel — onChange interactions", () => {
  it("calls onChange with actor_type when actor select changes", () => {
    const onChange = vi.fn();
    renderPanel({}, onChange);

    const select = screen.getByLabelText("Actor Type");
    fireEvent.change(select, { target: { value: "gm" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ actor_type: "gm" })
    );
  });

  it("calls onChange with undefined actor_type when cleared", () => {
    const onChange = vi.fn();
    renderPanel({ actor_type: "player" }, onChange);

    const select = screen.getByLabelText("Actor Type");
    fireEvent.change(select, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ actor_type: undefined })
    );
  });

  it("calls onChange with target_type when target select changes", () => {
    const onChange = vi.fn();
    renderPanel({}, onChange);

    const select = screen.getByLabelText("Target Type");
    fireEvent.change(select, { target: { value: "location" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ target_type: "location" })
    );
  });

  it("calls onChange with since when since input changes", () => {
    const onChange = vi.fn();
    renderPanel({}, onChange);

    const input = screen.getByLabelText("Since");
    fireEvent.change(input, { target: { value: "2026-01-15" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ since: "2026-01-15" })
    );
  });

  it("calls onChange with undefined since when cleared", () => {
    const onChange = vi.fn();
    renderPanel({ since: "2026-01-01" }, onChange);

    const input = screen.getByLabelText("Since");
    fireEvent.change(input, { target: { value: "" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ since: undefined })
    );
  });

  it("calls onChange with until when until input changes", () => {
    const onChange = vi.fn();
    renderPanel({}, onChange);

    const input = screen.getByLabelText("Until");
    fireEvent.change(input, { target: { value: "2026-03-01" } });

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ until: "2026-03-01" })
    );
  });

  it("selects event type radio when clicked", () => {
    const onChange = vi.fn();
    renderPanel({}, onChange);

    const radio = screen.getByLabelText("Events only");
    fireEvent.click(radio);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "event" })
    );
  });

  it("selects story_entry radio when clicked", () => {
    const onChange = vi.fn();
    renderPanel({}, onChange);

    const radio = screen.getByLabelText("Story entries only");
    fireEvent.click(radio);

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ type: "story_entry" })
    );
  });
});

describe("GmFeedFilterPanel — Reset button", () => {
  it("calls onReset when Reset button is clicked", () => {
    const onReset = vi.fn();
    renderPanel({ actor_type: "gm" }, vi.fn(), onReset);

    const resetBtn = screen.getByRole("button", { name: /reset all filters/i });
    fireEvent.click(resetBtn);

    expect(onReset).toHaveBeenCalledOnce();
  });
});
