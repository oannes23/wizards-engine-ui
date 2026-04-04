"use client";

import {
  createContext,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────

type ToastVariant = "error" | "success";

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
}

export interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// ── Duration Config ──────────────────────────────────────────────

const TOAST_DURATION = {
  error: 6000,
  success: 3000,
} as const;

// ── Variant Styles ───────────────────────────────────────────────

const VARIANT_STYLES: Record<ToastVariant, string> = {
  error: "bg-meter-stress text-white border-meter-stress/50",
  success: "bg-meter-ft text-bg-page border-meter-ft/50",
};

// ── Provider ─────────────────────────────────────────────────────

let toastCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = "success") => {
      const id = `toast-${++toastCounter}`;
      const duration = TOAST_DURATION[variant];
      setToasts((prev) => [...prev, { id, message, variant, duration }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: addToast,
      error: (msg: string) => addToast(msg, "error"),
      success: (msg: string) => addToast(msg, "success"),
    }),
    [addToast]
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {toasts.map((item) => (
          <ToastPrimitive.Root
            key={item.id}
            duration={item.duration}
            onOpenChange={(open) => {
              if (!open) removeToast(item.id);
            }}
            className={`
              rounded-lg border px-4 py-3 shadow-lg
              flex items-center justify-between gap-3
              data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-5
              data-[state=closed]:animate-out data-[state=closed]:fade-out
              data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]
              data-[swipe=cancel]:translate-x-0
              data-[swipe=end]:animate-out data-[swipe=end]:slide-out-to-right
              ${VARIANT_STYLES[item.variant]}
            `}
            aria-live={item.variant === "error" ? "assertive" : "polite"}
          >
            <ToastPrimitive.Description className="text-sm font-medium">
              {item.message}
            </ToastPrimitive.Description>
            <ToastPrimitive.Close
              className="shrink-0 rounded-md p-1 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}

        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-[380px] max-w-[calc(100vw-2rem)]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}
