"use client";

import { useState } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import {
  listTraitTemplates,
  createTraitTemplate,
  updateTraitTemplate,
  deleteTraitTemplate,
} from "@/lib/api/services/traitTemplates";
import { queryKeys } from "@/lib/hooks/query-keys";
import { useToast } from "@/lib/toast/useToast";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import type { TraitTemplateResponse, TraitTemplateType } from "@/lib/api/types";

// ── Type Badge ────────────────────────────────────────────────────

function TypeBadge({ type }: { type: TraitTemplateType }) {
  const styles: Record<TraitTemplateType, string> = {
    core: "bg-brand-blue/20 text-brand-blue",
    role: "bg-brand-teal/20 text-brand-teal",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${styles[type]}`}>
      {type}
    </span>
  );
}

// ── Create Template Form ──────────────────────────────────────────

interface CreateTemplateFormProps {
  onClose: () => void;
}

function CreateTemplateForm({ onClose }: CreateTemplateFormProps) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<TraitTemplateType>("core");

  const mutation = useMutation({
    mutationFn: () =>
      createTraitTemplate({ name: name.trim(), description: description.trim(), type }),
    onSuccess: (template) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.traitTemplates.all });
      toast.success(`Template "${template.name}" created.`);
      onClose();
    },
    onError: () => {
      toast.error("Failed to create template.");
    },
  });

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}
      className="rounded-lg border border-border-default bg-bg-surface p-5 space-y-4 mb-6"
      aria-label="Create template form"
    >
      <h3 className="font-heading font-bold text-text-primary">New Template</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label htmlFor="tpl-name" className="block text-sm font-medium text-text-primary mb-1.5">
            Name <span className="text-meter-stress" aria-label="required">*</span>
          </label>
          <input
            id="tpl-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            placeholder="Template name"
            className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </div>
        <div>
          <label htmlFor="tpl-type" className="block text-sm font-medium text-text-primary mb-1.5">
            Type <span className="text-meter-stress" aria-label="required">*</span>
          </label>
          <div className="relative">
            <select
              id="tpl-type"
              value={type}
              onChange={(e) => setType(e.target.value as TraitTemplateType)}
              className="appearance-none w-full rounded-md border border-border-default bg-bg-page pl-3 pr-8 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
            >
              <option value="core">Core</option>
              <option value="role">Role</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
          </div>
          <p className="text-xs text-text-secondary mt-1">Immutable after creation.</p>
        </div>
      </div>

      <div>
        <label htmlFor="tpl-description" className="block text-sm font-medium text-text-primary mb-1.5">
          Description <span className="text-meter-stress" aria-label="required">*</span>
        </label>
        <textarea
          id="tpl-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          required
          placeholder="Describe what this trait template represents..."
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
        />
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!name.trim() || !description.trim() || mutation.isPending}
          className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? "Creating..." : "Create Template"}
        </button>
      </div>
    </form>
  );
}

// ── Template Row ──────────────────────────────────────────────────

interface TemplateRowProps {
  template: TraitTemplateResponse;
}

function TemplateRow({ template }: TemplateRowProps) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(template.name);
  const [description, setDescription] = useState(template.description);

  const updateMutation = useMutation({
    mutationFn: () =>
      updateTraitTemplate(template.id, {
        name: name.trim(),
        description: description.trim(),
      }),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.traitTemplates.all });
      toast.success(`Template "${updated.name}" updated.`);
      setEditing(false);
    },
    onError: () => {
      toast.error("Failed to update template.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTraitTemplate(template.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.traitTemplates.all });
      toast.success("Template deleted.");
    },
    onError: () => {
      toast.error("Failed to delete template.");
    },
  });

  function handleCancelEdit() {
    setName(template.name);
    setDescription(template.description);
    setEditing(false);
  }

  if (editing) {
    return (
      <tr className="border-b border-border-default">
        <td className="px-4 py-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            aria-label="Template name"
            className="w-full rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus"
          />
        </td>
        <td className="px-4 py-3">
          <TypeBadge type={template.type} />
          <span className="text-xs text-text-secondary ml-1">(immutable)</span>
        </td>
        <td className="px-4 py-3" colSpan={2}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            aria-label="Template description"
            className="w-full rounded-md border border-border-default bg-bg-page px-2 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-border-focus resize-y"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
              aria-label="Save template"
              className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              Save
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              aria-label="Cancel edit"
              className="inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs font-medium text-text-secondary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border-default hover:bg-bg-elevated/30 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-text-primary">{template.name}</td>
      <td className="px-4 py-3">
        <TypeBadge type={template.type} />
      </td>
      <td className="px-4 py-3 text-sm text-text-secondary max-w-sm">
        {template.description}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1 justify-end">
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={`Edit template ${template.name}`}
            className="rounded-md p-1.5 text-text-secondary hover:text-brand-teal hover:bg-brand-teal/10 transition-colors"
          >
            <Edit2 className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            aria-label={`Delete template ${template.name}`}
            className="rounded-md p-1.5 text-text-secondary hover:text-meter-stress hover:bg-meter-stress/10 transition-colors"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
          {/* ConfirmModal uses Radix Portal — renders to document.body, not <td> */}
          <ConfirmModal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title="Delete Template"
            message={`Delete "${template.name}"? This will soft-delete the template. Existing traits created from this template are not affected.`}
            confirmLabel="Delete"
            onConfirm={() => deleteMutation.mutate()}
            variant="danger"
          />
        </div>
      </td>
    </tr>
  );
}

// ── Page ──────────────────────────────────────────────────────────

type TemplateFilter = "all" | "core" | "role";

/**
 * GmTemplatesPage — GM-only page at /templates.
 *
 * List + inline create + inline edit of trait templates.
 * Type filter (All/Core/Role). Soft-delete with ConfirmModal.
 */
export default function GmTemplatesPage() {
  const [filter, setFilter] = useState<TemplateFilter>("all");
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: queryKeys.traitTemplates.list({ filter }),
    queryFn: () =>
      listTraitTemplates({
        type: filter !== "all" ? (filter as TraitTemplateType) : undefined,
        limit: 200,
      }),
  });

  const templates = data?.items ?? [];

  const filterTabs: Array<{ value: TemplateFilter; label: string }> = [
    { value: "all", label: "All" },
    { value: "core", label: "Core" },
    { value: "role", label: "Role" },
  ];

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-4xl px-4 pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-text-primary">
              Trait Templates
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">
              Reusable templates for creating character traits
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors"
            aria-expanded={showCreate}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            New Template
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <CreateTemplateForm onClose={() => setShowCreate(false)} />
        )}

        {/* Filter tabs */}
        <div
          role="tablist"
          aria-label="Template type filter"
          className="flex items-center gap-1 mb-5 border-b border-border-default"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              role="tab"
              aria-selected={filter === tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                filter === tab.value
                  ? "border-brand-teal text-brand-teal"
                  : "border-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 rounded-lg border border-border-default bg-bg-surface animate-pulse"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {isError && (
          <EmptyState
            icon={<AlertCircle className="h-8 w-8" />}
            title="Could not load templates"
            description="An error occurred fetching trait templates."
          />
        )}

        {!isLoading && !isError && templates.length === 0 && (
          <EmptyState
            icon={<BookOpen className="h-8 w-8" />}
            title="No templates"
            description={
              filter !== "all"
                ? `No ${filter} templates. Create one above.`
                : "No trait templates yet. Create one to get started."
            }
          />
        )}

        {!isLoading && !isError && templates.length > 0 && (
          <div className="rounded-lg border border-border-default bg-bg-surface overflow-hidden">
            <table className="w-full" aria-label="Trait templates">
              <thead>
                <tr className="border-b border-border-default bg-bg-elevated/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Description
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-text-secondary">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {templates.map((template) => (
                  <TemplateRow key={template.id} template={template} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
