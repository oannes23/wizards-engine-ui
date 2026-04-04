"use client";

import { useContext } from "react";
import { ToastContext, type ToastContextValue } from "./ToastProvider";

/**
 * Hook to trigger toast notifications.
 * Must be used within a ToastProvider.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
