"use client";

/**
 * RestForm — Step 2 form for the "rest" action type.
 *
 * Fields:
 *   - ModifierSelector (optional: 1 core + 1 role + 1 bond = +3d)
 *   - Narrative textarea (required)
 *
 * Costs 1 Free Time.
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { CharacterDetailResponse } from "@/lib/api/types";
import { ModifierSelector, type ModifierSelections } from "../ModifierSelector";
import { useWizard } from "../WizardProvider";

// ── Schema ─────────────────────────────────────────────────────────

const schema = z.object({
  narrative: z.string().min(1, "Narrative is required."),
  modifiers: z.object({
    core_trait_id: z.string().optional(),
    role_trait_id: z.string().optional(),
    bond_id: z.string().optional(),
  }),
});

type FormValues = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────

interface RestFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

export function RestForm({ character, onNext }: RestFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["rest"] ?? {}) as Partial<FormValues>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      narrative: state.narrative || savedData.narrative || "",
      modifiers: savedData.modifiers ?? {},
    },
  });

  const modifiers = watch("modifiers") as ModifierSelections;

  function onSubmit(values: FormValues) {
    setNarrative(values.narrative);
    onNext({
      modifiers: values.modifiers,
    });
  }

  const traits = character.traits?.active ?? [];
  const bonds = character.bonds?.active ?? [];

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

      {/* Modifier selector */}
      <ModifierSelector
        traits={traits}
        bonds={bonds}
        value={modifiers}
        onChange={(val) => setValue("modifiers", val)}
      />

      {/* Narrative */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="rest-narrative" className="text-sm font-semibold text-text-primary">
          Narrative
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe how your character rests and recovers.
        </p>
        <textarea
          id="rest-narrative"
          {...register("narrative")}
          rows={4}
          placeholder="I spend the evening in quiet solitude, letting the tension of the past days drain away..."
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[96px]
          "
          aria-describedby={errors.narrative ? "rest-narrative-error" : undefined}
          aria-required="true"
        />
        {errors.narrative && (
          <p id="rest-narrative-error" className="text-xs text-status-rejected" role="alert">
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
