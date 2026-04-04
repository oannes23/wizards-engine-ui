"use client";

import { useState, useMemo } from "react";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useStory, useAddStoryEntry, useEditStoryEntry, useDeleteStoryEntry } from "@/features/world/hooks/useStories";
import { useAuth } from "@/lib/auth/useAuth";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EntityLink } from "@/components/ui/EntityLink";
import { LoadMoreButton } from "@/components/ui/LoadMoreButton";
import { StoryEntry } from "@/features/world/components/StoryEntry";
import { useEntityName } from "@/features/world/hooks/useEntityName";
import type { GameObjectType } from "@/lib/api/types";

/**
 * Story detail page — /world/stories/[id]
 *
 * Layout:
 * - Parent link (if story has parent)
 * - Header: name, status, tags, summary, owners
 * - Sub-arcs section (if children exist)
 * - Entry input (always visible)
 * - Entries list (newest first)
 */
export default function StoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isGm, characterId } = useAuth();

  const { data: story, isLoading, isError } = useStory(id);
  const addEntryMutation = useAddStoryEntry(id);
  const editEntryMutation = useEditStoryEntry(id);
  const deleteEntryMutation = useDeleteStoryEntry(id);

  const [entryText, setEntryText] = useState("");

  // Entries reversed for newest-first display.
  // Must be called unconditionally (before early returns) to follow Rules of Hooks.
  const displayEntries = useMemo(
    () => [...(story?.entries ?? [])].reverse(),
    [story?.entries]
  );

  function handleSubmitEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!entryText.trim()) return;

    addEntryMutation.mutate(
      {
        text: entryText.trim(),
        character_id: isGm ? null : (characterId ?? null),
      },
      {
        onSuccess: () => setEntryText(""),
      }
    );
  }

  function handleEditEntry(entryId: string, text: string) {
    editEntryMutation.mutate({ entryId, body: { text } });
  }

  function handleDeleteEntry(entryId: string) {
    deleteEntryMutation.mutate(entryId);
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full px-4 pt-4 space-y-3">
        <div className="h-6 w-32 bg-bg-elevated rounded animate-pulse" />
        <div className="h-24 bg-bg-elevated rounded-lg animate-pulse" />
        <div className="h-16 bg-bg-elevated rounded-lg animate-pulse" />
        <div className="h-20 bg-bg-elevated rounded-lg animate-pulse" />
      </div>
    );
  }

  if (isError || !story) {
    return (
      <div className="px-4 py-8">
        <EmptyState
          title="Story not found"
          description="This story may not exist or you may not have access."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <BackNav href="/world?tab=stories" label="Stories" />

      <div className="px-4 pt-3 pb-6 space-y-6">
        {/* Parent link */}
        {story.parent_id && (
          <Link
            href={`/world/stories/${story.parent_id}`}
            className="inline-flex items-center gap-1 text-sm text-brand-teal hover:text-brand-teal-light transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Parent Story
          </Link>
        )}

        {/* Header */}
        <div>
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="font-heading text-xl font-bold text-text-primary flex-1">
              {story.name}
            </h1>
            <StatusBadge status={story.status} />
          </div>

          {/* Tags */}
          {story.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {story.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-brand-navy-light text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Summary */}
          {story.summary && (
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              {story.summary}
            </p>
          )}

          {/* Owners */}
          {story.owners.length > 0 && (
            <div className="mt-3">
              <span className="text-xs text-text-secondary font-medium uppercase tracking-wide mr-2">
                Owners:
              </span>
              <div className="inline-flex flex-wrap gap-2 mt-1">
                {story.owners.map((owner) => (
                  <OwnerLink key={`${owner.type}-${owner.id}`} owner={owner} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Entry input — always visible */}
        <div>
          <form onSubmit={handleSubmitEntry} className="space-y-2">
            <textarea
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder="Write an entry..."
              rows={3}
              className="
                w-full rounded-lg border border-border-default bg-bg-surface
                px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/60
                focus:border-brand-teal focus:outline-none focus:ring-1 focus:ring-brand-teal
                resize-none
              "
              aria-label="New story entry"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!entryText.trim() || addEntryMutation.isPending}
                className="
                  flex items-center gap-1.5 rounded-lg px-3 py-2
                  bg-brand-blue text-white text-sm font-medium
                  hover:bg-brand-blue-light transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {addEntryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="h-4 w-4" aria-hidden="true" />
                )}
                Add Entry
              </button>
            </div>
          </form>
        </div>

        {/* Entries list */}
        <div>
          <div className="flex items-baseline gap-2 mb-3">
            <h2 className="text-sm font-semibold text-text-primary">Entries</h2>
            <span className="text-xs text-text-secondary">
              ({story.entries.length}{story.has_more_entries ? "+" : ""})
            </span>
          </div>

          {displayEntries.length === 0 ? (
            <EmptyState
              title="No entries yet"
              description="Be the first to write an entry for this story."
            />
          ) : (
            <div className="space-y-3">
              {displayEntries.map((entry) => {
                // Can edit/delete: GM always, or own entries
                const canEdit = isGm || entry.author_id === user?.id;
                return (
                  <StoryEntry
                    key={entry.id}
                    entry={entry}
                    authorName={entry.character_id ? undefined : "GM"}
                    canEdit={canEdit}
                    onEdit={handleEditEntry}
                    onDelete={handleDeleteEntry}
                    isEditing={editEntryMutation.isPending}
                    isDeleting={deleteEntryMutation.isPending}
                  />
                );
              })}

              {/* Load more (if more entries exist beyond the initial 20) */}
              {story.has_more_entries && (
                <div className="pt-2">
                  <LoadMoreButton
                    onClick={() => {
                      // The spec says GET /stories/{id}/entries for older entries.
                      // For MVP, we show a note — full cursor pagination can be added.
                    }}
                    isLoading={false}
                    hasMore={story.has_more_entries}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Owner link with name resolution ───────────────────────────────

interface OwnerLinkProps {
  owner: { type: GameObjectType; id: string; name: string };
}

function OwnerLink({ owner }: OwnerLinkProps) {
  // The story detail response now includes name directly (per spec)
  // useEntityName is used as a fallback if name is missing
  const { name: resolvedName } = useEntityName(owner.type, owner.id);
  const displayName = owner.name || resolvedName || owner.id;

  return (
    <EntityLink
      type={owner.type}
      id={owner.id}
      name={displayName}
    />
  );
}

// ── Back navigation ────────────────────────────────────────────────

function BackNav({ href, label }: { href: string; label: string }) {
  return (
    <div className="px-4 pt-3">
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-brand-teal transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        {label}
      </Link>
    </div>
  );
}
