"use client";

/**
 * ChargeMagicForm — Step 2 form for the "charge_magic" action type.
 *
 * Fields (per proposals.md charge_magic selections):
 *   - Effect selector (charged effects only — MVP, per magic.md decision)
 *   - Intention textarea
 *   - Symbolism textarea
 *   - SacrificeBuilder (embedded inline)
 *   - ModifierSelector (max +3d)
 *
 * Narrative is optional for session actions.
 * Dice pool = sacrifice dice + modifier dice.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { CharacterDetailResponse } from "@/lib/api/types";
import { ModifierSelector, type ModifierSelections } from "../ModifierSelector";
import {
  SacrificeBuilder,
  emptySacrificeValue,
  buildSacrificePayload,
  type SacrificeBuilderValue,
} from "../SacrificeBuilder";
import { equivToDice, computeTotalEquiv } from "../../lib/sacrificeMath";
import { useWizard } from "../WizardProvider";

// ── Schema ─────────────────────────────────────────────────────────

const schema = z.object({
  effect_id: z.string().min(1, "Please select an effect to charge."),
  intention: z.string().min(1, "Intention is required."),
  symbolism: z.string().min(1, "Symbolism is required."),
  modifiers: z.object({
    core_trait_id: z.string().optional(),
    role_trait_id: z.string().optional(),
    bond_id: z.string().optional(),
  }),
  narrative: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────

interface ChargeMagicFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

export function ChargeMagicForm({ character, onNext }: ChargeMagicFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["charge_magic"] ?? {}) as Partial<FormValues>;

  // Sacrifice state is managed separately
  const savedSacrifice =
    (state.formData["charge_magic"] as { _sacrifice?: SacrificeBuilderValue } | undefined)
      ?._sacrifice ?? emptySacrificeValue();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      effect_id: savedData.effect_id ?? "",
      intention: savedData.intention ?? "",
      symbolism: savedData.symbolism ?? "",
      modifiers: savedData.modifiers ?? {},
      narrative: state.narrative || savedData.narrative || "",
    },
  });

  const modifiers = watch("modifiers") as ModifierSelections;
  const [sacrifice, setSacrifice] = useState<SacrificeBuilderValue>(savedSacrifice);

  // Compute dice pool
  const magicStats = character.magic_stats ?? null;
  const totalEquiv = computeTotalEquiv(sacrifice.amounts, magicStats);
  const sacrificeDice = equivToDice(totalEquiv);
  const modifierCount =
    (modifiers?.core_trait_id ? 1 : 0) +
    (modifiers?.role_trait_id ? 1 : 0) +
    (modifiers?.bond_id ? 1 : 0);
  const totalDice = sacrificeDice + modifierCount;

  const traits = character.traits?.active ?? [];
  const bonds = character.bonds?.active ?? [];

  // MVP: only charged effects are selectable (magic.md decision)
  const chargedEffects = (character.magic_effects?.active ?? []).filter(
    (e) => e.effect_type === "charged" && e.is_active
  );

  function onSubmit(values: FormValues) {
    if (values.narrative) {
      setNarrative(values.narrative);
    }
    onNext({
      effect_id: values.effect_id,
      intention: values.intention,
      symbolism: values.symbolism,
      sacrifice: buildSacrificePayload(sacrifice.amounts, sacrifice.creativeDescription),
      modifiers: values.modifiers,
      // Store sacrifice state for draft restore
      _sacrifice: sacrifice,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {/* Effect selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="charge-magic-effect" className="text-sm font-semibold text-text-primary">
          Effect to Charge
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          Select the active charged effect you want to recharge.
        </p>
        {chargedEffects.length === 0 ? (
          <div className="rounded-md border border-border-default bg-bg-elevated px-3 py-3 text-sm text-text-secondary">
            No charged effects available. Create one with use_magic first.
          </div>
        ) : (
          <select
            id="charge-magic-effect"
            {...register("effect_id")}
            className="
              w-full rounded-md border border-border-default bg-bg-elevated
              px-3 py-2 text-sm text-text-primary
              focus:outline-none focus:ring-2 focus:ring-brand-teal
              appearance-none
            "
            aria-describedby={errors.effect_id ? "charge-magic-effect-error" : undefined}
            aria-required="true"
          >
            <option value="">Select an effect…</option>
            {chargedEffects.map((effect) => (
              <option key={effect.id} value={effect.id}>
                {effect.name} ({effect.charges_current ?? 0}/{effect.charges_max ?? 0} charges, Lv{" "}
                {effect.power_level})
              </option>
            ))}
          </select>
        )}
        {errors.effect_id && (
          <p id="charge-magic-effect-error" className="text-xs text-status-rejected" role="alert">
            {errors.effect_id.message}
          </p>
        )}
      </div>

      {/* Intention */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="charge-magic-intention" className="text-sm font-semibold text-text-primary">
          Intention
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">What should this charging ritual accomplish?</p>
        <textarea
          id="charge-magic-intention"
          {...register("intention")}
          rows={2}
          placeholder="I want to restore the ward to full strength…"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[64px]
          "
          aria-describedby={errors.intention ? "charge-magic-intention-error" : undefined}
          aria-required="true"
        />
        {errors.intention && (
          <p id="charge-magic-intention-error" className="text-xs text-status-rejected" role="alert">
            {errors.intention.message}
          </p>
        )}
      </div>

      {/* Symbolism */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="charge-magic-symbolism" className="text-sm font-semibold text-text-primary">
          Symbolism
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">How does the charging ritual manifest?</p>
        <textarea
          id="charge-magic-symbolism"
          {...register("symbolism")}
          rows={2}
          placeholder="I press my palms to the sigil and feel warmth flow through…"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[64px]
          "
          aria-describedby={errors.symbolism ? "charge-magic-symbolism-error" : undefined}
          aria-required="true"
        />
        {errors.symbolism && (
          <p id="charge-magic-symbolism-error" className="text-xs text-status-rejected" role="alert">
            {errors.symbolism.message}
          </p>
        )}
      </div>

      {/* Sacrifice Builder */}
      <SacrificeBuilder character={character} value={sacrifice} onChange={setSacrifice} />

      {/* Modifier selector */}
      <ModifierSelector
        traits={traits}
        bonds={bonds}
        value={modifiers ?? {}}
        onChange={(val) => setValue("modifiers", val)}
      />

      {/* Dice pool preview */}
      <div
        aria-live="polite"
        aria-label="Dice pool preview"
        className="
          rounded-md bg-bg-elevated border border-border-default
          px-4 py-3 flex items-center justify-between
        "
      >
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-text-secondary">
            {sacrificeDice}d from sacrifices
            {modifierCount > 0 && (
              <span className="text-brand-teal">
                {" "}+ {modifierCount} modifier{modifierCount !== 1 ? "s" : ""}
              </span>
            )}
          </span>
        </div>
        <span className="text-xl font-bold tabular-nums text-text-primary">
          {totalDice}d
        </span>
      </div>

      {/* Narrative (optional for session actions) */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="charge-magic-narrative"
          className="text-sm font-semibold text-text-primary"
        >
          Narrative
          <span className="ml-1.5 text-xs text-text-secondary font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe your character performing the ritual.
        </p>
        <textarea
          id="charge-magic-narrative"
          {...register("narrative")}
          rows={3}
          placeholder="I retreat to my sanctum and spend the night weaving the strands back together…"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[80px]
          "
        />
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
