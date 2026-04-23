"use client";

import type { TaskKpiSnapshot } from "@/lib/tasks/kpi";

type TaskMetricsRowProps = {
  kpi: TaskKpiSnapshot | null;
};

export function TaskMetricsRow({ kpi }: TaskMetricsRowProps) {
  if (!kpi) return null;

  const cards = [
    {
      label: "Всего задач",
      value: kpi.totalFiltered,
      hint: "По текущим фильтрам (ответ API)",
      valueClass: "text-on-surface",
      border: "border-outline-soft",
    },
    {
      label: "Просрочено",
      value: kpi.overdueOnPage,
      hint: "На загруженной странице",
      valueClass: "text-error",
      border: "border-outline-soft",
    },
    {
      label: "В процессе",
      value: kpi.inProgressOnPage,
      hint: "На загруженной странице",
      valueClass: "text-secondary",
      border: "border-outline-soft",
    },
    {
      label: "Выполнено",
      value: kpi.doneOnPage,
      hint: "На загруженной странице",
      valueClass: "text-success",
      border: "border-outline-soft",
    },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <article
            key={c.label}
            className={`rounded-2xl border bg-surface-raised p-5 shadow-card ${c.border}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-outline">{c.label}</p>
            <p className={`mt-2 font-display text-3xl font-bold tabular-nums ${c.valueClass}`}>{c.value}</p>
            <p className="mt-2 text-[12px] text-outline">{c.hint}</p>
          </article>
        ))}
      </div>
      {kpi.isPaginated ? (
        <p className="text-[11px] leading-relaxed text-on-surface-muted">
          Показатели «на странице» считаются только по видимым строкам; «Всего задач» — по ответу API для текущих
          фильтров.
        </p>
      ) : null}
    </div>
  );
}
