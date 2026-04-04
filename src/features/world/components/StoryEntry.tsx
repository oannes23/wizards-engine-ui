"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { ConfirmModal } from "@/components/ui/Modal";
import type { StoryEntry as StoryEntryType } from "@/lib/api/services/stories";

interface StoryEntryProps {
  entry: StoryEntryType;
  /** Display name for the author (resolved by the parent component). */
  authorName?: string | null;
  /** Whether the current user can edit/delete this entry. */
  canEdit?: boolean;
  onEdit?: (entryId: string, text: string) => void;
  onDelete?: (entryId: string) => void;
  isEditing?: boolean;
  isDeleting?: boolean;
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * StoryEntry — A single narrative entry with inline edit support.
 *
 * Display mode: author name, relative timestamp, entry text.
 * Edit mode (owners/GM): inline textarea replaces text, Save/Cancel buttons.
 * Delete: confirmation modal.
 */
export function StoryEntry({
  entry,
  authorName,
  canEdit = false,
  onEdit,
  onDelete,
  isEditing: externalIsEditing = false,
  isDeleting = false,
}: StoryEntryProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [editText, setEditText] = useState(entry.text);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function handleSave() {
    if (editText.trim() && editText !== entry.text) {
      onEdit?.(entry.id, editText.trim());
    }
    setIsEditMode(false);
  }

  function handleCancel() {
    setEditText(entry.text);
    setIsEditMode(false);
  }

  function handleDelete() {
    setShowDeleteConfirm(false);
    onDelete?.(entry.id);
  }

  return (
    <>
      <div
        className="rounded-lg border border-border-default bg-bg-surface p-3 space-y-2"
        aria-label={`Entry by ${authorName ?? "unknown"}`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span className="font-medium text-text-primary">
              {authorName ?? "Unknown"}
            </span>
            <span aria-label={`Posted ${new Date(entry.created_at).toLocaleString()}`}>
              {formatRelativeTime(entry.created_at)}
            </span>
          </div>

          {canEdit && !isEditMode && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsEditMode(true)}
                disabled={externalIsEditing}
                className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors disabled:opacity-40"
                aria-label="Edit entry"
                title="Edit entry"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-1 rounded text-text-secondary hover:text-meter-stress hover:bg-meter-stress/10 transition-colors disabled:opacity-40"
                aria-label="Delete entry"
                title="Delete entry"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Content — display or edit mode */}
        {isEditMode ? (
          <div className="space-y-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-2 text-sm text-text-primary
                focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal
                resize-none
              "
              aria-label="Edit entry text"
              autoFocus
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                disabled={!editText.trim() || externalIsEditing}
                className="
                  flex items-center gap-1 rounded-md px-2.5 py-1.5
                  bg-brand-blue text-white text-xs font-medium
                  hover:bg-brand-blue-light transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Save
              </button>
              <button
                onClick={handleCancel}
                className="
                  flex items-center gap-1 rounded-md px-2.5 py-1.5
                  bg-bg-elevated text-text-secondary text-xs font-medium
                  hover:bg-bg-surface hover:text-text-primary transition-colors
                "
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
            {entry.text}
          </p>
        )}
      </div>

      <ConfirmModal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete entry?"
        message="This entry will be permanently deleted and cannot be recovered."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        variant="danger"
      />
    </>
  );
}
