"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getLocation, updateLocation, deleteLocation } from "@/lib/api/services/locations";
import { useToast } from "@/lib/toast/useToast";
import { queryKeys } from "@/lib/hooks/query-keys";
import { ConfirmModal } from "@/components/ui/Modal";

/**
 * GmEditLocationPage — GM-only page at /world/locations/[id]/edit.
 *
 * Edits name, description, notes via PATCH /locations/{id}.
 * Parent changes go through GM Actions (modify_location).
 * Soft-delete with ConfirmModal.
 */
export default function GmEditLocationPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: location, isLoading, isError } = useQuery({
    queryKey: queryKeys.locations.detail(id),
    queryFn: () => getLocation(id),
    enabled: !!id,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (location) {
      setName(location.name);
      setDescription(location.description ?? "");
      setNotes(location.notes ?? "");
    }
  }, [location]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateLocation(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success(`Location "${updated.name}" updated.`);
      router.push(`/world/locations/${id}`);
    },
    onError: () => {
      toast.error("Failed to update location.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.locations.all });
      toast.success("Location deleted.");
      router.push("/world/locations");
    },
    onError: () => {
      toast.error("Failed to delete location.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" aria-label="Loading..." />
      </div>
    );
  }

  if (isError || !location) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <AlertCircle className="h-8 w-8" aria-hidden="true" />
          <p>Location not found.</p>
          <Link href="/world/locations" className="text-brand-blue hover:underline text-sm">
            Back to Locations
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
          href={`/world/locations/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {location.name}
        </Link>

        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
          Edit Location
        </h1>

        <p className="text-sm text-text-secondary mb-5 rounded-md border border-border-default bg-bg-elevated px-3 py-2">
          Parent location changes are applied via <Link href="/actions" className="text-brand-teal hover:underline">GM Actions</Link>.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          className="space-y-5 rounded-lg border border-border-default bg-bg-surface p-6"
          aria-label="Edit location form"
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
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
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
              placeholder="Brief description..."
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
              Delete Location
            </button>
            <div className="flex items-center gap-3">
              <Link
                href={`/world/locations/${id}`}
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
        title="Delete Location"
        message={`Are you sure you want to delete "${location.name}"? This will soft-delete the location and remove it from all lists.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        variant="danger"
      />
    </div>
  );
}
