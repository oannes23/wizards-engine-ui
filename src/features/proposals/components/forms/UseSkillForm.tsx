"use client";

/**
 * UseSkillForm — Step 2 form for the "use_skill" action type.
 *
 * Fields:
 *   - Skill selector (8 skills with current level)
 *   - Plot spend (0 to current plot — each = 1 guaranteed success die)
 *   - ModifierSelector (optional: 1 core + 1 role + 1 bond = +3d)
 *   - Narrative textarea (optional for session actions per spec)
 *
 * Real-time dice pool preview: base (skill level) + modifiers + plot spend.
 * No FT cost. No guaranteed narrative requirement.
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { CharacterDetailResponse, SkillName } from "@/lib/api/types";
import { ModifierSelector, type ModifierSelections } from "../ModifierSelector";
import { useWizard } from "../WizardProvider";

// ── Skill display metadata ─────────────────────────────────────────

const SKILL_LABELS: Record<SkillName, string> = {
  awareness: "Awareness",
  composure: "Composure",
  influence: "Influence",
  finesse: "Finesse",
  speed: "Speed",
  power: "Power",
  knowledge: "Knowledge",
  technology: "Technology",
};

const ALL_SKILLS: SkillName[] = [
  "awareness",
  "composure",
  "influence",
  "finesse",
  "speed",
  "power",
  "knowledge",
  "technology",
];

// ── Schema ─────────────────────────────────────────────────────────

const schema = z.object({
  skill: z
    .string()
    .refine(
      (v) =>
        ["awareness", "composure", "influence", "finesse", "speed", "power", "knowledge", "technology"].includes(v),
      { message: "Please select a skill." }
    ),
  modifiers: z.object({
    core_trait_id: z.string().optional(),
    role_trait_id: z.string().optional(),
    bond_id: z.string().optional(),
  }),
  plot_spend: z.number().int().min(0),
  narrative: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────

interface UseSkillFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

export function UseSkillForm({ character, onNext }: UseSkillFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["use_skill"] ?? {}) as Partial<FormValues>;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      skill: (savedData.skill as SkillName | undefined) ?? undefined,
      modifiers: savedData.modifiers ?? {},
      plot_spend: savedData.plot_spend ?? 0,
      narrative: state.narrative || savedData.narrative || "",
    },
  });

  const selectedSkill = watch("skill");
  const modifiers = watch("modifiers") as ModifierSelections;
  const plotSpend = watch("plot_spend") ?? 0;

  // Derive dice pool components — cast selectedSkill since schema uses z.string().refine()
  const skillLevel =
    selectedSkill && character.skills
      ? character.skills[selectedSkill as SkillName] ?? 0
      : 0;
  const modifierCount =
    (modifiers?.core_trait_id ? 1 : 0) +
    (modifiers?.role_trait_id ? 1 : 0) +
    (modifiers?.bond_id ? 1 : 0);
  const totalDice = skillLevel + modifierCount;

  const currentPlot = character.plot ?? 0;
  const maxPlotSpend = currentPlot;

  const traits = character.traits?.active ?? [];
  const bonds = character.bonds?.active ?? [];

  function onSubmit(values: FormValues) {
    if (values.narrative) {
      setNarrative(values.narrative);
    }
    onNext({
      skill: values.skill,
      modifiers: values.modifiers,
      plot_spend: values.plot_spend,
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6" noValidate>
      {/* Skill selector */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="use-skill-skill"
          className="text-sm font-semibold text-text-primary"
        >
          Skill
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          Select the skill to roll. Base dice = skill level.
        </p>
        <select
          id="use-skill-skill"
          {...register("skill")}
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            appearance-none
          "
          aria-describedby={errors.skill ? "use-skill-skill-error" : undefined}
          aria-required="true"
        >
          <option value="">Select a skill…</option>
          {ALL_SKILLS.map((skill) => {
            const level = character.skills ? character.skills[skill] : 0;
            return (
              <option key={skill} value={skill}>
                {SKILL_LABELS[skill]} (Level {level})
              </option>
            );
          })}
        </select>
        {errors.skill && (
          <p id="use-skill-skill-error" className="text-xs text-status-rejected" role="alert">
            {errors.skill.message}
          </p>
        )}
      </div>

      {/* Plot spend stepper */}
      {currentPlot > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-text-primary">Plot Spend</span>
          <p className="text-xs text-text-secondary">
            Each Plot point spent adds 1 guaranteed success die. You have {currentPlot} Plot.
          </p>
          <div className="flex items-center gap-3">
            <Controller
              name="plot_spend"
              control={control}
              render={({ field }) => (
                <>
                  <button
                    type="button"
                    aria-label="Decrease plot spend"
                    disabled={field.value <= 0}
                    onClick={() => field.onChange(Math.max(0, field.value - 1))}
                    className="
                      h-8 w-8 rounded-md border border-border-default bg-bg-elevated
                      text-text-primary text-lg font-bold flex items-center justify-center
                      hover:bg-brand-navy-light transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    −
                  </button>
                  <span
                    aria-live="polite"
                    aria-label="Plot spend amount"
                    className="w-6 text-center text-base font-semibold tabular-nums text-meter-plot"
                  >
                    {field.value}
                  </span>
                  <button
                    type="button"
                    aria-label="Increase plot spend"
                    disabled={field.value >= maxPlotSpend}
                    onClick={() => field.onChange(Math.min(maxPlotSpend, field.value + 1))}
                    className="
                      h-8 w-8 rounded-md border border-border-default bg-bg-elevated
                      text-text-primary text-lg font-bold flex items-center justify-center
                      hover:bg-brand-navy-light transition-colors
                      disabled:opacity-40 disabled:cursor-not-allowed
                    "
                  >
                    +
                  </button>
                  <span className="text-xs text-text-secondary">
                    = {field.value} guaranteed {field.value === 1 ? "success" : "successes"}
                  </span>
                </>
              )}
            />
          </div>
        </div>
      )}

      {/* Dice pool preview */}
      {selectedSkill && (
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
              Base {skillLevel}d ({SKILL_LABELS[selectedSkill as SkillName]})
              {modifierCount > 0 && (
                <span className="text-brand-teal"> + {modifierCount} modifier{modifierCount !== 1 ? "s" : ""}</span>
              )}
              {plotSpend > 0 && (
                <span className="text-meter-plot"> + {plotSpend} plot</span>
              )}
            </span>
          </div>
          <span className="text-xl font-bold tabular-nums text-text-primary">
            {totalDice}d
            {plotSpend > 0 && (
              <span className="text-sm font-normal text-meter-plot"> +{plotSpend} auto</span>
            )}
          </span>
        </div>
      )}

      {/* Modifier selector — baseDice omitted since UseSkillForm has its own unified preview above */}
      <ModifierSelector
        traits={traits}
        bonds={bonds}
        value={modifiers ?? {}}
        onChange={(val) => setValue("modifiers", val)}
      />

      {/* Narrative (optional for session actions) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="use-skill-narrative" className="text-sm font-semibold text-text-primary">
          Narrative
          <span className="ml-1.5 text-xs text-text-secondary font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe what your character does.
        </p>
        <textarea
          id="use-skill-narrative"
          {...register("narrative")}
          rows={3}
          placeholder="I slip through the crowd, eyes scanning for an opening…"
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
