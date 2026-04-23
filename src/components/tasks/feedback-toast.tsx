"use client";

import { useEffect } from "react";

export type FeedbackToastProps = {
  message: string;
  variant: "success" | "error";
  onDismiss: () => void;
  durationMs?: number;
};

export function FeedbackToast({ message, variant, onDismiss, durationMs = 4000 }: FeedbackToastProps) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [durationMs, onDismiss]);

  const container =
    variant === "success"
      ? "border-success/25 bg-success-soft"
      : "border-error/25 bg-error-soft";

  return (
    <div
      role="status"
      className={`fixed bottom-4 right-4 z-[80] max-w-sm rounded-2xl border px-4 py-3 text-sm text-on-surface shadow-card ${container}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="leading-snug">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-0.5 text-sm text-on-surface-muted opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary/30"
          aria-label="Закрыть уведомление"
        >
          ×
        </button>
      </div>
    </div>
  );
}
