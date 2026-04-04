import { SEASONS, SEASON_LENGTH } from "@/lib/constants";

interface TimeDisplayProps {
  timeNow: number;
}

/**
 * TimeDisplay — Formats time_now integer into season display.
 * Example: "Time Now 42 (Chaos 19)"
 */
export function TimeDisplay({ timeNow }: TimeDisplayProps) {
  const seasonIndex = Math.floor((timeNow - 1) / SEASON_LENGTH);
  const seasonTime = ((timeNow - 1) % SEASON_LENGTH) + 1;
  const seasonName = SEASONS[seasonIndex] ?? "Unknown";

  return (
    <span className="text-sm tabular-nums text-text-secondary">
      Time Now {timeNow}{" "}
      <span className="text-text-accent">
        ({seasonName} {seasonTime})
      </span>
    </span>
  );
}
