"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Clock,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ChevronDown,
  AlertCircle,
} from "lucide-react";
import {
  listClocks,
  createClock,
  updateClock,
  deleteClock,
} from "@/lib/api/services/clocks";
import { queryKeys } from "@/lib/hooks/query-keys";
import { useToast } from "@/lib/toast/useToast";
import { ClockBar } from "@/components/ui/ClockBar";
import { EntityLink } from "@/components/ui/EntityLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import type { ClockResponse, GameObjectType } from "@/lib/api/types";
import Link from "next/link";

// ── Filter ────────────────────────────────────────────────────────

type ClockFilter = "all" | "active" | "completed";

// ── Create Clock Form ─────────────────────────────────────────────

interface CreateClockFormProps {
  onClose: () => void;
}

function CreateClockForm({ onClose }: CreateClockFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [segments, setSegments] = useState(6);
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createClock({ name: name.trim(), segments, notes: notes.trim() || undefined }),
    onSuccess: (clock) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.all });
      toast.success(`Clock "${clock.name}" created.`);
      onClose();
    },
    onError: () => {
      toast.error("Failed to create clock.");
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="rounded-lg border border-border-default bg-bg-surface p-5 space-y-4"
      aria-label="Create clock form"
    >
      <h3 className="font-heading font-bold text-text-primary">New Clock</h3>

      <div>
        <label htmlFor="clock-name" className="block text-sm font-medium text-text-primary mb-1.5">
          Name <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="clock-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
          placeholder="Clock name"
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label htmlFor="clock-segments" className="block text-sm font-medium text-text-primary mb-1.5">
          Segments <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <input
          id="clock-segments"
          type="number"
          min={2}
          max={20}
          value={segments}
          onChange={(e) => setSegments(Number(e.target.value))}
          className="w-24 rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>

      <div>
        <label htmlFor="clock-notes" className="block text-sm font-medium text-text-primary mb-1.5">
          Notes
        </label>
        <textarea
          id="clock-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional notes..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || mutation.isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Creating..." : "Create Clock"}
        </button>
      </div>
    </form>
  );
}

// ── Edit Clock Inline ─────────────────────────────────────────────

interface EditClockInlineProps {
  clock: ClockResponse;
  onClose: () => void;
}

