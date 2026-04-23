"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getApiClientErrorMessage,
  listTasks,
  listTasksParamsToSearchParams,
  parseListTasksParams,
  type ApiTaskWithSubtasks,
  type ListTasksParams,
  type PaginatedTasks,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/api-client/tasks";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { AppShell } from "@/components/layout/app-shell";
import { AiCopilotPanel } from "@/components/layout/ai-copilot-panel";
import { computeTaskKpis } from "@/lib/tasks/kpi";
import { DeleteTaskDialog } from "./delete-task-dialog";
import { FeedbackToast } from "./feedback-toast";
import { TaskFormDrawer } from "./task-form-drawer";
import { TaskMetricsRow } from "./task-metrics-row";
import { TaskPageHeader } from "./task-page-header";
import { TaskTable } from "./task-table";

const DESKTOP_COPILOT_MIN_PX = 1536;

export function TaskManager() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryKey = searchParams.toString();

  const listParams = useMemo(() => parseListTasksParams(searchParams), [searchParams]);

  const hasActiveFilters = useMemo(
    () => Boolean(listParams.q || listParams.status || listParams.priority || listParams.due),
    [listParams.due, listParams.priority, listParams.q, listParams.status],
  );

  const [qDraft, setQDraft] = useState(() => listParams.q ?? "");
  useEffect(() => {
    setQDraft(listParams.q ?? "");
  }, [listParams.q]);

  const debouncedQ = useDebouncedValue(qDraft, 400);

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (debouncedQ === currentQ) return;
    const sp = new URLSearchParams(searchParams.toString());
    if (!debouncedQ) sp.delete("q");
    else sp.set("q", debouncedQ);
    sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQ, pathname, router, searchParams]);

  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refetch = useCallback(() => setRefreshKey((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const params = parseListTasksParams(searchParams);
        const result = await listTasks(params);
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) {
          setError(getApiClientErrorMessage(e));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [queryKey, refreshKey, searchParams]);

  function replaceSearchParams(mutate: (sp: URLSearchParams) => void) {
    const sp = new URLSearchParams(searchParams.toString());
    mutate(sp);
    sp.delete("page");
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const handleStatusChange = (value: TaskStatus | "") => {
    replaceSearchParams((sp) => {
      if (!value) sp.delete("status");
      else sp.set("status", value);
    });
  };

  const handlePriorityChange = (value: TaskPriority | "") => {
    replaceSearchParams((sp) => {
      if (!value) sp.delete("priority");
      else sp.set("priority", value);
    });
  };

  const handleDueChange = (value: NonNullable<ListTasksParams["due"]> | "") => {
    replaceSearchParams((sp) => {
      if (!value) sp.delete("due");
      else sp.set("due", value);
    });
  };

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingTask, setEditingTask] = useState<ApiTaskWithSubtasks | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingTask, setDeletingTask] = useState<ApiTaskWithSubtasks | null>(null);

  const [toast, setToast] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(() => new Set());
  const [mobileCopilotOpen, setMobileCopilotOpen] = useState(false);

  const kpi = useMemo(() => {
    if (!data) return null;
    return computeTaskKpis(data.items, data.total, data.limit);
  }, [data]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId || !data?.items.length) return null;
    return data.items.find((t) => t.id === selectedTaskId) ?? null;
  }, [data?.items, selectedTaskId]);

  useEffect(() => {
    if (!selectedTaskId || !data?.items) return;
    if (!data.items.some((t) => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  }, [data?.items, selectedTaskId]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openAiForTask = useCallback((id: string) => {
    setSelectedTaskId(id);
    if (typeof window !== "undefined" && window.innerWidth < DESKTOP_COPILOT_MIN_PX) {
      setMobileCopilotOpen(true);
    }
  }, []);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const currentPage = data?.page ?? 1;

  function goToPage(nextPage: number) {
    const params: ListTasksParams = { ...listParams, page: nextPage };
    const sp = listTasksParamsToSearchParams(params);
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const copilot = (
    <AiCopilotPanel selectedTask={selectedTask} onTasksChanged={refetch} onNotify={setToast} />
  );

  const filterHint = useMemo(() => {
    const bits: string[] = [];
    if (listParams.q?.trim()) bits.push("поиск");
    if (listParams.status) bits.push("статус");
    if (listParams.priority) bits.push("приоритет");
    if (listParams.due) bits.push("срок");
    return bits.length ? `Фильтры: ${bits.join(", ")}` : "Показаны все задачи по текущей странице";
  }, [listParams.due, listParams.priority, listParams.q, listParams.status]);

  return (
    <AppShell
      copilot={copilot}
      mobileCopilotOpen={mobileCopilotOpen}
      onMobileCopilotOpenChange={setMobileCopilotOpen}
    >
      <main className="scrollbar-thin flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="mx-auto w-full max-w-[1200px] flex-1 space-y-6 px-5 py-6 lg:space-y-8 lg:px-8 lg:py-8">
            <TaskPageHeader
              qDraft={qDraft}
              onQChange={setQDraft}
              status={listParams.status}
              priority={listParams.priority}
              due={listParams.due}
              onStatusChange={handleStatusChange}
              onPriorityChange={handlePriorityChange}
              onDueChange={handleDueChange}
              onNewTask={() => {
                setFormMode("create");
                setEditingTask(null);
                setFormOpen(true);
              }}
            />

            <TaskMetricsRow kpi={kpi} />

            {data && !loading && !error ? (
              <p className="text-sm text-on-surface-muted">
                Показано{" "}
                <span className="font-medium text-on-surface">{data.items.length}</span> из{" "}
                <span className="font-medium text-on-surface">{data.total}</span>
                {totalPages > 1 ? (
                  <span className="text-on-surface-subtle">
                    {" "}
                    · Стр. {currentPage} из {totalPages}
                  </span>
                ) : null}
              </p>
            ) : null}

            <TaskTable
              tasks={data?.items ?? []}
              loading={loading}
              error={error}
              hasActiveFilters={hasActiveFilters}
              filterHint={filterHint}
              selectedTaskId={selectedTaskId}
              expandedTaskIds={expandedTaskIds}
              onToggleExpand={toggleExpand}
              onSelectTask={setSelectedTaskId}
              onOpenAiForTask={openAiForTask}
              onEdit={(task) => {
                setFormMode("edit");
                setEditingTask(task);
                setFormOpen(true);
              }}
              onDelete={(task) => {
                setDeletingTask(task);
                setDeleteOpen(true);
              }}
              onRetry={refetch}
            />

            {data && !loading && !error && totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-outline-soft bg-surface-raised px-4 py-3 text-sm shadow-card">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => goToPage(Math.max(1, currentPage - 1))}
                  className="rounded-xl border border-outline bg-surface-raised px-4 py-2 font-medium text-on-surface hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Назад
                </button>
                <span className="text-on-surface-muted">
                  Стр. <span className="font-medium text-on-surface">{currentPage}</span> из{" "}
                  <span className="font-medium text-on-surface">{totalPages}</span>
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                  className="rounded-xl border border-outline bg-surface-raised px-4 py-2 font-medium text-on-surface hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Вперёд
                </button>
              </div>
            ) : null}
        </div>
      </main>

      <TaskFormDrawer
        open={formOpen}
        mode={formMode}
        task={editingTask}
        onClose={() => setFormOpen(false)}
        onSaved={refetch}
        onNotify={setToast}
        onRequestDelete={
          formMode === "edit" && editingTask
            ? () => {
                setDeletingTask(editingTask);
                setDeleteOpen(true);
                setFormOpen(false);
              }
            : undefined
        }
      />

      <DeleteTaskDialog
        open={deleteOpen}
        task={deletingTask}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          refetch();
          if (deletingTask && selectedTaskId === deletingTask.id) {
            setSelectedTaskId(null);
          }
        }}
        onNotify={setToast}
      />

      {toast ? (
        <FeedbackToast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      ) : null}
    </AppShell>
  );
}
