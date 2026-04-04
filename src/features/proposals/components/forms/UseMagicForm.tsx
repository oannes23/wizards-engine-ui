"use client";

/**
 * UseMagicForm — Step 2 form for the "use_magic" action type.
 *
 * Fields (per proposals.md use_magic selections):
 *   - Magic stat selector (5 stats with current level)
 *   - Intention textarea (what the magic should accomplish)
 *   - Symbolism textarea (how the magic manifests)
 *   - SacrificeBuilder (embedded inline)
 *   - ModifierSelector (max +3d)
 *
 * Narrative is optional for session actions.
 * Dice pool = sacrifice dice + modifier dice.
 * No FT cost (FT may be sacrificed but is a player choice).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { CharacterDetailResponse, MagicStatName } from "@/lib/api/types";
import { ModifierSelector, type ModifierSelections } from "../ModifierSelector";
import {
  SacrificeBuilder,
  emptySacrificeValue,
  buildSacrificePayload,
  type SacrificeBuilderValue,
} from "../SacrificeBuilder";
import { equivToDice, computeTotalEquiv } from "../../lib/sacrificeMath";
import { useWizard } from "../WizardProvider";

// ── Magic stat display metadata ────────────────────────────────────

const MAGIC_STAT_LABELS: Record<MagicStatName, string> = {
  being: "Being",
  wyrding: "Wyrding",
  summoning: "Summoning",
  enchanting: "Enchanting",
  dreaming: "Dreaming",
};

const ALL_MAGIC_STATS: MagicStatName[] = [
  "being",
  "wyrding",
  "summoning",
  "enchanting",
  "dreaming",
];

// ── Schema ─────────────────────────────────────────────────────────

const schema = z.object({
  magic_stat: z
    .string()
    .refine(
      (v) => ["being", "wyrding", "summoning", "enchanting", "dreaming"].includes(v),
      { message: "Please select a magic stat." }
    ),
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

interface UseMagicFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

export function UseMagicForm({ character, onNext }: UseMagicFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["use_magic"] ?? {}) as Partial<FormValues>;

  // Sacrifice state is managed separately (not in react-hook-form — too complex)
  const savedSacrifice =
    (state.formData["use_magic"] as { _sacrifice?: SacrificeBuilderValue } | undefined)
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
      magic_stat: (savedData.magic_stat as MagicStatName | undefined) ?? undefined,
      intention: savedData.intention ?? "",
      symbolism: savedData.symbolism ?? "",
      modifiers: savedData.modifiers ?? {},
      narrative: state.narrative || savedData.narrative || "",
    },
  });

  const modifiers = watch("modifiers") as ModifierSelections;

  // Sacrifice state (local, synced to wizard on submit)
  const [sacrifice, setSacrifice] = useLocalState<SacrificeBuilderValue>(savedSacrifice);

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

  // Active magic effects count warning
  const activeEffectCount = character.active_magic_effects_count ?? 0;
  const atEffectLimit = activeEffectCount >= 9;

  function onSubmit(values: FormValues) {
    if (values.narrative) {
      setNarrative(values.narrative);
    }
    onNext({
      magic_stat: values.magic_stat,
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
      {/* Effect limit warning */}
      {atEffectLimit && (
        <div className="rounded-md bg-meter-plot/10 border border-meter-plot/30 px-3 py-2">
          <p className="text-xs text-meter-plot font-medium">
            You have {activeEffectCount}/9 active effects — this spell may create a new one.
            Instant spells are not affected.
          </p>
        </div>
      )}

      {/* Magic stat selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="use-magic-stat" className="text-sm font-semibold text-text-primary">
          Magic Stat
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          The magical discipline you are drawing on. The GM may override this.
        </p>
        <select
          id="use-magic-stat"
          {...register("magic_stat")}
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            appearance-none
          "
          aria-describedby={errors.magic_stat ? "use-magic-stat-error" : undefined}
          aria-required="true"
        >
          <option value="">Select a magic stat…</option>
          {ALL_MAGIC_STATS.map((stat) => {
            const level = magicStats ? magicStats[stat]?.level ?? 0 : 0;
            return (
              <option key={stat} value={stat}>
                {MAGIC_STAT_LABELS[stat]} (Level {level})
              </option>
            );
          })}
        </select>
        {errors.magic_stat && (
          <p id="use-magic-stat-error" className="text-xs text-status-rejected" role="alert">
            {errors.magic_stat.message}
          </p>
        )}
      </div>

      {/* Intention */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="use-magic-intention" className="text-sm font-semibold text-text-primary">
          Intention
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">What should this magic accomplish?</p>
        <textarea
          id="use-magic-intention"
          {...register("intention")}
          rows={2}
          placeholder="I want to find a hidden route through the city…"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[64px]
          "
          aria-describedby={errors.intention ? "use-magic-intention-error" : undefined}
          aria-required="true"
        />
        {errors.intention && (
          <p id="use-magic-intention-error" className="text-xs text-status-rejected" role="alert">
            {errors.intention.message}
          </p>
        )}
      </div>

      {/* Symbolism */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="use-magic-symbolism" className="text-sm font-semibold text-text-primary">
          Symbolism
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">How does the magic manifest?</p>
        <textarea
          id="use-magic-symbolism"
          {...register("symbolism")}
          rows={2}
          placeholder="Silver threads of moonlight show me the way…"
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[64px]
          "
          aria-describedby={errors.symbolism ? "use-magic-symbolism-error" : undefined}
          aria-required="true"
        />
        {errors.symbolism && (
          <p id="use-magic-symbolism-error" className="text-xs text-status-rejected" role="alert">
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
              <span className="text-brand-teal"> + {modifierCount} modifier{modifierCount !== 1 ? "s" : ""}</span>
            )}
          </span>
        </div>
        <span className="text-xl font-bold tabular-nums text-text-primary">
          {totalDice}d
        </span>
      </div>

      {/* Narrative (optional for session actions) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="use-magic-narrative" className="text-sm font-semibold text-text-primary">
          Narrative
          <span className="ml-1.5 text-xs text-text-secondary font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe your character performing the magic.
        </p>
        <textarea
          id="use-magic-narrative"
          {...register("narrative")}
          rows={3}
          placeholder="I close my eyes and reach into the dreaming…"
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

// ── Simple local state hook (useState wrapper with type) ───────────

function useLocalState<T>(initial: T): [T, (v: T) => void] {
  const [state, setState] = useState(initial);
  return [state, setState];
}
