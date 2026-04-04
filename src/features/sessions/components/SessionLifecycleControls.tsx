"use client";

import { useState } from "react";
import { Play, StopCircle, Trash2, AlertTriangle } from "lucide-react";
import { Modal, ConfirmModal } from "@/components/ui/Modal";
import { TimeDisplay } from "@/components/ui/TimeDisplay";
import {
  useStartSession,
  useEndSession,
  useDeleteSession,
} from "../hooks/useSessions";
import { useToast } from "@/lib/toast/useToast";
import { useRouter } from "next/navigation";
import type { SessionResponse } from "@/lib/api/types";
import { GAME_CONSTANTS } from "@/lib/constants";

interface SessionLifecycleControlsProps {
  session: SessionResponse;
}

// ── Start Confirmation Modal ──────────────────────────────────────

interface StartConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: SessionResponse;
  isStarting: boolean;
}

function StartConfirmModal({
  open,
  onClose,
  onConfirm,
  session,
  isStarting,
}: StartConfirmModalProps) {
  const participantCount = session.participants.length;
  const timeNow = session.time_now;

  return (
    <Modal open={open} onClose={onClose} title="Start Session?">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Starting this session will distribute Free Time and Plot to all
          participants.
        </p>

        {timeNow != null && (
          <div className="rounded-md bg-bg-elevated border border-border-default p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-1">
              Time Now
            </p>
            <TimeDisplay timeNow={timeNow} />
          </div>
        )}

        <div className="rounded-md bg-bg-elevated border border-border-default p-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            Distribution
          </p>
          <ul className="space-y-1 text-sm text-text-secondary">
            <li>
              Free Time will be distributed to{" "}
              <strong className="text-text-primary">{participantCount}</strong>{" "}
              participant{participantCount !== 1 ? "s" : ""} based on the
              time_now delta.
            </li>
            <li>
              Plot: <strong className="text-text-primary">+1 base</strong> per
              participant (<strong className="text-text-primary">+2</strong>{" "}
              for those with Additional Contribution enabled).
            </li>
          </ul>
        </div>

        {participantCount === 0 && (
          <div className="flex items-center gap-2 rounded-md bg-meter-stress/10 border border-meter-stress/20 px-3 py-2 text-sm text-meter-stress">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
            No participants added. Add participants before starting.
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={participantCount === 0 || isStarting}
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? "Starting…" : "Start Session"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── End Confirmation Modal ────────────────────────────────────────

interface EndConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: SessionResponse;
  isEnding: boolean;
}

function EndConfirmModal({
  open,
  onClose,
  onConfirm,
  session,
  isEnding,
}: EndConfirmModalProps) {
  // Find participants whose Plot will be clamped
  // Note: participants don't carry meter data here — we show a generic warning
  // if Plot clamping might occur. In a full implementation, the detail page
  // would need to load character meter data separately for lossiness warnings.
  const plotMax = GAME_CONSTANTS.PLOT_MAX;

  return (
    <Modal open={open} onClose={onClose} title="End Session?">
      <div className="space-y-4">
        <p className="text-sm text-text-secondary">
          Ending this session will clamp each participant&apos;s Plot to the
          maximum of{" "}
          <strong className="text-text-primary">{plotMax}</strong>.
        </p>

        <p className="text-sm text-text-secondary">
          The session will be read-only for all users after it ends. This
          action cannot be undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isEnding}
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-meter-stress hover:bg-meter-stress/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEnding ? "Ending…" : "End Session"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Main Controls ─────────────────────────────────────────────────

/**
 * SessionLifecycleControls — GM-only buttons for session lifecycle transitions.
 *
 * Draft: [Start Session] [Delete]
 * Active: [End Session]
 * Ended: (nothing)
 *
 * All destructive actions use confirmation modals.
 * spec/domains/sessions.md: lifecycle, session transitions
 */
export function SessionLifecycleControls({ session }: SessionLifecycleControlsProps) {
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const startMutation = useStartSession();
  const endMutation = useEndSession();
  const deleteMutation = useDeleteSession();
  const toast = useToast();
  const router = useRouter();

  async function handleStart() {
    try {
      await startMutation.mutateAsync(session.id);
      toast.success("Session started.");
      setStartOpen(false);
    } catch {
      toast.error("Failed to start session.");
      setStartOpen(false);
    }
  }

  async function handleEnd() {
    try {
      await endMutation.mutateAsync(session.id);
      toast.success("Session ended.");
      setEndOpen(false);
    } catch {
      toast.error("Failed to end session.");
      setEndOpen(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(session.id);
      toast.success("Session deleted.");
      router.push("/gm/sessions");
    } catch {
      toast.error("Failed to delete session.");
    }
  }

  if (session.status === "ended") {
    return null;
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {session.status === "draft" && (
        <>
          <button
            type="button"
            onClick={() => setStartOpen(true)}
            className="
              flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium
              text-white bg-brand-blue hover:bg-brand-blue-light transition-colors
            "
            aria-label="Start session"
          >
            <Play className="h-4 w-4" aria-hidden="true" />
            Start Session
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="
              flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium
              text-meter-stress hover:bg-meter-stress/10 transition-colors
            "
            aria-label="Delete session"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </button>
        </>
      )}

      {session.status === "active" && (
        <button
          type="button"
          onClick={() => setEndOpen(true)}
          className="
            flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium
            text-white bg-meter-stress hover:bg-meter-stress/80 transition-colors
          "
          aria-label="End session"
        >
          <StopCircle className="h-4 w-4" aria-hidden="true" />
          End Session
        </button>
      )}

      {/* Start confirmation modal */}
      <StartConfirmModal
        open={startOpen}
        onClose={() => setStartOpen(false)}
        onConfirm={handleStart}
        session={session}
        isStarting={startMutation.isPending}
      />

      {/* End confirmation modal */}
      <EndConfirmModal
        open={endOpen}
        onClose={() => setEndOpen(false)}
        onConfirm={handleEnd}
        session={session}
        isEnding={endMutation.isPending}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Session?"
        message="This draft session will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
