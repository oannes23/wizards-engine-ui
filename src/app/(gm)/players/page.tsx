"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Users,
  Link2,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  AlertCircle,
  UserPlus,
  ChevronDown,
} from "lucide-react";
import { listPlayers, regenerateToken } from "@/lib/api/services/players";
import {
  listInvites,
  createInvite,
  deleteInvite,
} from "@/lib/api/services/invites";
import { ConfirmModal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { EntityLink } from "@/components/ui/EntityLink";
import { useToast } from "@/lib/toast/useToast";
import { useAuth } from "@/lib/auth/useAuth";
import { queryKeys } from "@/lib/hooks/query-keys";
import type { UserResponse, InviteResponse } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/time";

// ── Role Badge ────────────────────────────────────────────────────

function RoleBadge({ role }: { role: "gm" | "player" | "viewer" }) {
  const styles = {
    gm: "bg-brand-blue/20 text-brand-blue",
    player: "bg-brand-teal/20 text-brand-teal",
    viewer: "bg-bg-elevated text-text-secondary",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[role]}`}
    >
      {role}
    </span>
  );
}

// ── Active Badge ──────────────────────────────────────────────────

function ActiveBadge({ isActive }: { isActive: boolean | undefined }) {
  if (isActive === undefined) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        isActive
          ? "bg-status-active/20 text-status-active"
          : "bg-status-ended/20 text-status-ended"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ── Copy Button ───────────────────────────────────────────────────

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API may be unavailable in some contexts
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied!" : label}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-status-active" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Player Row ────────────────────────────────────────────────────

interface PlayerRowProps {
  player: UserResponse;
  canTakeGmActions: boolean;
}

function PlayerRow({ player, canTakeGmActions }: PlayerRowProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [newLoginUrl, setNewLoginUrl] = useState<string | null>(null);

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateToken(player.id),
    onSuccess: (data) => {
      setNewLoginUrl(data.login_url);
      queryClient.invalidateQueries({ queryKey: queryKeys.players.all });
      toast.success("Token regenerated — share the new link with the player.");
    },
    onError: () => {
      toast.error("Failed to regenerate token.");
    },
  });

  function handleRegenerate() {
    setConfirmOpen(false);
    regenerateMutation.mutate();
  }

  const loginUrl = newLoginUrl ?? player.login_url;

  return (
    <div
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-border-default bg-bg-surface p-4"
      aria-label={`Player ${player.display_name}`}
    >
      {/* Left: identity */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-text-primary">{player.display_name}</span>
          <RoleBadge role={player.role} />
          <ActiveBadge isActive={player.is_active} />
        </div>
        {player.character_id && (
          <EntityLink
            type="character"
            id={player.character_id}
            name="Character"
          />
        )}
        {loginUrl && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs text-text-secondary font-mono truncate max-w-xs"
              aria-label="Login URL"
            >
              {loginUrl}
            </span>
            <CopyButton
              text={loginUrl}
              label={`Copy login URL for ${player.display_name}`}
            />
          </div>
        )}
      </div>

      {/* Right: actions (GM only) */}
      {canTakeGmActions && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={regenerateMutation.isPending}
            aria-label={`Regenerate token for ${player.display_name}`}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerateMutation.isPending ? "animate-spin" : ""}`}
              aria-hidden="true"
            />
            Regen Link
          </button>
        </div>
      )}

      {/* Confirm: regenerate token */}
      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Regenerate Login Link"
        message={`This will invalidate ${player.display_name}'s current login link. They will need the new link to log in. Continue?`}
        confirmLabel="Regenerate"
        onConfirm={handleRegenerate}
        variant="danger"
      />
    </div>
  );
}

// ── Players Section ───────────────────────────────────────────────

function PlayersSection() {
  const { canTakeGmActions } = useAuth();
  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.players.all,
    queryFn: () => listPlayers(),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
            aria-hidden="true"
          >
            <div className="h-4 w-1/3 bg-bg-elevated rounded mb-2" />
            <div className="h-3 w-1/2 bg-bg-elevated rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={<AlertCircle className="h-8 w-8" />}
        title="Could not load players"
        description="An error occurred fetching the player roster."
      />
    );
  }

  const players = data?.items ?? [];

  if (players.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-8 w-8" />}
        title="No players yet"
        description="Invite players using the section below."
      />
    );
  }

  return (
    <div className="space-y-3">
      {players.map((player) => (
        <PlayerRow
          key={player.id}
          player={player}
          canTakeGmActions={canTakeGmActions}
        />
      ))}
    </div>
  );
}

// ── Invite Row ────────────────────────────────────────────────────

interface InviteRowProps {
  invite: InviteResponse;
  canTakeGmActions: boolean;
}

