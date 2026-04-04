"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useCreateSession } from "../hooks/useSessions";
import { useToast } from "@/lib/toast/useToast";

interface CreateSessionFormProps {
  /** Called after a session is successfully created */
  onCreated?: () => void;
}

/**
 * CreateSessionForm — inline collapsible form for creating a draft session.
 *
 * Fields: summary (treated as name/label), time_now (number), date, notes.
 * Collapsible by toggling the "New Session" header.
 * spec/domains/sessions.md: "Inline collapsible create form at top"
 */
export function CreateSessionForm({ onCreated }: CreateSessionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [timeNow, setTimeNow] = useState("");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  const createMutation = useCreateSession();
  const toast = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!summary.trim()) return;

    try {
      await createMutation.mutateAsync({
        summary: summary.trim(),
        time_now: timeNow ? parseInt(timeNow, 10) : undefined,
        date: date || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Session created.");
      setSummary("");
      setTimeNow("");
      setDate("");
      setNotes("");
      setIsOpen(false);
      onCreated?.();
    } catch {
      toast.error("Failed to create session.");
    }
  }

  return (
    <div className="rounded-lg border border-border-default bg-bg-surface mb-6">
      {/* Collapsible header */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-text-primary hover:bg-bg-elevated transition-colors rounded-lg"
        aria-expanded={isOpen}
        aria-controls="create-session-form"
      >
        <span className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-brand-teal" aria-hidden="true" />
          New Session
        </span>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 text-text-secondary" aria-hidden="true" />
        )}
      </button>

      {isOpen && (
        <form
          id="create-session-form"
          onSubmit={handleSubmit}
          className="px-4 pb-4 space-y-3 border-t border-border-default pt-3"
          aria-label="Create session form"
        >
          {/* Summary / Name */}
          <div>
            <label
              htmlFor="session-summary"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Session name / summary <span className="text-meter-stress">*</span>
            </label>
            <input
              id="session-summary"
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. The heist at the old mansion"
              required
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>

          {/* time_now + date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="session-time-now"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Time Now
              </label>
              <input
                id="session-time-now"
                type="number"
                value={timeNow}
                onChange={(e) => setTimeNow(e.target.value)}
                placeholder="e.g. 42"
                min={0}
                className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
              />
            </div>
            <div>
              <label
                htmlFor="session-date"
                className="block text-xs font-medium text-text-secondary mb-1"
              >
                Date
              </label>
              <input
                id="session-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="session-notes"
              className="block text-xs font-medium text-text-secondary mb-1"
            >
              Notes
            </label>
            <textarea
              id="session-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional GM notes for this session..."
              rows={3}
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!summary.trim() || createMutation.isPending}
              className="rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending ? "Creating…" : "Create Draft"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
