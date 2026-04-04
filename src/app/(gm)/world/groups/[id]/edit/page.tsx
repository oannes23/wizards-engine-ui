"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { getGroup, updateGroup, deleteGroup } from "@/lib/api/services/groups";
import { useToast } from "@/lib/toast/useToast";
import { queryKeys } from "@/lib/hooks/query-keys";
import { ConfirmModal } from "@/components/ui/Modal";

/**
 * GmEditGroupPage — GM-only page at /world/groups/[id]/edit.
 *
 * Edits name, description, notes via PATCH /groups/{id}.
 * Soft-delete with ConfirmModal.
 * Tier changes go through GM Actions.
 */
export default function GmEditGroupPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: group, isLoading, isError } = useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => getGroup(id),
    enabled: !!id,
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (group) {
      setName(group.name);
      setDescription(group.description ?? "");
      setNotes(group.notes ?? "");
    }
  }, [group]);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateGroup(id, {
        name: name.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      toast.success(`Group "${updated.name}" updated.`);
      router.push(`/world/groups/${id}`);
    },
    onError: () => {
      toast.error("Failed to update group.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups.all });
      toast.success("Group deleted.");
      router.push("/world/groups");
    },
    onError: () => {
      toast.error("Failed to delete group.");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-brand-teal" aria-label="Loading..." />
      </div>
    );
  }

  if (isError || !group) {
    return (
      <div className="min-h-screen bg-bg-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-text-secondary">
          <AlertCircle className="h-8 w-8" aria-hidden="true" />
          <p>Group not found.</p>
          <Link href="/world/groups" className="text-brand-blue hover:underline text-sm">
            Back to Groups
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
          href={`/world/groups/${id}`}
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {group.name}
        </Link>

        <h1 className="font-heading text-2xl font-bold text-text-primary mb-6">
          Edit Group
        </h1>

        <p className="text-sm text-text-secondary mb-5 rounded-md border border-border-default bg-bg-elevated px-3 py-2">
          Tier changes are applied via <Link href="/actions" className="text-brand-teal hover:underline">GM Actions</Link>.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); updateMutation.mutate(); }}
          className="space-y-5 rounded-lg border border-border-default bg-bg-surface p-6"
          aria-label="Edit group form"
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
              className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
            />
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
              placeholder="Brief description..."
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
              Delete Group
            </button>
            <div className="flex items-center gap-3">
              <Link
                href={`/world/groups/${id}`}
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
        title="Delete Group"
        message={`Are you sure you want to delete "${group.name}"? This will soft-delete the group and remove it from all lists.`}
        confirmLabel="Delete"
        onConfirm={() => deleteMutation.mutate()}
        variant="danger"
      />
    </div>
  );
}
