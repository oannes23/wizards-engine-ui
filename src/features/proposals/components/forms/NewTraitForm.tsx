"use client";

/**
 * NewTraitForm — Step 2 form for the "new_trait" action type.
 *
 * Fields:
 *   - Slot type selector (core / role) with current usage count
 *   - Mode toggle: "Pick from catalog" vs "Propose custom"
 *   - Catalog: template search + browse cards
 *   - Custom: name + description fields
 *   - Retire existing: shown when slot is full
 *   - Narrative textarea (required)
 *
 * Costs 1 Free Time.
 */

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Search, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/hooks/query-keys";
import type {
  CharacterDetailResponse,
  TraitTemplateResponse,
  PaginatedResponse,
} from "@/lib/api/types";
import { GAME_CONSTANTS } from "@/lib/constants";
import { useWizard } from "../WizardProvider";

// ── Schema ─────────────────────────────────────────────────────────

const schema = z
  .object({
    slot_type: z.enum(["core_trait", "role_trait"]),
    mode: z.enum(["catalog", "custom"]),
    template_id: z.string().optional(),
    proposed_name: z.string().optional(),
    proposed_description: z.string().optional(),
    retire_trait_id: z.string().optional(),
    narrative: z.string().min(1, "Narrative is required."),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "catalog" && !data.template_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select a trait from the catalog.",
        path: ["template_id"],
      });
    }
    if (data.mode === "custom" && !data.proposed_name?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Trait name is required for custom traits.",
        path: ["proposed_name"],
      });
    }
  });

type FormValues = z.infer<typeof schema>;

// ── Template card ──────────────────────────────────────────────────

