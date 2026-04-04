"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

// ── Base Modal ───────────────────────────────────────────────────

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border-default bg-bg-surface p-6 shadow-lg data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="font-heading text-lg font-bold text-text-primary">
              {title}
            </Dialog.Title>
            <Dialog.Close className="rounded-md p-1 text-text-secondary hover:text-text-primary transition-colors">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Confirm Modal ────────────────────────────────────────────────

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "default" | "danger";
}

export function ConfirmModal({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
  variant = "default",
}: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-text-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`
            rounded-md px-4 py-2 text-sm font-medium text-white transition-colors
            ${variant === "danger"
              ? "bg-meter-stress hover:bg-meter-stress/80"
              : "bg-brand-blue hover:bg-brand-blue-light"
            }
          `}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

// ── Narrative Modal ──────────────────────────────────────────────

interface NarrativeModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  placeholder?: string;
  onSubmit: (text: string) => void;
}

export function NarrativeModal({
  open,
  onClose,
  title,
  placeholder = "Enter narrative...",
  onSubmit,
}: NarrativeModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const text = formData.get("narrative") as string;
          if (text.trim()) {
            onSubmit(text.trim());
            onClose();
          }
        }}
      >
        <textarea
          name="narrative"
          placeholder={placeholder}
          className="w-full rounded-md border border-border-default bg-bg-page px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-border-focus min-h-[120px] resize-y mb-4"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary bg-bg-elevated hover:bg-brand-navy-light transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md px-4 py-2 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blue-light transition-colors"
          >
            Submit
          </button>
        </div>
      </form>
    </Modal>
  );
}
