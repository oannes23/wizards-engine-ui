"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getCharacter, updateCharacter, deleteCharacter } from "@/lib/api/services/characters";
import { useToast } from "@/lib/toast/useToast";
import { queryKeys } from "@/lib/hooks/query-keys";
import { ConfirmModal } from "@/components/ui/Modal";

/**
 * GmEditCharacterPage — GM-only page at /world/characters/[id]/edit.
 *
 * Edits name, description, notes via PATCH /characters/{id}.
 * Soft-delete with ConfirmModal.
 */
export default function GmEditCharacterPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: character, isLoading, isError } = useQuery({
    queryKey: queryKeys.characters.detail(id),
    queryFn: () => getCharacter(id),
    enabled: !!id,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (character) {
      setName(character.name);
      setDescription(character.description ?? "");
      setNotes(character.notes ?? "");
    }
  }, [character]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCharacter(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all });
      toast.success(`Character "${updated.name}" updated.`);
      router.push(`/world/characters/${id}`);
    },
    onError: () => {
      toast.error("Failed to update character.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCharacter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.characters.all });
      toast.success("Character deleted.");
      router.push("/world/characters");
    },
    onError: () => {
      toast.error("Failed to delete character.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" aria-label="Loading..." />
      </div>
    );
  }

  if (isError || !character) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <AlertCircle className="h-8 w-8" aria-hidden="true" />
          <p>Character not found.</p>
          <Link href="/world/characters" className="text-brand-blue hover:underline text-sm">
            Back to Characters
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8">
        {/* Back nav */}
        <Link
          href={`/world/characters/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {character.name}
        </Link>

        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
          Edit Character
        </h1>

        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          className="space-y-5 rounded-lg border border-border-default bg-bg-surface p-6"
          aria-label="Edit character form"
        >
          {/* Name */}
          <div>
            <label
              htmlFor="char-name"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Name <span className="text-meter-stress" aria-label="required">*</span>
            </label>
            <input
              id="char-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="char-description"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Description
            </label>
            <textarea
              id="char-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description..."
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="char-notes"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              GM Notes
            </label>
            <textarea
              id="char-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Private notes..."
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              className="rounded-md px-3 py-2 text-sm font-medium text-meter-stress hover:bg-meter-stress/10 transition-colors"
            >
              Delete Character
            </button>
            <div className="flex items-center gap-3">
              <Link
                href={`/world/characters/${id}`}
                className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={!name.trim() || updateMutation.isPending}
                className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <ConfirmModal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete Character"
        message={`Are you sure you want to delete "${character.name}"? This action can be undone by the backend but removes the character from all lists.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        variant="danger"
      />
    </div>
  );
}
