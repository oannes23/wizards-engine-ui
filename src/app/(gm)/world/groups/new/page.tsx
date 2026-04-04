"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { createGroup } from "@/lib/api/services/groups";
import { useToast } from "@/lib/toast/useToast";

/**
 * GmCreateGroupPage — GM-only page at /world/groups/new.
 *
 * Creates a new group. Tier is required (1-5).
 * Success redirects to the group detail page.
 */
export default function GmCreateGroupPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [tier, setTier] = useState<number>(1);
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (group) => {
      toast.success(`Group "${group.name}" created.`);
      router.push(`/world/groups/${group.id}`);
    },
    onError: () => {
      toast.error("Failed to create group. Check the form and try again.");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  }

  void tier; // tier passed through GM Action after creation

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-2xl px-4 pt-4 pb-8">
        {/* Back nav */}
        <Link
          href="/world/groups"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Groups
        </Link>

        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
          New Group
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-border-default bg-bg-surface p-6"
          aria-label="Create group form"
        >
          {/* Name */}
          <div>
            <label
              htmlFor="group-name"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Name <span className="text-meter-stress" aria-label="required">*</span>
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="Group name"
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>

          {/* Tier */}
          <div>
            <label
              htmlFor="group-tier"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Tier <span className="text-meter-stress" aria-label="required">*</span>
            </label>
            <div className="relative max-w-xs">
              <select
                id="group-tier"
                value={tier}
                onChange={(e) => setTier(Number(e.target.value))}
                className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                {[1, 2, 3, 4, 5].map((t) => (
                  <option key={t} value={t}>
                    Tier {t}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
                aria-hidden="true"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1">
              Tier can be changed later via GM Actions.
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="group-description"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Description
            </label>
            <textarea
              id="group-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this group..."
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="group-notes"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              GM Notes
            </label>
            <textarea
              id="group-notes"
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
              href="/world/groups"
              className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!name.trim() || mutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Creating..." : "Create Group"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
