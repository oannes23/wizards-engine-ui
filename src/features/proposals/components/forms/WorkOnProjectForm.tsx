"use client";

/**
 * WorkOnProjectForm — Step 2 form for the "work_on_project" action type.
 *
 * Fields:
 *   - Story picker (optional searchable select from active stories)
 *   - Clock picker (optional — informational context only, see note below)
 *   - Narrative textarea (required)
 *
 * NOTE: work_on_project does NOT auto-advance the targeted clock.
 * The clock selector is informational — it associates the proposal with
 * a clock for context so the GM can see which clock was targeted.
 * Clock advancement is handled separately by the GM.
 *
 * At least one of story_id or clock_id should be provided (client-side validated).
 * Costs 1 Free Time.
 */

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { queryKeys } from "@/lib/hooks/query-keys";
import { listStories } from "@/lib/api/services/stories";
import type { CharacterDetailResponse, ClockResponse, PaginatedResponse } from "@/lib/api/types";
import { useWizard } from "../WizardProvider";

// ── Schema ─────────────────────────────────────────────────────────

const schema = z
  .object({
    story_id: z.string().optional(),
    clock_id: z.string().optional(),
    narrative: z.string().min(1, "Narrative is required."),
  })
  .refine(
    (data) => data.story_id || data.clock_id,
    {
      message: "Please select at least a story or a clock to work on.",
      path: ["story_id"],
    }
  );

type FormValues = z.infer<typeof schema>;

// ── Component ──────────────────────────────────────────────────────

interface WorkOnProjectFormProps {
  character: CharacterDetailResponse;
  onNext: (data: Record<string, unknown>) => void;
}

export function WorkOnProjectForm({ character, onNext }: WorkOnProjectFormProps) {
  const { goBack, state, setNarrative } = useWizard();
  const savedData = (state.formData["work_on_project"] ?? {}) as Partial<FormValues>;

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      story_id: savedData.story_id ?? "",
      clock_id: savedData.clock_id ?? "",
      narrative: state.narrative || savedData.narrative || "",
    },
  });

  const storyId = watch("story_id");
  const clockId = watch("clock_id");

  // Fetch active stories (visibility-filtered by server)
  const { data: storiesData, isLoading: isLoadingStories } = useQuery({
    queryKey: queryKeys.stories.list({ status: "active" }),
    queryFn: () => listStories({ status: "active", limit: 50 }),
    staleTime: 30_000,
  });

  // Fetch active clocks
  const { data: clocksData, isLoading: isLoadingClocks } = useQuery({
    queryKey: queryKeys.clocks.list({ is_completed: false }),
    queryFn: () =>
      api.get<PaginatedResponse<ClockResponse>>("/clocks", {
        is_completed: false,
        limit: 50,
      }),
    staleTime: 30_000,
  });

  const stories = storiesData?.items ?? [];
  const clocks = (clocksData?.items ?? []) as ClockResponse[];

  function onSubmit(values: FormValues) {
    setNarrative(values.narrative);
    onNext({
      ...(values.story_id ? { story_id: values.story_id } : {}),
      ...(values.clock_id ? { clock_id: values.clock_id } : {}),
    });
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

      {/* Story picker */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-story-id" className="text-sm font-semibold text-text-primary">
          Story
          <span className="ml-1 text-text-secondary text-xs font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary">
          Select the story this work contributes to.
        </p>
        <Controller
          name="story_id"
          control={control}
          render={({ field }) => (
            <select
              id="work-story-id"
              {...field}
              value={field.value ?? ""}
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-2 text-sm text-text-primary
                focus:outline-none focus:ring-2 focus:ring-brand-teal
              "
              aria-describedby={errors.story_id ? "work-story-error" : undefined}
            >
              <option value="">
                {isLoadingStories ? "Loading stories..." : "No story selected"}
              </option>
              {stories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        />
        {errors.story_id && (
          <p id="work-story-error" className="text-xs text-status-rejected" role="alert">
            {errors.story_id.message}
          </p>
        )}
      </div>

      {/* Clock picker */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-clock-id" className="text-sm font-semibold text-text-primary">
          Clock
          <span className="ml-1 text-text-secondary text-xs font-normal">(optional)</span>
        </label>
        <p className="text-xs text-text-secondary">
          Associate your work with a specific clock. Clock advancement is handled separately by the GM.
        </p>
        <Controller
          name="clock_id"
          control={control}
          render={({ field }) => (
            <select
              id="work-clock-id"
              {...field}
              value={field.value ?? ""}
              className="
                w-full rounded-md border border-border-default bg-bg-elevated
                px-3 py-2 text-sm text-text-primary
                focus:outline-none focus:ring-2 focus:ring-brand-teal
              "
            >
              <option value="">
                {isLoadingClocks ? "Loading clocks..." : "No clock selected"}
              </option>
              {clocks.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.progress}/{c.segments})
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* At-least-one hint */}
      {!storyId && !clockId && (
        <p className="text-xs text-meter-plot" role="status">
          Please select at least a story or clock to associate this work with.
        </p>
      )}

      {/* Narrative */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="work-narrative" className="text-sm font-semibold text-text-primary">
          Narrative
          <span className="ml-1 text-status-rejected text-xs" aria-hidden="true">*</span>
        </label>
        <p className="text-xs text-text-secondary">
          Describe what your character actually does during this downtime.
        </p>
        <textarea
          id="work-narrative"
          {...register("narrative")}
          rows={5}
          placeholder="I spend the week in the archives, cross-referencing the old maps with the accounts of the expedition..."
          className="
            w-full rounded-md border border-border-default bg-bg-elevated
            px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50
            focus:outline-none focus:ring-2 focus:ring-brand-teal
            resize-y min-h-[120px]
          "
          aria-describedby={errors.narrative ? "work-narrative-error" : undefined}
          aria-required="true"
        />
        {errors.narrative && (
          <p id="work-narrative-error" className="text-xs text-status-rejected" role="alert">
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
