import { cva } from "class-variance-authority";

type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "draft"
  | "active"
  | "ended"
  | "completed"
  | "abandoned";

const statusBadge = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
  {
    variants: {
      status: {
        pending: "bg-status-pending/20 text-status-pending",
        approved: "bg-status-approved/20 text-status-approved",
        rejected: "bg-status-rejected/20 text-status-rejected",
        draft: "bg-status-draft/20 text-status-draft",
        active: "bg-status-active/20 text-status-active",
        ended: "bg-status-ended/20 text-status-ended",
        completed: "bg-status-approved/20 text-status-approved",
        abandoned: "bg-status-ended/20 text-status-ended",
      },
    },
    defaultVariants: {
      status: "draft",
    },
  }
);

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={statusBadge({ status })}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
