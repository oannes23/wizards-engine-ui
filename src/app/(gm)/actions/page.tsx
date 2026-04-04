"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Zap,
  List,
  Trash2,
  Edit2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { executeGmAction, executeGmBatchActions } from "@/lib/api/services/gm";
import { useToast } from "@/lib/toast/useToast";
import { GmActionTypeSelector } from "@/features/gm-actions/components/GmActionTypeSelector";
import { ModifyCharacterForm, buildModifyCharacterRequest, defaultModifyCharacterState } from "@/features/gm-actions/components/ModifyCharacterForm";
import { ModifyGroupForm, buildModifyGroupRequest, defaultModifyGroupState } from "@/features/gm-actions/components/ModifyGroupForm";
import { ModifyLocationForm, buildModifyLocationRequest, defaultModifyLocationState } from "@/features/gm-actions/components/ModifyLocationForm";
import { ModifyClockForm, buildModifyClockRequest, defaultModifyClockState } from "@/features/gm-actions/components/ModifyClockForm";
import {
  CreateBondForm, buildCreateBondRequest, defaultCreateBondState,
  ModifyBondForm, buildModifyBondRequest, defaultModifyBondState,
  RetireBondForm, buildRetireBondRequest, defaultRetireBondState,
} from "@/features/gm-actions/components/BondForms";
import {
  CreateTraitForm, buildCreateTraitRequest, defaultCreateTraitState,
  ModifyTraitForm, buildModifyTraitRequest, defaultModifyTraitState,
  RetireTraitForm, buildRetireTraitRequest, defaultRetireTraitState,
} from "@/features/gm-actions/components/TraitForms";
import {
  CreateEffectForm, buildCreateEffectRequest, defaultCreateEffectState,
  ModifyEffectForm, buildModifyEffectRequest, defaultModifyEffectState,
  RetireEffectForm, buildRetireEffectRequest, defaultRetireEffectState,
} from "@/features/gm-actions/components/EffectForms";
import { AwardXpForm, buildAwardXpRequest, defaultAwardXpState } from "@/features/gm-actions/components/AwardXpForm";
import { GM_ACTION_LABELS } from "@/features/gm-actions/types";
import type { GmActionType, GmActionRequest } from "@/lib/api/types";

// ── Form State Union ──────────────────────────────────────────────

type FormState =
  | { type: "modify_character"; state: ReturnType<typeof defaultModifyCharacterState> }
  | { type: "modify_group"; state: ReturnType<typeof defaultModifyGroupState> }
  | { type: "modify_location"; state: ReturnType<typeof defaultModifyLocationState> }
  | { type: "modify_clock"; state: ReturnType<typeof defaultModifyClockState> }
  | { type: "create_bond"; state: ReturnType<typeof defaultCreateBondState> }
  | { type: "modify_bond"; state: ReturnType<typeof defaultModifyBondState> }
  | { type: "retire_bond"; state: ReturnType<typeof defaultRetireBondState> }
  | { type: "create_trait"; state: ReturnType<typeof defaultCreateTraitState> }
  | { type: "modify_trait"; state: ReturnType<typeof defaultModifyTraitState> }
  | { type: "retire_trait"; state: ReturnType<typeof defaultRetireTraitState> }
  | { type: "create_effect"; state: ReturnType<typeof defaultCreateEffectState> }
  | { type: "modify_effect"; state: ReturnType<typeof defaultModifyEffectState> }
  | { type: "retire_effect"; state: ReturnType<typeof defaultRetireEffectState> }
  | { type: "award_xp"; state: ReturnType<typeof defaultAwardXpState> };

function defaultFormState(type: GmActionType): FormState {
  switch (type) {
    case "modify_character": return { type, state: defaultModifyCharacterState() };
    case "modify_group": return { type, state: defaultModifyGroupState() };
    case "modify_location": return { type, state: defaultModifyLocationState() };
    case "modify_clock": return { type, state: defaultModifyClockState() };
    case "create_bond": return { type, state: defaultCreateBondState() };
    case "modify_bond": return { type, state: defaultModifyBondState() };
    case "retire_bond": return { type, state: defaultRetireBondState() };
    case "create_trait": return { type, state: defaultCreateTraitState() };
    case "modify_trait": return { type, state: defaultModifyTraitState() };
    case "retire_trait": return { type, state: defaultRetireTraitState() };
    case "create_effect": return { type, state: defaultCreateEffectState() };
    case "modify_effect": return { type, state: defaultModifyEffectState() };
    case "retire_effect": return { type, state: defaultRetireEffectState() };
    case "award_xp": return { type, state: defaultAwardXpState() };
  }
}

