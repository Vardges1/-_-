"use client";

import { useEffect, useState } from "react";
import type { ApiTask } from "@/lib/api-client/tasks";
import { deleteTask, getApiClientErrorMessage } from "@/lib/api-client/tasks";

type DeleteTaskDialogProps = {
  task: ApiTask | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
  onNotify: (payload: { variant: "success" | "error"; message: string }) => void;
};

export function DeleteTaskDialog({ task, open, onClose, onDeleted, onNotify }: DeleteTaskDialogProps) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!open) setDeleting(false);
  }, [open]);

  if (!open || !task) return null;

  async function handleConfirm() {
    if (!task) return;
    const id = task.id;
    setDeleting(true);
    try {
      await deleteTask(id);
      onNotify({ variant: "success", message: "Задача удалена" });
      onDeleted();
      onClose();
    } catch (err) {
      onNotify({ variant: "error", message: getApiClientErrorMessage(err) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-on-surface/40"
        aria-label="Закрыть диалог"
        onClick={() => {
          if (!deleting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-task-title"
        className="relative z-[71] w-full max-w-md rounded-2xl border border-outline-soft bg-surface-raised p-6 shadow-card"
      >
        <h2 id="delete-task-title" className="font-display text-lg font-semibold text-on-surface">
          Удалить задачу?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-muted">
          Будет безвозвратно удалена <span className="font-medium text-on-surface">{task.title}</span> и все её
          подзадачи.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex justify-center rounded-xl border border-outline bg-surface-raised px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-60"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting}
            className="inline-flex justify-center rounded-xl bg-error px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-error/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Удаление…" : "Удалить"}
          </button>
        </div>
      </div>
    </div>
  );
}
