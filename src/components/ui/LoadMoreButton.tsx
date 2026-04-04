"use client";

import { Loader2 } from "lucide-react";

interface LoadMoreButtonProps {
  /** Callback when the button is clicked */
  onClick: () => void;
  /** Whether a load operation is in progress */
  isLoading: boolean;
  /** Whether there are more items to load */
  hasMore: boolean;
}

/**
 * LoadMoreButton — Cursor pagination trigger.
 * Shows "Load more" when hasMore is true, hides when there's nothing to load.
 */
export function LoadMoreButton({
  onClick,
  isLoading,
  hasMore,
}: LoadMoreButtonProps) {
  if (!hasMore) return null;

  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="
        w-full py-3 px-4 rounded-md
        bg-bg-elevated text-text-secondary text-sm font-medium
        hover:bg-brand-navy-light hover:text-text-primary
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-150
        flex items-center justify-center gap-2
      "
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        "Load more"
      )}
    </button>
  );
}