function buildRequest(formState: FormState): GmActionRequest | null {
  switch (formState.type) {
    case "modify_character": return buildModifyCharacterRequest(formState.state);
    case "modify_group": return buildModifyGroupRequest(formState.state);
    case "modify_location": return buildModifyLocationRequest(formState.state);
    case "modify_clock": return buildModifyClockRequest(formState.state);
    case "create_bond": return buildCreateBondRequest(formState.state);
    case "modify_bond": return buildModifyBondRequest(formState.state);
    case "retire_bond": return buildRetireBondRequest(formState.state);
    case "create_trait": return buildCreateTraitRequest(formState.state);
    case "modify_trait": return buildModifyTraitRequest(formState.state);
    case "retire_trait": return buildRetireTraitRequest(formState.state);
    case "create_effect": return buildCreateEffectRequest(formState.state);
    case "modify_effect": return buildModifyEffectRequest(formState.state);
    case "retire_effect": return buildRetireEffectRequest(formState.state);
    case "award_xp": return buildAwardXpRequest(formState.state);
  }
}

// ── Dynamic Form Renderer ─────────────────────────────────────────

function DynamicForm({
  formState,
  onChange,
}: {
  formState: FormState;
  onChange: (state: FormState) => void;
}) {
  switch (formState.type) {
    case "modify_character":
      return (
        <ModifyCharacterForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "modify_group":
      return (
        <ModifyGroupForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "modify_location":
      return (
        <ModifyLocationForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "modify_clock":
      return (
        <ModifyClockForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "create_bond":
      return (
        <CreateBondForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "modify_bond":
      return (
        <ModifyBondForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "retire_bond":
      return (
        <RetireBondForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "create_trait":
      return (
        <CreateTraitForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "modify_trait":
      return (
        <ModifyTraitForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "retire_trait":
      return (
        <RetireTraitForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "create_effect":
      return (
        <CreateEffectForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "modify_effect":
      return (
        <ModifyEffectForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "retire_effect":
      return (
        <RetireEffectForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
    case "award_xp":
      return (
        <AwardXpForm
          state={formState.state}
          onChange={(s) => onChange({ ...formState, state: s })}
        />
      );
  }
}

// ── Batch Item ────────────────────────────────────────────────────

interface BatchItem {
  id: number;
  formState: FormState;
  request: GmActionRequest;
}

// ── Page ──────────────────────────────────────────────────────────

/**
 * GmActionsPage — GM-only page at /actions.
 *
 * 14 action types with type-selector → dynamic form.
 * Single mode: fill → Execute immediately.
 * Batch mode: fill → Add to Batch → Execute Batch (N) atomically.
 */
export default function GmActionsPage() {
  const toast = useToast();

  const [mode, setMode] = useState<"single" | "batch">("single");
  const [actionType, setActionType] = useState<GmActionType | "">("");
  const [formState, setFormState] = useState<FormState | null>(null);
  const [batch, setBatch] = useState<BatchItem[]>([]);
  const [nextBatchId, setNextBatchId] = useState(1);
  const [editingBatchId, setEditingBatchId] = useState<number | null>(null);

  function handleTypeChange(type: GmActionType) {
    setActionType(type);
    setFormState(defaultFormState(type));
  }

  // ── Single execute ──────────────────────────────────────────────

  const executeMutation = useMutation({
    mutationFn: (request: GmActionRequest) => executeGmAction(request),
    onSuccess: () => {
      toast.success("Action executed successfully.");
      setFormState(actionType ? defaultFormState(actionType as GmActionType) : null);
    },
    onError: () => {
      toast.error("Action failed — check the form and try again.");
    },
  });

  function handleExecuteSingle() {
    if (!formState) return;
    const request = buildRequest(formState);
    if (!request) {
      toast.error("Please fill in all required fields.");
      return;
    }
    executeMutation.mutate(request);
  }

  // ── Batch ───────────────────────────────────────────────────────

  const batchMutation = useMutation({
    mutationFn: (actions: GmActionRequest[]) => executeGmBatchActions(actions),
    onSuccess: (data) => {
      toast.success(`Batch of ${data.events.length} action(s) executed.`);
      setBatch([]);
      setFormState(actionType ? defaultFormState(actionType as GmActionType) : null);
    },
    onError: () => {
      toast.error("Batch execution failed — some actions may not have applied.");
    },
  });

  function handleAddToBatch() {
    if (!formState) return;
    const request = buildRequest(formState);
    if (!request) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (editingBatchId !== null) {
      setBatch((prev) =>
        prev.map((item) =>
          item.id === editingBatchId ? { ...item, formState, request } : item
        )
      );
      setEditingBatchId(null);
    } else {
      const id = nextBatchId;
      setNextBatchId((n) => n + 1);
      setBatch((prev) => [...prev, { id, formState, request }]);
    }

    // Reset form
    setFormState(actionType ? defaultFormState(actionType as GmActionType) : null);
  }

  function handleEditBatchItem(item: BatchItem) {
    setActionType(item.formState.type);
    setFormState(item.formState);
    setEditingBatchId(item.id);
  }

  function handleRemoveBatchItem(id: number) {
    setBatch((prev) => prev.filter((item) => item.id !== id));
    if (editingBatchId === id) {
      setEditingBatchId(null);
      setFormState(actionType ? defaultFormState(actionType as GmActionType) : null);
    }
  }

  function handleExecuteBatch() {
    const requests = batch.map((item) => item.request);
    batchMutation.mutate(requests);
  }

  const canSubmit = formState !== null && buildRequest(formState) !== null;
  const isExecuting = executeMutation.isPending || batchMutation.isPending;

  return (
    <div className="min-h-screen bg-bg-page">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-8">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="font-heading text-2xl font-bold text-text-primary">
            GM Actions
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Apply mechanical changes to game objects
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-2 mb-6 rounded-lg border border-border-default bg-bg-surface p-1 w-fit">
          <button
            type="button"
            onClick={() => setMode("single")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "single"
                ? "bg-brand-blue text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={mode === "single"}
          >
            <Zap className="h-4 w-4" aria-hidden="true" />
            Single
          </button>
          <button
            type="button"
            onClick={() => setMode("batch")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "batch"
                ? "bg-brand-blue text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
            aria-pressed={mode === "batch"}
          >
            <List className="h-4 w-4" aria-hidden="true" />
            Batch
          </button>
        </div>

        {/* Form card */}
        <div className="rounded-lg border border-border-default bg-bg-surface p-6 space-y-5 mb-6">
          {/* Type selector */}
          <GmActionTypeSelector
            value={actionType}
            onChange={handleTypeChange}
          />

          {/* Dynamic form */}
          {formState && (
            <div
              className="border-t border-border-default pt-5"
              aria-label={`${GM_ACTION_LABELS[formState.type]} form`}
            >
              <DynamicForm
                formState={formState}
                onChange={setFormState}
              />
            </div>
          )}

          {/* Submit row */}
          {formState && (
            <div className="flex items-center justify-between pt-2 border-t border-border-default">
              <div className="text-sm text-text-secondary">
                {mode === "batch" && editingBatchId !== null && (
                  <span className="text-brand-teal">Editing batch item #{editingBatchId}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {mode === "batch" && editingBatchId !== null && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBatchId(null);
                      setFormState(actionType ? defaultFormState(actionType as GmActionType) : null);
                    }}
                    className="rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
                  >
                    Cancel Edit
                  </button>
                )}
                {mode === "single" ? (
                  <button
                    type="button"
                    onClick={handleExecuteSingle}
                    disabled={!canSubmit || isExecuting}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Zap className="h-4 w-4" aria-hidden="true" />
                    {executeMutation.isPending ? "Executing..." : "Execute"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAddToBatch}
                    disabled={!canSubmit || isExecuting}
                    className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-teal hover:bg-brand-teal/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    {editingBatchId !== null ? "Update Item" : "Add to Batch"}
                  </button>
                )}
              </div>
            </div>
          )}

          {!actionType && (
            <div className="flex items-center gap-2 text-sm text-text-secondary py-4 justify-center">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              Select an action type above to begin
            </div>
          )}
        </div>

        {/* Batch list */}
        {mode === "batch" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading text-lg font-bold text-text-primary">
                Batch Queue ({batch.length})
              </h2>
              {batch.length > 0 && (
                <button
                  type="button"
                  onClick={handleExecuteBatch}
                  disabled={batchMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-4 w-4" aria-hidden="true" />
                  {batchMutation.isPending
                    ? "Executing..."
                    : `Execute Batch (${batch.length})`}
                </button>
              )}
            </div>

            {batch.length === 0 ? (
              <div className="rounded-lg border border-border-default bg-bg-surface p-6 text-center text-sm text-text-secondary">
                No actions in batch. Add actions using the form above.
              </div>
            ) : (
              <ol className="space-y-2">
                {batch.map((item, index) => (
                  <li
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg border bg-bg-surface px-4 py-3 ${
                      editingBatchId === item.id
                        ? "border-brand-teal"
                        : "border-border-default"
                    }`}
                    aria-label={`Batch item ${index + 1}: ${GM_ACTION_LABELS[item.formState.type]}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold tabular-nums text-text-secondary shrink-0 w-5 text-right">
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-text-primary">
                          {GM_ACTION_LABELS[item.formState.type]}
                        </span>
                        {item.request.narrative && (
                          <p className="text-xs text-text-secondary truncate max-w-xs">
                            {item.request.narrative}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => handleEditBatchItem(item)}
                        aria-label={`Edit batch item ${index + 1}`}
                        className="rounded-md p-1.5 text-text-secondary hover:text-brand-teal hover:bg-brand-teal/10 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveBatchItem(item.id)}
                        aria-label={`Remove batch item ${index + 1}`}
                        className="rounded-md p-1.5 text-text-secondary hover:text-meter-stress hover:bg-meter-stress/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
