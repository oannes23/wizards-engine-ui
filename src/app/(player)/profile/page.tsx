"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Check, RefreshCw } from "lucide-react";
import { EntityLink } from "@/components/ui/EntityLink";
import { useAuth } from "@/lib/auth/useAuth";
import { useToast } from "@/lib/toast/useToast";
import { queryKeys } from "@/lib/hooks/query-keys";
import { updateDisplayName, refreshLink } from "@/lib/api/services/auth";
import { ApiError } from "@/lib/api/errors";
import { useStarredObjects, useStarToggle } from "@/features/feeds/hooks/useStarredObjects";
import type { GameObjectType } from "@/lib/api/types";

// ── Role Badge ────────────────────────────────────────────────────

const ROLE_COLORS: Record<string, string> = {
  gm: "bg-meter-plot/20 text-meter-plot",
  player: "bg-brand-teal/20 text-brand-teal",
  viewer: "bg-text-secondary/20 text-text-secondary",
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${ROLE_COLORS[role] ?? "bg-bg-elevated text-text-primary"}`}
    >
      {role}
    </span>
  );
}

// ── Inline Display Name Editor ────────────────────────────────────

interface DisplayNameEditorProps {
  initialValue: string;
  onSave: (value: string) => void;
  isSaving: boolean;
}

function DisplayNameEditor({ initialValue, onSave, isSaving }: DisplayNameEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep draft in sync if initial value changes externally (e.g. cache update)
  useEffect(() => {
    if (!editing) {
      setDraft(initialValue);
    }
  }, [initialValue, editing]);

  function startEditing() {
    setDraft(initialValue);
    setEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === initialValue) {
      setEditing(false);
      setDraft(initialValue);
      return;
    }
    onSave(trimmed);
    setEditing(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      setEditing(false);
      setDraft(initialValue);
    }
  }

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        disabled={isSaving}
        aria-label="Edit display name"
        className="
          font-heading text-2xl font-bold text-text-primary bg-transparent
          border-b-2 border-brand-blue outline-none w-full max-w-xs
          disabled:opacity-50
        "
      />
    );
  }

  return (
    <button
      onClick={startEditing}
      aria-label="Edit display name"
      title="Click to edit"
      className="
        font-heading text-2xl font-bold text-text-primary
        hover:text-brand-teal transition-colors cursor-pointer
        border-b-2 border-transparent hover:border-brand-teal/40
        text-left
      "
    >
      {initialValue}
    </button>
  );
}

// ── Refresh Link Section ───────────────────────────────────────────

function RefreshLinkSection() {
  const { success, error: toastError } = useToast();
  const [newLink, setNewLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const refreshMutation = useMutation({
    mutationFn: refreshLink,
    onSuccess: (data) => {
      setNewLink(data.login_url);
      success("New magic link generated");
    },
    onError: () => {
      toastError("Failed to generate a new link. Please try again.");
    },
  });

  async function handleCopy() {
    if (!newLink) return;
    try {
      await navigator.clipboard.writeText(newLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toastError("Could not copy to clipboard");
    }
  }

  return (
    <section aria-labelledby="refresh-link-heading">
      <h2 id="refresh-link-heading" className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Magic Link
      </h2>

      <div className="bg-bg-surface rounded-lg border border-border-default p-4 flex flex-col gap-3">
        <p className="text-sm text-text-secondary">
          Generate a new magic link to sign in from another device. Your current
          link will stop working.
        </p>

        <button
          onClick={() => refreshMutation.mutate()}
          disabled={refreshMutation.isPending}
          className="
            inline-flex items-center gap-2 rounded-md bg-bg-elevated px-4 py-2
            text-sm font-medium text-text-primary hover:bg-border-default
            disabled:opacity-50 disabled:cursor-not-allowed transition-colors
            self-start min-h-[44px]
          "
          aria-label="Generate new magic link"
        >
          <RefreshCw className={`h-4 w-4 ${refreshMutation.isPending ? "animate-spin" : ""}`} />
          {refreshMutation.isPending ? "Generating..." : "Refresh login link"}
        </button>

        {newLink && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-text-secondary">Your new link:</p>
            <div className="flex items-center gap-2 flex-wrap">
              <code
                className="
                  flex-1 min-w-0 truncate rounded bg-bg-elevated px-3 py-2
                  text-xs font-mono text-brand-teal border border-border-default
                "
                title={newLink}
              >
                {newLink}
              </code>
              <button
                onClick={() => void handleCopy()}
                aria-label="Copy magic link"
                className="
                  shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-2
                  text-xs font-medium bg-brand-blue text-white hover:bg-brand-blue-light
                  transition-colors min-h-[44px]
                "
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ── Starred Objects Section ────────────────────────────────────────

function StarredObjectsSection() {
  const { data, isLoading, error } = useStarredObjects();
  const { unstar, isUnstarring } = useStarToggle();

  if (isLoading) {
    return (
      <section aria-labelledby="starred-heading">
        <h2 id="starred-heading" className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Starred
        </h2>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 bg-bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section aria-labelledby="starred-heading">
        <h2 id="starred-heading" className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Starred
        </h2>
        <p className="text-sm text-meter-stress">Could not load starred objects.</p>
      </section>
    );
  }

  const items = data?.items ?? [];

  return (
    <section aria-labelledby="starred-heading">
      <h2 id="starred-heading" className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
        Starred ({items.length})
      </h2>

      {items.length === 0 ? (
        <p className="text-sm text-text-secondary italic">
          You haven&apos;t starred anything yet. Star characters, groups, locations,
          or stories to find them quickly.
        </p>
      ) : (
        <ul className="flex flex-col gap-1" aria-label="Starred objects">
          {items.map((item) => (
            <li
              key={`${item.type}-${item.id}`}
              className="flex items-center justify-between gap-2 rounded-lg bg-bg-surface border border-border-default px-3 py-2"
            >
              <EntityLink
                type={item.type as GameObjectType | "story"}
                id={item.id}
                name={item.name}
              />
              <button
                onClick={() =>
                  unstar({
                    type: item.type as GameObjectType | "story",
                    id: item.id,
                  })
                }
                disabled={isUnstarring}
                aria-label={`Remove ${item.name} from starred`}
                className="
                  shrink-0 text-xs text-text-secondary hover:text-meter-stress
                  transition-colors disabled:opacity-40 min-h-[44px] min-w-[44px]
                  flex items-center justify-center
                "
              >
                Unstar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Profile Page ──────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, characterId } = useAuth();
  const { success, error: toastError } = useToast();
  const queryClient = useQueryClient();

  const updateNameMutation = useMutation({
    mutationFn: (display_name: string) => updateDisplayName(display_name),
    onSuccess: (updated) => {
      // Update the cached /me response so the entire app reflects the new name
      queryClient.setQueryData(queryKeys.auth.me, updated);
      success("Display name updated");
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 422) {
        toastError("Invalid name. Please try a different one.");
      } else {
        toastError("Failed to update name. Please try again.");
      }
    },
  });

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Profile Header */}
      <section aria-labelledby="profile-heading">
        <h1 id="profile-heading" className="sr-only">Profile</h1>

        <div className="bg-bg-surface rounded-xl border border-border-default p-6 flex flex-col gap-4">
          {/* Display name */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Display name
            </p>
            <DisplayNameEditor
              initialValue={user.display_name}
              onSave={(name) => updateNameMutation.mutate(name)}
              isSaving={updateNameMutation.isPending}
            />
            <p className="text-xs text-text-secondary mt-0.5">
              Click your name to edit it.
            </p>
          </div>

          {/* Role badge */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Role
            </span>
            <RoleBadge role={user.role} />
          </div>

          {/* Character link — only for players */}
          {characterId && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wide">
                Character
              </span>
              <EntityLink
                type="character"
                id={characterId}
                name="My Character"
              />
            </div>
          )}
        </div>
      </section>

      {/* Starred Objects */}
      <StarredObjectsSection />

      {/* Refresh Magic Link */}
      <RefreshLinkSection />
    </div>
  );
}
