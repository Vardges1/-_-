"use client";

import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";

type SidebarProps = {
  active?: "tasks";
};

function SoonBadge() {
  return (
    <span
      className="shrink-0 rounded-full border border-outline-soft bg-surface-subtle px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-on-surface-muted"
      aria-hidden
    >
      Скоро
    </span>
  );
}

export function Sidebar({ active = "tasks" }: SidebarProps) {
  return (
    <aside className="flex min-h-0 min-w-0 flex-col border-r border-outline-soft bg-surface-raised">
      <div className="px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary shadow-lg shadow-primary/25">
            <MaterialIcon name="hub" className="!text-[22px] text-primary-foreground" filled />
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-[15px] font-bold tracking-tight text-on-surface">ИнтеллектЗадач</p>
            <p className="truncate text-[11px] font-medium uppercase tracking-wide text-outline">LLM Workspace</p>
          </div>
        </div>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto px-3" aria-label="Основная навигация">
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 ${
                active === "tasks"
                  ? "bg-primary-soft/80 font-semibold text-primary ring-1 ring-primary/15"
                  : "font-medium text-outline hover:bg-surface hover:text-on-surface"
              }`}
              aria-current={active === "tasks" ? "page" : undefined}
            >
              <MaterialIcon name="checklist" className="!text-[22px] text-current" filled={active === "tasks"} />
              Задачи
            </Link>
          </li>
          <li
            className="flex cursor-default items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-on-surface-muted select-none"
            aria-label="Отчёты, в разработке"
          >
            <span className="flex items-center gap-3 font-medium">
              <MaterialIcon name="monitoring" className="!text-[22px] text-outline/80" />
              Отчёты
            </span>
            <SoonBadge />
          </li>
          <li
            className="flex cursor-default items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm text-on-surface-muted select-none"
            aria-label="Настройки, в разработке"
          >
            <span className="flex items-center gap-3 font-medium">
              <MaterialIcon name="settings" className="!text-[22px] text-outline/80" />
              Настройки
            </span>
            <SoonBadge />
          </li>
        </ul>
      </nav>

      <div className="mt-auto space-y-1 border-t border-outline-soft px-3 pb-3 pt-4">
        <p className="mx-1 rounded-xl border border-outline-soft bg-surface/80 p-3 text-[11px] leading-relaxed text-on-surface-muted">
          Демо-интерфейс без авторизации. Навигация ограничена экраном задач.
        </p>
      </div>
    </aside>
  );
}
