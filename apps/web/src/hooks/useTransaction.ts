"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/components/providers/ToastProvider";

type TxStatus =
  | "idle"
  | "preparing"
  | "submitting"
  | "success"
  | "error";

interface TxMessages {
  preparing?: string;
  submitting?: string;
  success?: string;
  error?: string;
}

interface TxResult {
  hash: string;
}

/**
 * Wraps a contract call with toast notifications and status tracking.
 *
 * @example
 * const { submit, status } = useTransaction();
 * await submit(
 *   () => field.plant(address, signer),
 *   { preparing: "Opening wallet...", success: "Planted!", error: "Planting failed" },
 * );
 */
export function useTransaction() {
  const { showToast, updateToast, dismissToast } = useToast();
  const [status, setStatus] = useState<TxStatus>("idle");

  const submit = useCallback(
    async <T extends TxResult>(
      fn: () => Promise<T>,
      messages: TxMessages = {},
    ): Promise<T | null> => {
      setStatus("preparing");
      const toastId = showToast({
        type: "info",
        message: messages.preparing ?? "Preparing transaction...",
      });

      try {
        const result = await fn();
        setStatus("submitting");
        updateToast(toastId, {
          type: "pending",
          message: messages.submitting ?? "Submitting to Stellar...",
          txHash: result.hash,
        });

        // In production: poll the RPC for transaction confirmation.
        // For now, we assume success after submission.
        setStatus("success");
        updateToast(toastId, {
          type: "success",
          message: messages.success ?? "Transaction confirmed!",
          txHash: result.hash,
        });

        return result;
      } catch (err) {
        setStatus("error");
        const msg =
          err instanceof Error ? err.message : messages.error ?? "Transaction failed";
        updateToast(toastId, {
          type: "error",
          message: msg,
        });
        setTimeout(() => dismissToast(toastId), 5000);
        return null;
      } finally {
        setStatus("idle");
      }
    },
    [showToast, updateToast, dismissToast],
  );

  return { status, submit };
}
