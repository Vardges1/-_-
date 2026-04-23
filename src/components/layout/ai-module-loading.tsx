"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";

type LoadingModuleKind = "workload" | "category" | "priority" | "decompose";

const COPY: Record<
  LoadingModuleKind,
  { icon: string; title: string; description: string }
> = {
  workload: {
    icon: "analytics",
    title: "Сводка нагрузки",
    description: "Агрегирую статусы, сроки и категории",
  },
  category: {
    icon: "category",
    title: "Умная категоризация",
    description: "Сравниваю формулировки с историей проекта",
  },
  priority: {
    icon: "priority_high",
    title: "Оценка приоритета",
    description: "Считаю блокеры, сроки и загрузку команды",
  },
  decompose: {
    icon: "account_tree",
    title: "Декомпозиция задачи",
    description: "Строю план шагов с учётом рисков и зависимостей",
  },
};

function EllipsisCycle() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % 4), 420);
    return () => window.clearInterval(id);
  }, []);
  const suffix = ["", ".", "..", "..."][step];
  return <span aria-hidden>{suffix}</span>;
}

export function AiModuleLoadingCard({ kind }: { kind: LoadingModuleKind }) {
  const { icon, title, description } = COPY[kind];
  return (
    <div
      className="mt-4 rounded-2xl border border-outline-soft bg-surface-raised p-5 shadow-sm"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <MaterialIcon name={icon} className="!text-[22px]" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-display text-[14px] font-bold text-on-surface">{title}</h4>
          <div className="mt-2 flex items-start gap-3">
            <span
              className="mt-0.5 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-primary/30 border-t-primary"
              aria-hidden
            />
            <p className="text-[13px] leading-snug text-on-surface">
              {description}
              <EllipsisCycle />
            </p>
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-outline">
            Состояние: генерация
          </p>
        </div>
      </div>
    </div>
  );
}