function EditClockInline({ clock, onClose }: EditClockInlineProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(clock.name);
  const [segments, setSegments] = useState(clock.segments);
  const [notes, setNotes] = useState(clock.notes ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      updateClock(clock.id, {
        name: name.trim(),
        segments,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.all });
      toast.success(`Clock "${updated.name}" updated.`);
      onClose();
    },
    onError: () => {
      toast.error("Failed to update clock.");
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="space-y-3"
      aria-label={`Edit clock ${clock.name}`}
    >
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        aria-label="Clock name"
        className="w-full rounded-md border border-border-default bg-bg-page px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
      />
      <div className="flex items-center gap-2">
        <label className="text-xs text-text-secondary">Segments:</label>
        <input
          type="number"
          min={Math.max(2, clock.progress)}
          max={20}
          value={segments}
          onChange={(e) => setSegments(Number(e.target.value))}
          aria-label="Clock segments"
          className="w-16 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-border-focus"
        />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        placeholder="Notes..."
        aria-label="Clock notes"
        className="w-full rounded-md border border-border-default bg-bg-page px-3 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          aria-label="Save clock"
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
          Save
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cancel edit"
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated transition-colors"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Clock Card ────────────────────────────────────────────────────

interface ClockCardProps {
  clock: ClockResponse;
}

function ClockCard({ clock }: ClockCardProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const progressPct = clock.segments > 0 ? (clock.progress / clock.segments) * 100 : 0;
  const isNearComplete = !clock.is_completed && progressPct > 75;

  const deleteMutation = useMutation({
    mutationFn: () => deleteClock(clock.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.all });
      toast.success("Clock deleted.");
    },
    onError: () => {
      toast.error("Failed to delete clock.");
    },
  });

  return (
    <div
      className={`rounded-lg border bg-bg-surface p-4 ${
        clock.is_completed
          ? "border-meter-ft/40"
          : isNearComplete
          ? "border-meter-plot/60"
          : "border-border-default"
      }`}
      aria-label={`Clock: ${clock.name}`}
    >
      {editing ? (
        <EditClockInline clock={clock} onClose={() => setEditing(false)} />
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-medium text-sm text-text-primary truncate">
                  {clock.name}
                </h3>
                {clock.is_completed && (
                  <span className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium bg-meter-ft/20 text-meter-ft">
                    <Check className="h-3 w-3" aria-hidden="true" />
                    Complete
                  </span>
                )}
                {isNearComplete && (
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-meter-plot/20 text-meter-plot">
                    Near complete
                  </span>
                )}
              </div>
              {clock.associated_id && clock.associated_type && (
                <EntityLink
                  type={clock.associated_type as GameObjectType}
                  id={clock.associated_id}
                  name={clock.associated_type}
                />
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setEditing(true)}
                aria-label={`Edit clock ${clock.name}`}
                className="rounded-md p-1.5 text-text-secondary hover:text-brand-teal hover:bg-brand-teal/10 transition-colors"
              >
                <Edit2 className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setDeleteOpen(true)}
                aria-label={`Delete clock ${clock.name}`}
                className="rounded-md p-1.5 text-text-secondary hover:text-meter-stress hover:bg-meter-stress/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <ClockBar
            name={clock.name}
            segments={clock.segments}
            progress={clock.progress}
            isCompleted={clock.is_completed}
            size="md"
          />

          {clock.notes && (
            <p className="text-xs text-text-secondary mt-2 line-clamp-2">{clock.notes}</p>
          )}

          {!clock.is_completed && (
            <p className="text-xs text-text-secondary mt-2">
              Advance via{" "}
              <Link href="/actions" className="text-brand-teal hover:underline">
                GM Actions
              </Link>{" "}
              &rarr; Advance Clock
            </p>
          )}
        </>
      )}

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Clock"
        message={`Delete "${clock.name}"? This will soft-delete the clock.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        variant="danger"
      />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmClocksPage — GM-only page at /clocks.
 *
 * Grid of clock cards with filter tabs.
 * Create clock inline form.
 * Near-completion highlight (>75%).
 */
export default function GmClocksPage() {
  const [filter, setFilter] = useState<ClockFilter>("active");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.clocks.list({ filter }),
    queryFn: () =>
      listClocks({ limit: 100 }),
  });

  const allClocks = data?.items ?? [];

  const filteredClocks = allClocks.filter((c) => {
    if (filter === "active") return !c.is_completed && !c.is_deleted;
    if (filter === "completed") return c.is_completed && !c.is_deleted;
    return !c.is_deleted; // all
  });

  const filterTabs: Array<{ value: ClockFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Clocks
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Track progress toward events and consequences
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors"
            aria-expanded={showCreate}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Clock
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-6">
            <CreateClockForm onClose={() => setShowCreate(false)} />
          </div>
        )}

        {/* Filter tabs */}
        <div
          role="tablist"
          aria-label="Clock filter"
          className="flex items-center gap-1 mb-5 border-b border-border-default"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={filter === tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === tab.value
                  ? "border-brand-teal text-brand-teal"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
                aria-hidden="true"
              >
                <div className="h-4 w-2/3 bg-bg-elevated rounded mb-3" />
                <div className="h-5 bg-bg-elevated rounded" />
              </div>
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={<AlertCircle className="h-8 w-8" />}
            title="Could not load clocks"
            description="An error occurred fetching clock data."
          />
        )}

        {!isLoading && !isError && filteredClocks.length === 0 && (
          <EmptyState
            icon={<Clock className="h-8 w-8" />}
            title="No clocks"
            description={
              filter === "active"
                ? "No active clocks. Create one to track progress."
                : filter === "completed"
                ? "No completed clocks."
                : "No clocks yet. Create one to get started."
            }
          />
        )}

        {!isLoading && !isError && filteredClocks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClocks.map((clock) => (
              <ClockCard key={clock.id} clock={clock} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
