"use client";

import { cn } from "@/lib/utils";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  confirmVariant?: "primary" | "danger" | "harvest";
  loading?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  confirmLabel,
  onConfirm,
  confirmVariant = "primary",
  loading = false,
}: ModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-soil-900/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-slide-up">
        <h3 id="modal-title" className="text-lg font-semibold text-soil-800 mb-3">
          {title}
        </h3>
        <div className="text-sm text-soil-600 mb-6 leading-relaxed">
          {children}
        </div>
        <div className="flex gap-3 justify-end">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {confirmLabel && onConfirm && (
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              loading={loading}
            >
              {confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
