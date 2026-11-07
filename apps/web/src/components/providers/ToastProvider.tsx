"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = "success" | "error" | "info" | "pending";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  txHash?: string;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => string;
  dismissToast: (id: string) => void;
  updateToast: (id: string, updates: Partial<Omit<ToastItem, "id">>) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">): string => {
      const id = Math.random().toString(36).slice(2, 10);
      setToasts((prev) => [...prev, { ...toast, id }]);
      // Auto-dismiss non-pending toasts after 5 seconds.
      if (toast.type !== "pending") {
        setTimeout(() => dismissToast(id), 5000);
      }
      return id;
    },
    [dismissToast],
  );

  const updateToast = useCallback(
    (id: string, updates: Partial<Omit<ToastItem, "id">>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      );
      if (updates.type && updates.type !== "pending") {
        setTimeout(() => dismissToast(id), 5000);
      }
    },
    [dismissToast],
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast, updateToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Toast UI
// ---------------------------------------------------------------------------

const toastStyles: Record<ToastType, { icon: string; classes: string }> = {
  success: {
    icon: "\u2713",
    classes: "bg-field-50 border-field-300 text-field-700",
  },
  error: {
    icon: "\u2715",
    classes: "bg-red-50 border-red-300 text-red-700",
  },
  info: {
    icon: "\u2139",
    classes: "bg-blue-50 border-blue-300 text-blue-700",
  },
  pending: {
    icon: "\u23f3",
    classes: "bg-harvest-50 border-harvest-300 text-harvest-700",
  },
};

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[1000] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] sm:w-auto">
      {toasts.map((toast) => {
        const style = toastStyles[toast.type];
        return (
          <div
            key={toast.id}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border shadow-md animate-slide-in-right",
              style.classes,
            )}
            role="alert"
          >
            <span
              className={cn(
                "font-bold text-lg leading-none mt-0.5",
                toast.type === "pending" && "animate-pulse-soft",
              )}
            >
              {style.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-snug">{toast.message}</p>
              {toast.txHash && (
                <p className="text-xs opacity-60 font-mono mt-1 truncate">
                  {toast.txHash.slice(0, 12)}...{toast.txHash.slice(-6)}
                </p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-soil-300 hover:text-soil-600 transition-colors"
              aria-label="Dismiss notification"
            >
              {"\u2715"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
