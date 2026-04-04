"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";
import { createLocation, listLocations } from "@/lib/api/services/locations";
import { useToast } from "@/lib/toast/useToast";
import { queryKeys } from "@/lib/hooks/query-keys";

/**
 * GmCreateLocationPage — GM-only page at /world/locations/new.
 *
 * Creates a new location with optional parent_id location picker.
 * Success redirects to the location detail page.
 */
export default function GmCreateLocationPage() {
  const router = useRouter();
  const toast = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch locations for the parent picker
  const { data: locationsData } = useQuery({
    queryKey: queryKeys.locations.list(),
    queryFn: () => listLocations({ limit: 100 }),
  });

  const locations = locationsData?.items ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      createLocation({
        name: name.trim(),
        description: description.trim() || undefined,
        parent_id: parentId || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (location) => {
      toast.success(`Location "${location.name}" created.`);
      router.push(`/world/locations/${location.id}`);
    },
    onError: () => {
      toast.error("Failed to create location. Check the form and try again.");
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
          href="/world/locations"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Locations
        </Link>

        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
          New Location
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg border border-border-default bg-bg-surface p-6"
          aria-label="Create location form"
        >
          {/* Name */}
          <div>
            <label
              htmlFor="loc-name"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Name <span className="text-meter-stress" aria-label="required">*</span>
            </label>
            <input
              id="loc-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
              placeholder="Location name"
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
          </div>

          {/* Parent location */}
          <div>
            <label
              htmlFor="loc-parent"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Parent Location
            </label>
            <div className="relative">
              <select
                id="loc-parent"
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
              >
                <option value="">None (top-level)</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="loc-description"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              Description
            </label>
            <textarea
              id="loc-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief description of this location..."
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="loc-notes"
              className="block text-sm font-medium text-text-primary mb-1.5"
            >
              GM Notes
            </label>
            <textarea
              id="loc-notes"
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
              href="/world/locations"
              className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!name.trim() || mutation.isPending}
              className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {mutation.isPending ? "Creating..." : "Create Location"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
