"use client";

import { useEffect, useState } from "react";
import {
  fetchWorkloadSummary,
  isAiNotConfigured,
  suggestTaskCategory,
  suggestTaskDecomposition,
  suggestTaskPriority,
} from "@/lib/api-client/ai";
import type { ApiTaskWithSubtasks } from "@/lib/api-client/tasks";
import { getApiClientErrorMessage, replaceTaskSubtasks, updateTask } from "@/lib/api-client/tasks";
import { priorityLabelRu, statusLabelRu } from "@/lib/i18n/task-ui";
import { AiModuleLoadingCard } from "./ai-module-loading";

type AiKind = "category" | "priority" | "decompose";

type AiCopilotPanelProps = {
  selectedTask: ApiTaskWithSubtasks | null;
  onTasksChanged: () => void;
  onNotify: (payload: { variant: "success" | "error"; message: string }) => void;
};

export function AiCopilotPanel({ selectedTask, onTasksChanged, onNotify }: AiCopilotPanelProps) {
  const [wlLoading, setWlLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [wlMetrics, setWlMetrics] = useState<{
    overdueCount: number;
    dueThisWeekCount: number;
    highPriorityOpenCount: number;
  } | null>(null);

  const [aiLoading, setAiLoading] = useState<AiKind | null>(null);
  const [panel, setPanel] = useState<
    | null
    | { kind: "category"; data: { category: string; confidence: number; reason: string } }
    | { kind: "priority"; data: { priority: ApiTaskWithSubtasks["priority"]; reason: string } }
    | { kind: "decompose"; titles: string[] }
  >(null);

  useEffect(() => {
    setPanel(null);
  }, [selectedTask?.id]);

  async function handleWorkload() {
    setWlLoading(true);
    try {
      const data = await fetchWorkloadSummary();
      setSummary(data.summary);
      setWlMetrics({
        overdueCount: data.overdueCount,
        dueThisWeekCount: data.dueThisWeekCount,
        highPriorityOpenCount: data.highPriorityOpenCount,
      });
      onNotify({ variant: "success", message: "Сводка готова" });
    } catch (e) {
      setSummary(null);
      setWlMetrics(null);
      if (isAiNotConfigured(e)) {
        onNotify({ variant: "error", message: "ИИ не настроен: задайте LLM_API_KEY в .env" });
      } else {
        onNotify({ variant: "error", message: getApiClientErrorMessage(e) });
      }
    } finally {
      setWlLoading(false);
    }
  }

  function dismissPanel() {
    setPanel(null);
  }

  async function runAi(kind: AiKind) {
    if (!selectedTask) return;
    setAiLoading(kind);
    setPanel(null);
    try {
      if (kind === "category") {
        const data = await suggestTaskCategory(selectedTask.id);
        setPanel({ kind: "category", data });
      } else if (kind === "priority") {
        const data = await suggestTaskPriority(selectedTask.id);
        setPanel({ kind: "priority", data });
      } else {
        const data = await suggestTaskDecomposition(selectedTask.id);
        setPanel({ kind: "decompose", titles: data.subtasks.map((s) => s.title) });
      }
    } catch (e) {
      if (isAiNotConfigured(e)) {
        onNotify({ variant: "error", message: "ИИ не настроен: задайте LLM_API_KEY в .env" });
      } else {
        onNotify({ variant: "error", message: getApiClientErrorMessage(e) });
      }
    } finally {
      setAiLoading(null);
    }
  }

  async function acceptCategory(category: string) {
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask.id, { category });
      onNotify({ variant: "success", message: "Категория обновлена" });
      dismissPanel();
      onTasksChanged();
    } catch (e) {
      onNotify({ variant: "error", message: getApiClientErrorMessage(e) });
    }
  }

  async function acceptPriority(priority: ApiTaskWithSubtasks["priority"]) {
    if (!selectedTask) return;
    try {
      await updateTask(selectedTask.id, { priority });
      onNotify({ variant: "success", message: "Приоритет обновлён" });
      dismissPanel();
      onTasksChanged();
    } catch (e) {
      onNotify({ variant: "error", message: getApiClientErrorMessage(e) });
    }
  }

  async function acceptDecompose(titles: string[]) {
    if (!selectedTask) return;
    const cleaned = titles.map((t) => t.trim()).filter(Boolean);
    if (cleaned.length === 0) {
      onNotify({ variant: "error", message: "Добавьте хотя бы один подзаголовок" });
      return;
    }
    try {
      await replaceTaskSubtasks(selectedTask.id, cleaned.map((title) => ({ title })));
      onNotify({ variant: "success", message: "Подзадачи заменены" });
      dismissPanel();
      onTasksChanged();
    } catch (e) {
      onNotify({ variant: "error", message: getApiClientErrorMessage(e) });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section
        className="rounded-2xl border border-outline-soft bg-surface-raised p-5 shadow-sm"
        aria-busy={wlLoading}
        aria-live="polite"
      >
        <div className="flex flex-col gap-3">
          <div>
            <h3 className="font-display text-[14px] font-bold text-on-surface">Сводка нагрузки</h3>
            <p className="mt-1 text-[12px] leading-relaxed text-outline">
              Метрики считаются на сервере; модель пишет только текст. Нужен{" "}
              <code className="rounded-md bg-surface-subtle px-1 py-0.5 text-[11px] text-on-surface">LLM_API_KEY</code>.
              ИИ не применяет изменения сам.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleWorkload()}
            disabled={wlLoading}
            className="inline-flex h-9 min-h-[2.25rem] w-full items-center justify-center gap-2 rounded-lg border border-outline-soft bg-surface-raised text-[12px] font-semibold text-on-surface hover:bg-surface-subtle disabled:opacity-70"
          >
            {wlLoading ? (
              <>
                <span
                  className="inline-block h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                  aria-hidden
                />
                Запрос…
              </>
            ) : (
              "Сформировать сводку по текущему списку"
            )}
          </button>
        </div>
        {wlLoading ? <AiModuleLoadingCard kind="workload" /> : null}
        {wlMetrics ? (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl border border-outline-soft bg-surface-subtle px-2 py-2">
              <p className="text-[10px] font-medium text-outline">Просрочено</p>
              <p className="text-sm font-semibold text-on-surface">{wlMetrics.overdueCount}</p>
            </div>
            <div className="rounded-xl border border-outline-soft bg-surface-subtle px-2 py-2">
              <p className="text-[10px] font-medium text-outline">На неделе</p>
              <p className="text-sm font-semibold text-on-surface">{wlMetrics.dueThisWeekCount}</p>
            </div>
            <div className="rounded-xl border border-outline-soft bg-surface-subtle px-2 py-2">
              <p className="text-[10px] font-medium text-outline">Высокий приоритет</p>
              <p className="text-sm font-semibold text-on-surface">{wlMetrics.highPriorityOpenCount}</p>
            </div>
          </div>
        ) : null}
        {summary ? (
          <p className="mt-3 whitespace-pre-wrap text-[13px] leading-relaxed text-outline">{summary}</p>
        ) : (
          <p className="mt-3 text-[12px] text-outline">
            Нажмите кнопку, чтобы получить краткий текст по текущему набору задач.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-outline-soft bg-surface-raised p-5 shadow-sm">
        <h3 className="font-display text-[14px] font-bold text-on-surface">Подсказки по задаче</h3>
        {!selectedTask ? (
          <p className="mt-2 text-[12px] text-outline">
            Выберите строку в таблице слева — здесь появятся кнопки для категории, приоритета и декомпозиции.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-[12px] text-outline">
              Выбрано: <span className="font-medium text-on-surface">{selectedTask.title}</span> ·{" "}
              {statusLabelRu(selectedTask.status)} · {priorityLabelRu(selectedTask.priority)}
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={aiLoading !== null}
                onClick={() => void runAi("category")}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-soft bg-white px-3 py-1.5 text-[12px] font-semibold text-on-surface hover:bg-surface-subtle disabled:opacity-70"
              >
                {aiLoading === "category" ? (
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                    aria-hidden
                  />
                ) : null}
                {aiLoading === "category" ? "Запрос…" : "Категория"}
              </button>
              <button
                type="button"
                disabled={aiLoading !== null}
                onClick={() => void runAi("priority")}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-soft bg-white px-3 py-1.5 text-[12px] font-semibold text-on-surface hover:bg-surface-subtle disabled:opacity-70"
              >
                {aiLoading === "priority" ? (
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                    aria-hidden
                  />
                ) : null}
                {aiLoading === "priority" ? "Запрос…" : "Приоритет"}
              </button>
              <button
                type="button"
                disabled={aiLoading !== null}
                onClick={() => void runAi("decompose")}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-soft bg-white px-3 py-1.5 text-[12px] font-semibold text-on-surface hover:bg-surface-subtle disabled:opacity-70"
              >
                {aiLoading === "decompose" ? (
                  <span
                    className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
                    aria-hidden
                  />
                ) : null}
                {aiLoading === "decompose" ? "Запрос…" : "Декомпозиция"}
              </button>
            </div>
          </div>
        )}

        {aiLoading && selectedTask ? <AiModuleLoadingCard kind={aiLoading} /> : null}

        {panel && selectedTask ? (
          <div className="ai-module-ring mt-4 rounded-2xl p-5 text-sm shadow-sm">
            {panel.kind === "category" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary">Предложение категории</p>
                <p className="font-semibold text-on-surface">{panel.data.category}</p>
                <p className="text-xs text-on-surface-muted">
                  Уверенность: {(panel.data.confidence * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-on-surface-muted">{panel.data.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void acceptCategory(panel.data.category)}
                    className="min-w-[100px] flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-[0.96]"
                  >
                    Принять
                  </button>
                  <button
                    type="button"
                    onClick={dismissPanel}
                    className="min-w-[100px] flex-1 rounded-lg border border-outline-soft bg-white px-3 py-2 text-[12px] font-semibold text-on-surface"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ) : null}
            {panel.kind === "priority" ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-primary">Предложение приоритета</p>
                <p className="font-semibold text-on-surface">{priorityLabelRu(panel.data.priority)}</p>
                <p className="text-xs text-on-surface-muted">{panel.data.reason}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void acceptPriority(panel.data.priority)}
                    className="min-w-[100px] flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-[0.96]"
                  >
                    Принять
                  </button>
                  <button
                    type="button"
                    onClick={dismissPanel}
                    className="min-w-[100px] flex-1 rounded-lg border border-outline-soft bg-white px-3 py-2 text-[12px] font-semibold text-on-surface"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ) : null}
            {panel.kind === "decompose" ? (
              <DecomposeBlock
                key={panel.titles.join("|")}
                initialTitles={panel.titles}
                onAccept={(titles) => void acceptDecompose(titles)}
                onDismiss={dismissPanel}
              />
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function DecomposeBlock(props: {
  initialTitles: string[];
  onAccept: (titles: string[]) => void;
  onDismiss: () => void;
}) {
  const [lines, setLines] = useState(() => props.initialTitles.join("\n"));
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-primary">Подзадачи (можно править)</p>
      <p className="text-[11px] leading-snug text-warn">
        Сохранение заменит все текущие подзадачи у выбранной задачи.
      </p>
      <textarea
        value={lines}
        onChange={(e) => setLines(e.target.value)}
        rows={5}
        className="w-full rounded-xl border border-outline-soft bg-white px-2 py-2 text-xs text-on-surface focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => props.onAccept(lines.split("\n"))}
          className="min-w-[100px] flex-1 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-2 text-[12px] font-semibold text-primary-foreground shadow-md shadow-primary/20 hover:opacity-[0.96]"
        >
          Заменить подзадачи
        </button>
        <button
          type="button"
          onClick={props.onDismiss}
          className="min-w-[100px] flex-1 rounded-lg border border-outline-soft bg-white px-3 py-2 text-[12px] font-semibold text-on-surface"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
}