function TemplateCard({
  template,
  selected,
  onClick,
}: {
  template: TraitTemplateResponse;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full text-left rounded-lg border p-3 flex items-start gap-2 transition-colors
        ${selected
          ? "border-brand-teal bg-brand-teal/10"
          : "border-border-default bg-bg-elevated hover:border-brand-teal/50"
        }
      `}
      aria-pressed={selected}
    >
      {selected && (
        <Check className="h-4 w-4 text-brand-teal shrink-0 mt-0.5" aria-hidden="true" />
      )}
      <div className={!selected ? "pl-6" : ""}>
        <p className="text-sm font-semibold text-text-primary">{template.name}</p>
        <p className="text-xs text-text-secondary mt-0.5">{template.description}</p>
      </div>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────

interface NewTraitFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

export function NewTraitForm({ character, onNext }: NewTraitFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["new_trait"] ?? {}) as Partial<FormValues>;

  const [templateSearch, setTemplateSearch] = useState("");

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      slot_type: savedData.slot_type ?? "core_trait",
      mode: savedData.mode ?? "catalog",
      template_id: savedData.template_id ?? "",
      proposed_name: savedData.proposed_name ?? "",
      proposed_description: savedData.proposed_description ?? "",
      retire_trait_id: savedData.retire_trait_id ?? "",
      narrative: state.narrative || savedData.narrative || "",
    },
  });

  const slotType = watch("slot_type");
  const mode = watch("mode");
  const selectedTemplateId = watch("template_id");

  // Compute slot usage
  const activeTraits = character.traits?.active ?? [];
  const coreCount = activeTraits.filter((t) => t.slot_type === "core_trait").length;
  const roleCount = activeTraits.filter((t) => t.slot_type === "role_trait").length;
  const coreLimit = GAME_CONSTANTS.CORE_TRAIT_LIMIT;
  const roleLimit = GAME_CONSTANTS.ROLE_TRAIT_LIMIT;

  const currentSlotCount = slotType === "core_trait" ? coreCount : roleCount;
  const slotLimit = slotType === "core_trait" ? coreLimit : roleLimit;
  const slotsFull = currentSlotCount >= slotLimit;
  const slotsRetireable = activeTraits.filter((t) => t.slot_type === slotType);

  // Fetch trait templates
  const { data: templatesData, isLoading: isLoadingTemplates } = useQuery({
    queryKey: queryKeys.traitTemplates.list({ type: slotType === "core_trait" ? "core" : "role" }),
    queryFn: () =>
      api.get<PaginatedResponse<TraitTemplateResponse>>("/trait-templates", {
        type: slotType === "core_trait" ? "core" : "role",
        limit: 100,
      }),
    staleTime: 60_000,
  });

  const allTemplates = (templatesData?.items ?? []) as TraitTemplateResponse[];
  const filteredTemplates = templateSearch.trim()
    ? allTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
          t.description.toLowerCase().includes(templateSearch.toLowerCase())
      )
    : allTemplates;

  function onSubmit(values: FormValues) {
    setNarrative(values.narrative);
    const payload: Record<string, unknown> = {
      slot_type: values.slot_type,
    };
    if (values.mode === "catalog" && values.template_id) {
      payload.template_id = values.template_id;
    } else if (values.mode === "custom") {
      if (values.proposed_name) payload.proposed_name = values.proposed_name;
      if (values.proposed_description) payload.proposed_description = values.proposed_description;
    }
    if (values.retire_trait_id) {
      payload.retire_trait_id = values.retire_trait_id;
    }
    onNext(payload);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {/* FT cost indicator */}
      <div className="flex items-center gap-2 rounded-md bg-meter-ft/10 border border-meter-ft/30 px-3 py-2">
        <span className="text-xs font-semibold text-meter-ft">Cost: 1 Free Time</span>
        {character.free_time !== null && (
          <span className="text-xs text-text-secondary">
            ({character.free_time} remaining)
          </span>
        )}
      </div>

      {/* Slot type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text-primary">Slot Type</label>
        <div className="flex gap-2">
          {(["core_trait", "role_trait"] as const).map((slot) => {
            const count = slot === "core_trait" ? coreCount : roleCount;
            const limit = slot === "core_trait" ? coreLimit : roleLimit;
            const label = slot === "core_trait" ? "Core Trait" : "Role Trait";
            return (
              <Controller
                key={slot}
                name="slot_type"
                control={control}
                render={({ field }) => (
                  <button
                    type="button"
                    onClick={() => {
                      field.onChange(slot);
                      setValue("template_id", "");
                      setValue("retire_trait_id", "");
                    }}
                    className={`
                      flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors
                      ${field.value === slot
                        ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                        : "border-border-default bg-bg-elevated text-text-secondary hover:border-brand-teal/50"
                      }
                    `}
                    aria-pressed={field.value === slot}
                  >
                    {label}
                    <span className="block text-xs font-normal mt-0.5">
                      {count}/{limit} slots used
                    </span>
                  </button>
                )}
              />
            );
          })}
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text-primary">Source</label>
        <div className="flex gap-2">
          {(["catalog", "custom"] as const).map((m) => (
            <Controller
              key={m}
              name="mode"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => {
                    field.onChange(m);
                    if (m === "custom") setValue("template_id", "");
                    if (m === "catalog") {
                      setValue("proposed_name", "");
                      setValue("proposed_description", "");
                    }
                  }}
                  className={`
                    flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors
                    ${field.value === m
                      ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                      : "border-border-default bg-bg-elevated text-text-secondary hover:border-brand-teal/50"
                    }
                  `}
                  aria-pressed={field.value === m}
                >
                  {m === "catalog" ? "Pick from Catalog" : "Propose Custom"}
                </button>
              )}
            />
          ))}
        </div>
      </div>

      {/* Catalog mode */}
      {mode === "catalog" && (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" aria-hidden="true" />
            <input
              type="search"
              value={templateSearch}
              onChange={(e) => setTemplateSearch(e.target.value)}
              placeholder="Search trait templates..."
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                pl-9 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
                focus:outline-none focus:ring-2 focus:ring-brand-teal
              "
              aria-label="Search trait templates"
            />
          </div>

          {isLoadingTemplates && (
            <div className="space-y-2" aria-label="Loading templates">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 rounded-lg bg-bg-elevated animate-pulse" />
              ))}
            </div>
          )}

          {!isLoadingTemplates && filteredTemplates.length === 0 && (
            <p className="text-sm text-text-secondary italic text-center py-4">
              {templateSearch ? "No templates match your search." : "No templates available."}
            </p>
          )}

          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {filteredTemplates.map((template) => (
              <Controller
                key={template.id}
                name="template_id"
                control={control}
                render={({ field }) => (
                  <TemplateCard
                    template={template}
                    selected={field.value === template.id}
                    onClick={() => field.onChange(template.id === field.value ? "" : template.id)}
                  />
                )}
              />
            ))}
          </div>

          {errors.template_id && (
            <p className="text-xs text-status-rejected" role="alert">
              {errors.template_id.message}
            </p>
          )}
        </div>
      )}

      {/* Custom mode */}
      {mode === "custom" && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-trait-name" className="text-sm font-semibold text-text-primary">
              Trait Name
              <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
            </label>
            <input
              id="new-trait-name"
              type="text"
              {...register("proposed_name")}
              placeholder="Give your trait a name..."
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
                focus:outline-none focus:ring-2 focus:ring-brand-teal
              "
              aria-describedby={errors.proposed_name ? "new-trait-name-error" : undefined}
            />
            {errors.proposed_name && (
              <p id="new-trait-name-error" className="text-xs text-status-rejected" role="alert">
                {errors.proposed_name.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="new-trait-desc" className="text-sm font-semibold text-text-primary">
              Description
              <span className="ml-1 text-text-secondary text-xs font-normal">(optional)</span>
            </label>
            <textarea
              id="new-trait-desc"
              {...register("proposed_description")}
              rows={3}
              placeholder="Describe what this trait represents and when it applies..."
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
                focus:outline-none focus:ring-2 focus:ring-brand-teal
                resize-y
              "
            />
          </div>
        </div>
      )}

      {/* Retire existing (when slot is full) */}
      {slotsFull && slotsRetireable.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-meter-plot/30 bg-meter-plot/5">
          <p className="text-xs font-semibold text-meter-plot">
            Slot Full — Retire an Existing Trait
          </p>
          <p className="text-xs text-text-secondary mb-2">
            You have {currentSlotCount}/{slotLimit} {slotType === "core_trait" ? "core" : "role"} trait slots used.
            Select a trait to retire to make room.
          </p>
          <label htmlFor="retire-trait-id" className="sr-only">
            Retire existing trait
          </label>
          <select
            id="retire-trait-id"
            {...register("retire_trait_id")}
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary
              focus:outline-none focus:ring-2 focus:ring-brand-teal
            "
          >
            <option value="">Don&apos;t retire any trait</option>
            {slotsRetireable.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.charge}/5 charges)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Narrative */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-trait-narrative" className="text-sm font-semibold text-text-primary">
          Narrative
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe how your character develops this trait during downtime.
        </p>
        <textarea
          id="new-trait-narrative"
          {...register("narrative")}
          rows={4}
          placeholder="Over the course of the downtime I have been practicing..."
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[96px]
          "
          aria-describedby={errors.narrative ? "new-trait-narrative-error" : undefined}
          aria-required="true"
        />
        {errors.narrative && (
          <p id="new-trait-narrative-error" className="text-xs text-status-rejected" role="alert">
            {errors.narrative.message}
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={goBack}
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-bg-elevated text-text-primary
            hover:bg-brand-navy-light transition-colors min-h-[40px]
          "
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>
        <button
          type="submit"
          className="
            inline-flex items-center gap-1.5 rounded-md px-4 py-2
            text-sm font-medium bg-brand-blue text-white
            hover:bg-brand-blue-light transition-colors min-h-[40px] ml-auto
          "
        >
          Next: Review
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
