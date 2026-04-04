"use client";

import { useState, useMemo } from "react";
import { UserPlus, UserMinus, Users } from "lucide-react";
import {
  useAddParticipant,
  useRemoveParticipant,
  useUpdateParticipant,
} from "../hooks/useSessions";
import { useToast } from "@/lib/toast/useToast";
import type { SessionResponse, CharacterDetailResponse } from "@/lib/api/types";

interface ParticipantManagementProps {
  session: SessionResponse;
  /** Full PC list for the "Add Participant" dropdown. */
  allCharacters: CharacterDetailResponse[];
  /** Whether the viewer has GM permissions. */
  isGm: boolean;
  /** The viewer's own character ID (for player join/leave). */
  playerCharacterId?: string | null;
}

// ── Participant Row ────────────────────────────────────────────────

interface ParticipantRowProps {
  participant: SessionResponse["participants"][number];
  session: SessionResponse;
  isGm: boolean;
  playerCharacterId?: string | null;
  onRemove: (characterId: string) => void;
  onToggleContribution: (characterId: string, value: boolean) => void;
  isRemoving: boolean;
  isUpdating: boolean;
}

function ParticipantRow({
  participant,
  session,
  isGm,
  playerCharacterId,
  onRemove,
  onToggleContribution,
  isRemoving,
  isUpdating,
}: ParticipantRowProps) {
  const canEdit = session.status !== "ended";
  const isDraft = session.status === "draft";
  const canRemove =
    canEdit && (isGm || participant.character_id === playerCharacterId);

  return (
    <div
      className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-bg-elevated"
      role="row"
    >
      <span className="text-sm font-medium text-text-primary">
        {participant.character_name ?? participant.character_id}
      </span>

      <div className="flex items-center gap-3">
        {/* Contribution toggle */}
        <label
          className={`flex items-center gap-1.5 text-xs ${
            isDraft ? "cursor-pointer" : "cursor-not-allowed opacity-60"
          }`}
          title={
            !isDraft
              ? "Can only change during draft"
              : "Additional contribution grants +2 Plot"
          }
        >
          <input
            type="checkbox"
            checked={participant.additional_contribution}
            disabled={!isDraft || isUpdating}
            onChange={(e) =>
              onToggleContribution(participant.character_id, e.target.checked)
            }
            className="rounded border-border-default"
            aria-label={`Additional contribution for ${participant.character_name}`}
          />
          <span className="text-text-secondary hidden sm:inline">+2 Plot</span>
        </label>

        {/* Remove button */}
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(participant.character_id)}
            disabled={isRemoving}
            className="text-text-secondary hover:text-meter-stress transition-colors disabled:opacity-50"
            aria-label={`Remove ${participant.character_name} from session`}
          >
            <UserMinus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Add Participant Dropdown ──────────────────────────────────────

interface AddParticipantDropdownProps {
  session: SessionResponse;
  availableCharacters: CharacterDetailResponse[];
  onAdd: (characterId: string) => void;
  onAddAll: () => void;
  isAdding: boolean;
}

function AddParticipantDropdown({
  session,
  availableCharacters,
  onAdd,
  onAddAll,
  isAdding,
}: AddParticipantDropdownProps) {
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return availableCharacters.filter((c) =>
      c.name.toLowerCase().includes(q)
    );
  }, [availableCharacters, search]);

  if (availableCharacters.length === 0) {
    return (
      <p className="text-xs text-text-secondary py-1">
        All characters are already in this session.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search characters…"
          className="flex-1 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
          aria-label="Search characters to add"
        />
        <button
          type="button"
          onClick={onAddAll}
          disabled={isAdding || availableCharacters.length === 0}
          className="rounded-md px-3 py-1.5 text-xs font-medium text-text-secondary bg-bg-elevated hover:text-text-primary hover:bg-brand-navy-light transition-colors disabled:opacity-50"
          aria-label="Add all remaining characters"
        >
          Add All
        </button>
      </div>

      {filtered.length > 0 && (
        <div className="flex gap-2">
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="flex-1 rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            aria-label="Select character to add"
          >
            <option value="">Select character…</option>
            {filtered.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              if (selectedId) {
                onAdd(selectedId);
                setSelectedId("");
              }
            }}
            disabled={!selectedId || isAdding}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50"
            aria-label="Add selected participant"
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────

/**
 * ParticipantManagement — participants tab content for session detail page.
 *
 * GM (draft/active): add/remove all participants, toggle contribution flag.
 * Player: join/leave own character, toggle own contribution (draft only).
 * All (ended): read-only list.
 *
 * spec/domains/sessions.md: participant management section
 */
export function ParticipantManagement({
  session,
  allCharacters,
  isGm,
  playerCharacterId,
}: ParticipantManagementProps) {
  const addMutation = useAddParticipant(session.id);
  const removeMutation = useRemoveParticipant(session.id);
  const updateMutation = useUpdateParticipant(session.id);
  const toast = useToast();

  const participantIds = new Set(session.participants.map((p) => p.character_id));

  // Characters available to add (full PCs not already in session)
  const availableCharacters = allCharacters.filter(
    (c) => c.detail_level === "full" && !participantIds.has(c.id)
  );

  const isPlayerParticipant = playerCharacterId
    ? participantIds.has(playerCharacterId)
    : false;

  const canManage =
    session.status !== "ended" &&
    (isGm || (!!playerCharacterId && !isPlayerParticipant));

  async function handleAdd(characterId: string) {
    try {
      await addMutation.mutateAsync({ character_id: characterId });
      toast.success("Participant added.");
    } catch {
      toast.error("Failed to add participant.");
    }
  }

  async function handleAddAll() {
    try {
      await Promise.all(
        availableCharacters.map((c) =>
          addMutation.mutateAsync({ character_id: c.id })
        )
      );
      toast.success("All participants added.");
    } catch {
      toast.error("Failed to add some participants.");
    }
  }

  async function handleRemove(characterId: string) {
    try {
      await removeMutation.mutateAsync(characterId);
      toast.success("Participant removed.");
    } catch {
      toast.error("Failed to remove participant.");
    }
  }

  async function handleToggleContribution(
    characterId: string,
    value: boolean
  ) {
    try {
      await updateMutation.mutateAsync({
        characterId,
        body: { additional_contribution: value },
      });
    } catch {
      toast.error("Failed to update contribution flag.");
    }
  }

  async function handlePlayerJoin() {
    if (!playerCharacterId) return;
    try {
      await addMutation.mutateAsync({ character_id: playerCharacterId });
      toast.success("Joined session.");
    } catch {
      toast.error("Failed to join session.");
    }
  }

  async function handlePlayerLeave() {
    if (!playerCharacterId) return;
    try {
      await removeMutation.mutateAsync(playerCharacterId);
      toast.success("Left session.");
    } catch {
      toast.error("Failed to leave session.");
    }
  }

  return (
    <section aria-label="Session participants">
      {/* Player join/leave (non-GM) */}
      {!isGm && playerCharacterId && session.status !== "ended" && (
        <div className="mb-4 flex items-center gap-2">
          {isPlayerParticipant ? (
            <button
              type="button"
              onClick={handlePlayerLeave}
              disabled={removeMutation.isPending}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-meter-stress hover:bg-meter-stress/10 transition-colors disabled:opacity-50"
              aria-label="Leave session"
            >
              <UserMinus className="h-4 w-4" aria-hidden="true" />
              Leave Session
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePlayerJoin}
              disabled={addMutation.isPending}
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50"
              aria-label="Join session"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              Join Session
            </button>
          )}
        </div>
      )}

      {/* Participant list */}
      {session.participants.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-text-secondary">
          <Users className="h-8 w-8" aria-hidden="true" />
          <p className="text-sm">No participants yet.</p>
        </div>
      ) : (
        <div className="space-y-1.5 mb-4" role="table" aria-label="Participants">
          {session.participants.map((p) => (
            <ParticipantRow
              key={p.character_id}
              participant={p}
              session={session}
              isGm={isGm}
              playerCharacterId={playerCharacterId}
              onRemove={handleRemove}
              onToggleContribution={handleToggleContribution}
              isRemoving={
                removeMutation.isPending &&
                removeMutation.variables === p.character_id
              }
              isUpdating={
                updateMutation.isPending &&
                updateMutation.variables?.characterId === p.character_id
              }
            />
          ))}
        </div>
      )}

      {/* GM add participant controls */}
      {isGm && canManage && (
        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-2">
            Add Participant
          </p>
          <AddParticipantDropdown
            session={session}
            availableCharacters={availableCharacters}
            onAdd={handleAdd}
            onAddAll={handleAddAll}
            isAdding={addMutation.isPending}
          />
        </div>
      )}
    </section>
  );
}
