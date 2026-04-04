"use client";

/**
 * WizardProvider — Wizard state context for the Proposal Wizard.
 *
 * Manages: current step, action type, per-action-type form data.
 * State survives step navigation (1→2→3→2→3).
 * Uses useReducer as specified in proposals.md.
 *
 * sessionStorage auto-save: saves on each step change, restores on mount.
 */

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { ActionType } from "@/lib/api/types";

// ── Step definitions ───────────────────────────────────────────────

export const WIZARD_STEPS = ["Choose Action", "Fill Details", "Review"] as const;
export type WizardStep = 0 | 1 | 2;

// ── Form data shape ────────────────────────────────────────────────

/**
 * Per-action-type form data. Each key maps to the selections object
 * that will be sent to the API. Kept as Record<string, unknown> to
 * avoid circular type dependencies with the individual form components.
 */
export type WizardFormData = Partial<Record<ActionType, Record<string, unknown>>>;

// ── Wizard state ───────────────────────────────────────────────────

export interface WizardState {
  currentStep: WizardStep;
  actionType: ActionType | null;
  narrative: string;
  formData: WizardFormData;
}

const INITIAL_STATE: WizardState = {
  currentStep: 0,
  actionType: null,
  narrative: "",
  formData: {},
};

// ── Actions ────────────────────────────────────────────────────────

type WizardAction =
  | { type: "SELECT_ACTION_TYPE"; payload: ActionType }
  | { type: "SET_STEP"; payload: WizardStep }
  | { type: "SET_FORM_DATA"; payload: { actionType: ActionType; data: Record<string, unknown> } }
  | { type: "SET_NARRATIVE"; payload: string }
  | { type: "RESET" }
  | { type: "RESTORE"; payload: WizardState };

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SELECT_ACTION_TYPE":
      return {
        ...state,
        actionType: action.payload,
        currentStep: 1,
      };
    case "SET_STEP":
      return { ...state, currentStep: action.payload };
    case "SET_FORM_DATA":
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.actionType]: action.payload.data,
        },
      };
    case "SET_NARRATIVE":
      return { ...state, narrative: action.payload };
    case "RESET":
      return INITIAL_STATE;
    case "RESTORE":
      return action.payload;
    default:
      return state;
  }
}

// ── Context ────────────────────────────────────────────────────────

interface WizardContextValue {
  state: WizardState;
  /** Move directly to a step */
  goToStep: (step: WizardStep) => void;
  /** Go back one step */
  goBack: () => void;
  /** Select an action type and advance to Step 2 */
  selectActionType: (actionType: ActionType) => void;
  /** Update form data for the current action type */
  setFormData: (data: Record<string, unknown>) => void;
  /** Update the narrative field */
  setNarrative: (narrative: string) => void;
  /** Get form data for the current action type */
  currentFormData: Record<string, unknown>;
  /** Clear all state */
  reset: () => void;
}

const WizardContext = createContext<WizardContextValue | null>(null);

// ── Storage helpers ────────────────────────────────────────────────

const STORAGE_KEY = "wizard_draft";

function saveDraft(state: WizardState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage unavailable — ignore
  }
}

function loadDraft(): WizardState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WizardState;
  } catch {
    return null;
  }
}

export function clearWizardDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ── Provider ───────────────────────────────────────────────────────

interface WizardProviderProps {
  children: ReactNode;
  /** Optional initial data for pre-fill (revise/edit flow) */
  initialData?: Partial<WizardState>;
  /** If true, suppress draft restoration prompt */
  skipDraftRestore?: boolean;
}

export function WizardProvider({
  children,
  initialData,
  skipDraftRestore = false,
}: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...INITIAL_STATE,
    ...initialData,
  });

  // Restore draft from sessionStorage on mount (if no initialData provided)
  useEffect(() => {
    if (skipDraftRestore || initialData) return;
    const draft = loadDraft();
    if (draft && draft.actionType) {
      dispatch({ type: "RESTORE", payload: draft });
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save to sessionStorage whenever step changes
  useEffect(() => {
    if (state.actionType) {
      saveDraft(state);
    }
  }, [state]);

  const goToStep = useCallback((step: WizardStep) => {
    dispatch({ type: "SET_STEP", payload: step });
  }, []);

  const goBack = useCallback(() => {
    const prev = (state.currentStep - 1) as WizardStep;
    if (prev >= 0) {
      dispatch({ type: "SET_STEP", payload: prev });
    }
  }, [state.currentStep]);

  const selectActionType = useCallback((actionType: ActionType) => {
    dispatch({ type: "SELECT_ACTION_TYPE", payload: actionType });
  }, []);

  const setFormData = useCallback(
    (data: Record<string, unknown>) => {
      if (!state.actionType) return;
      dispatch({
        type: "SET_FORM_DATA",
        payload: { actionType: state.actionType, data },
      });
    },
    [state.actionType]
  );

  const setNarrative = useCallback((narrative: string) => {
    dispatch({ type: "SET_NARRATIVE", payload: narrative });
  }, []);

  const reset = useCallback(() => {
    clearWizardDraft();
    dispatch({ type: "RESET" });
  }, []);

  const currentFormData =
    state.actionType ? (state.formData[state.actionType] ?? {}) : {};

  return (
    <WizardContext.Provider
      value={{
        state,
        goToStep,
        goBack,
        selectActionType,
        setFormData,
        setNarrative,
        currentFormData,
        reset,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) {
    throw new Error("useWizard must be used inside <WizardProvider>");
  }
  return ctx;
}