function InviteRow({ invite, canTakeGmActions }: InviteRowProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => deleteInvite(invite.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.all });
      toast.success("Invite deleted.");
    },
    onError: () => {
      toast.error("Failed to delete invite — it may have already been used.");
    },
  });

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border p-4 transition-colors ${
        invite.is_consumed
          ? "border-border-default bg-bg-page opacity-60"
          : "border-border-default bg-bg-surface"
      }`}
      aria-label={`Invite ${invite.id}`}
    >
      {/* Left: invite details */}
      <div className="flex flex-col gap-1.5 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              invite.is_consumed
                ? "bg-status-ended/20 text-status-ended"
                : "bg-status-active/20 text-status-active"
            }`}
          >
            {invite.is_consumed ? "Used" : "Unused"}
          </span>
          <span className="text-xs font-medium capitalize text-text-secondary">
            {invite.role} invite
          </span>
          <time
            dateTime={invite.created_at}
            className="text-xs text-text-secondary tabular-nums"
          >
            {formatRelativeTime(invite.created_at)}
          </time>
        </div>
        {!invite.is_consumed && (
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs text-text-secondary font-mono truncate max-w-xs"
              aria-label="Invite URL"
            >
              {invite.login_url}
            </span>
            <CopyButton
              text={invite.login_url}
              label={`Copy invite link`}
            />
          </div>
        )}
      </div>

      {/* Right: delete (unconsumed, GM only) */}
      {canTakeGmActions && !invite.is_consumed && (
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleteMutation.isPending}
            aria-label={`Delete invite`}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-meter-stress hover:bg-meter-stress/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            Delete
          </button>
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Delete Invite"
        message="This invite link will be permanently deleted. Anyone with the link will no longer be able to join. Continue?"
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        variant="danger"
      />
    </div>
  );
}

// ── Invites Section ───────────────────────────────────────────────

function InvitesSection() {
  const { canTakeGmActions } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [newInviteUrl, setNewInviteUrl] = useState<string | null>(null);
  const [roleForInvite, setRoleForInvite] = useState<"player" | "viewer">("player");

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.invites.all,
    queryFn: () => listInvites(),
  });

  const createMutation = useMutation({
    mutationFn: () => createInvite({ role: roleForInvite }),
    onSuccess: (invite) => {
      setNewInviteUrl(invite.login_url);
      queryClient.invalidateQueries({ queryKey: queryKeys.invites.all });
    },
    onError: () => {
      toast.error("Failed to generate invite link.");
    },
  });

  const invites = data?.items ?? [];

  return (
    <div className="space-y-4">
      {/* Generate invite */}
      {canTakeGmActions && (
        <div className="rounded-lg border border-border-default bg-bg-surface p-4">
          <p className="text-sm font-medium text-text-primary mb-3">
            Generate New Invite
          </p>
          <div className="flex flex-wrap items-end gap-3">
            {/* Role selector */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="invite-role"
                className="text-xs text-text-secondary"
              >
                Role
              </label>
              <div className="relative">
                <select
                  id="invite-role"
                  value={roleForInvite}
                  onChange={(e) =>
                    setRoleForInvite(e.target.value as "player" | "viewer")
                  }
                  className="appearance-none rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
                >
                  <option value="player">Player</option>
                  <option value="viewer">Viewer</option>
                </select>
                <ChevronDown
                  className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
                  aria-hidden="true"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {createMutation.isPending ? "Generating..." : "Generate Invite"}
            </button>
          </div>

          {/* New invite URL display */}
          {newInviteUrl && (
            <div className="mt-3 flex items-center gap-2 rounded-md border border-brand-teal/30 bg-brand-teal/5 px-3 py-2">
              <Link2 className="h-4 w-4 text-brand-teal shrink-0" aria-hidden="true" />
              <span
                className="text-xs font-mono text-text-primary truncate flex-1"
                aria-label="New invite URL"
              >
                {newInviteUrl}
              </span>
              <CopyButton text={newInviteUrl} label="Copy new invite link" />
            </div>
          )}
        </div>
      )}

      {/* Invite list */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="rounded-lg border border-border-default bg-bg-surface p-4 animate-pulse"
              aria-hidden="true"
            >
              <div className="h-4 w-1/4 bg-bg-elevated rounded mb-2" />
              <div className="h-3 w-1/2 bg-bg-elevated rounded" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <EmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title="Could not load invites"
          description="An error occurred fetching invite history."
        />
      )}

      {!isLoading && !isError && invites.length === 0 && (
        <EmptyState
          icon={<Link2 className="h-8 w-8" />}
          title="No invites yet"
          description="Generate an invite link to add players to the game."
        />
      )}

      {!isLoading && !isError && invites.length > 0 && (
        <div className="space-y-3">
          {invites.map((invite) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              canTakeGmActions={canTakeGmActions}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmPlayersPage — GM-only page at /gm/players.
 *
 * Two sections:
 *  1. Players roster — display_name, role badge, is_active status,
 *     character link, login URL with copy button, and "Regen Link"
 *     button with ConfirmModal (Story 3.4.1 + 3.4.3).
 *  2. Invites — generate (player/viewer role), list with
 *     consumed/unconsumed badge, copy-to-clipboard, delete
 *     unconsumed with ConfirmModal (Story 3.4.2).
 */
export default function GmPlayersPage() {
  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            Players &amp; Invites
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Manage players, login links, and invites
          </p>
        </div>

        {/* Players section */}
        <section aria-labelledby="players-heading" className="mb-8">
          <h2
            id="players-heading"
            className="flex items-center gap-2 font-heading text-lg font-bold text-text-primary mb-4"
          >
            <Users className="h-5 w-5 text-brand-teal" aria-hidden="true" />
            Players
          </h2>
          <PlayersSection />
        </section>

        {/* Invites section */}
        <section aria-labelledby="invites-heading">
          <h2
            id="invites-heading"
            className="flex items-center gap-2 font-heading text-lg font-bold text-text-primary mb-4"
          >
            <Link2 className="h-5 w-5 text-brand-teal" aria-hidden="true" />
            Invites
          </h2>
          <InvitesSection />
        </section>
      </div>
    </div>
  );
}
