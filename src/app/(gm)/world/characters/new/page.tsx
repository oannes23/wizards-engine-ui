"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createCharacter } from "@/lib/api/services/characters";
import { useToast } from "@/lib/toast/useToast";

/**
 * GmCreateCharacterPage — GM-only page at /world/characters/new.
 *
 * Creates a simplified (NPC) character.
 * Success redirects to the character detail page.
 */
export default function GmCreateCharacterPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createCharacter({
        name: name.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (character) => {
      toast.success(`Character "${character.name}" created.`);
      router.push(`/world/characters/${character.id}`);
    },
    onError: () => {
      toast.error("Failed to create character. Check the form and try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  }

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8">
        {/* Back nav */}
        <Link
          href="/world/characters"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Characters
        </Link>

        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
          New Character (NPC)
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-border-default bg-bg-surface p-6"
          aria-label="Create character form"
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
              autoFocus
              placeholder="Character name"
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
              placeholder="Brief description of this character..."
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
              placeholder="Private notes for the GM..."
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/world/characters"
              className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!name.trim() || mutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Creating..." : "Create Character"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
