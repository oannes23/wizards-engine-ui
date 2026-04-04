"use client";

/**
 * NewBondForm — Step 2 form for the "new_bond" action type.
 *
 * Fields:
 *   - Target type selector (character / group / location)
 *   - Entity search (searchable select filtered by target type)
 *   - Bond name (optional)
 *   - Bond description (optional)
 *   - Retire existing (when at PC_BOND_LIMIT)
 *   - Narrative textarea (required)
 *
 * Costs 1 Free Time.
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/hooks/query-keys";
import type {
  CharacterDetailResponse,
  GameObjectType,
  PaginatedResponse,
  GroupDetailResponse,
  LocationDetailResponse,
} from "@/lib/api/types";
import { GAME_CONSTANTS } from "@/lib/constants";
import { useWizard } from "../WizardProvider";
import { listCharacters } from "@/lib/api/services/characters";

// ── Schema ─────────────────────────────────────────────────────────

const schema = z.object({
  target_type: z.enum(["character", "group", "location"]),
  target_id: z.string().min(1, "Please select a target entity."),
  name: z.string().optional(),
  description: z.string().optional(),
  retire_bond_id: z.string().optional(),
  narrative: z.string().min(1, "Narrative is required."),
});

type FormValues = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────

interface NewBondFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

const TARGET_TYPE_LABELS: Record<GameObjectType, string> = {
  character: "Character",
  group: "Group",
  location: "Location",
};

export function NewBondForm({ character, onNext }: NewBondFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["new_bond"] ?? {}) as Partial<FormValues>;

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
      target_type: savedData.target_type ?? "character",
      target_id: savedData.target_id ?? "",
      name: savedData.name ?? "",
      description: savedData.description ?? "",
      retire_bond_id: savedData.retire_bond_id ?? "",
      narrative: state.narrative || savedData.narrative || "",
    },
  });

  const targetType = watch("target_type");

  // Fetch entities by target type
  const { data: charactersData, isLoading: isLoadingChars } = useQuery({
    queryKey: queryKeys.characters.list({ limit: 100 }),
    queryFn: () => listCharacters({ limit: 100 }),
    enabled: targetType === "character",
    staleTime: 30_000,
  });

  const { data: groupsData, isLoading: isLoadingGroups } = useQuery({
    queryKey: queryKeys.groups.list({ limit: 100 }),
    queryFn: () =>
      api.get<PaginatedResponse<GroupDetailResponse>>("/groups", { limit: 100 }),
    enabled: targetType === "group",
    staleTime: 30_000,
  });

  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: queryKeys.locations.list({ limit: 100 }),
    queryFn: () =>
      api.get<PaginatedResponse<LocationDetailResponse>>("/locations", { limit: 100 }),
    enabled: targetType === "location",
    staleTime: 30_000,
  });

  const isLoadingEntities = isLoadingChars || isLoadingGroups || isLoadingLocations;

  type EntityOption = { id: string; name: string };

  let entityOptions: EntityOption[] = [];
  if (targetType === "character") {
    entityOptions = (charactersData?.items ?? []).map((c) => ({ id: c.id, name: c.name }));
  } else if (targetType === "group") {
    entityOptions = (groupsData?.items ?? []).map((g) => ({ id: g.id, name: g.name }));
  } else if (targetType === "location") {
    entityOptions = (locationsData?.items ?? []).map((l) => ({ id: l.id, name: l.name }));
  }

  // Bond limit check
  const activeBonds = character.bonds?.active ?? [];
  const bondCount = activeBonds.filter((b) => b.is_active).length;
  const bondLimit = GAME_CONSTANTS.PC_BOND_LIMIT;
  const atBondLimit = bondCount >= bondLimit;

  function onSubmit(values: FormValues) {
    setNarrative(values.narrative);
    const payload: Record<string, unknown> = {
      target_type: values.target_type,
      target_id: values.target_id,
    };
    if (values.name?.trim()) payload.name = values.name.trim();
    if (values.description?.trim()) payload.description = values.description.trim();
    if (values.retire_bond_id) payload.retire_bond_id = values.retire_bond_id;
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

      {/* Target type selector */}
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-text-primary">Bond Target Type</label>
        <div className="flex gap-2">
          {(["character", "group", "location"] as const).map((type) => (
            <Controller
              key={type}
              name="target_type"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  onClick={() => {
                    field.onChange(type);
                    setValue("target_id", "");
                  }}
                  className={`
                    flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors
                    ${field.value === type
                      ? "border-brand-teal bg-brand-teal/10 text-brand-teal"
                      : "border-border-default bg-bg-elevated text-text-secondary hover:border-brand-teal/50"
                    }
                  `}
                  aria-pressed={field.value === type}
                >
                  {TARGET_TYPE_LABELS[type]}
                </button>
              )}
            />
          ))}
        </div>
      </div>

      {/* Entity search / select */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bond-target-id" className="text-sm font-semibold text-text-primary">
          {TARGET_TYPE_LABELS[targetType]}
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <Controller
          name="target_id"
          control={control}
          render={({ field }) => (
            <select
              id="bond-target-id"
              {...field}
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-2 text-sm text-text-primary
                focus:outline-none focus:ring-2 focus:ring-brand-teal
              "
              aria-describedby={errors.target_id ? "bond-target-error" : undefined}
            >
              <option value="">
                {isLoadingEntities
                  ? `Loading ${TARGET_TYPE_LABELS[targetType].toLowerCase()}s...`
                  : `Select a ${TARGET_TYPE_LABELS[targetType].toLowerCase()}...`}
              </option>
              {entityOptions.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.target_id && (
          <p id="bond-target-error" className="text-xs text-status-rejected" role="alert">
            {errors.target_id.message}
          </p>
        )}
      </div>

      {/* Optional bond name and description */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bond-name" className="text-sm font-semibold text-text-primary">
            Bond Name
            <span className="ml-1 text-text-secondary text-xs font-normal">(optional)</span>
          </label>
          <input
            id="bond-name"
            type="text"
            {...register("name")}
            placeholder="e.g. Mentor, Rival, Sworn Ally..."
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:outline-none focus:ring-2 focus:ring-brand-teal
            "
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="bond-desc" className="text-sm font-semibold text-text-primary">
            Bond Description
            <span className="ml-1 text-text-secondary text-xs font-normal">(optional)</span>
          </label>
          <textarea
            id="bond-desc"
            {...register("description")}
            rows={2}
            placeholder="Describe the nature of this relationship..."
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
              focus:outline-none focus:ring-2 focus:ring-brand-teal
              resize-y
            "
          />
        </div>
      </div>

      {/* Retire existing bond (when at limit) */}
      {atBondLimit && activeBonds.length > 0 && (
        <div className="flex flex-col gap-1.5 p-3 rounded-lg border border-meter-plot/30 bg-meter-plot/5">
          <p className="text-xs font-semibold text-meter-plot">
            Bond Limit Reached — Retire an Existing Bond
          </p>
          <p className="text-xs text-text-secondary mb-2">
            You have {bondCount}/{bondLimit} bonds. Select one to retire to make room.
          </p>
          <label htmlFor="retire-bond-id" className="sr-only">
            Retire existing bond
          </label>
          <select
            id="retire-bond-id"
            {...register("retire_bond_id")}
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary
              focus:outline-none focus:ring-2 focus:ring-brand-teal
            "
          >
            <option value="">Don&apos;t retire any bond</option>
            {activeBonds.filter((b) => !b.is_trauma).map((b) => (
              <option key={b.id} value={b.id}>
                {b.target_name} — {b.label || "bond"} ({b.charges ?? 0} charges)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Narrative */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="new-bond-narrative" className="text-sm font-semibold text-text-primary">
          Narrative
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe how this bond forms during your downtime.
        </p>
        <textarea
          id="new-bond-narrative"
          {...register("narrative")}
          rows={4}
          placeholder="During the downtime I sought out..."
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[96px]
          "
          aria-describedby={errors.narrative ? "new-bond-narrative-error" : undefined}
          aria-required="true"
        />
        {errors.narrative && (
          <p id="new-bond-narrative-error" className="text-xs text-status-rejected" role="alert">
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
