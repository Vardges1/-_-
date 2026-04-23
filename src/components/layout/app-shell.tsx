"use client";

import type { ReactNode } from "react";
import { CopilotPanelFooter, CopilotPanelHeader } from "./copilot-chrome";
import { MaterialIcon } from "@/components/ui/material-icon";
import { Sidebar } from "./sidebar";

type AppShellProps = {
  children: ReactNode;
  /** Desktop (2xl+) right column — AI copilot body (cards only). */
  copilot: ReactNode;
  mobileCopilotOpen: boolean;
  onMobileCopilotOpenChange: (open: boolean) => void;
};

export function AppShell({ children, copilot, mobileCopilotOpen, onMobileCopilotOpenChange }: AppShellProps) {
  return (
    <div className="grid h-[100dvh] grid-cols-[minmax(0,256px)_minmax(0,1fr)] overflow-hidden bg-surface 2xl:grid-cols-[minmax(0,272px)_minmax(0,1fr)_360px]">
      <Sidebar active="tasks" />

      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-surface-canvas">{children}</div>

      {/* Desktop copilot */}
      <aside
        className="hidden min-h-0 min-w-0 flex-col border-l border-outline-soft bg-surface-raised shadow-panel 2xl:flex"
        aria-label="ИИ-помощник"
      >
        <CopilotPanelHeader />
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">{copilot}</div>
        <CopilotPanelFooter />
      </aside>

      {/* Mobile floating AI */}
      <button
        type="button"
        className="fixed bottom-5 right-5 z-30 flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-4 text-sm font-semibold text-primary-foreground shadow-fab 2xl:hidden"
        onClick={() => onMobileCopilotOpenChange(true)}
        aria-label="Открыть ИИ-помощника"
      >
        <MaterialIcon name="psychology" className="!text-[22px]" filled />
        AI
      </button>

      {/* Mobile drawer backdrop */}
      {mobileCopilotOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-on-surface/25 backdrop-blur-[2px] 2xl:hidden"
          aria-label="Закрыть панель ИИ"
          onClick={() => onMobileCopilotOpenChange(false)}
        />
      ) : null}

      {/* Mobile copilot drawer */}
      {mobileCopilotOpen ? (
        <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[380px] flex-col border-l border-outline-soft bg-surface-raised shadow-2xl 2xl:hidden">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-outline-soft px-5 py-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
                <MaterialIcon name="psychology" className="!text-[24px] text-primary" filled />
              </div>
              <div className="min-w-0">
                <h2 className="font-display text-base font-bold text-on-surface">ИИ-копилот</h2>
                <p className="mt-0.5 text-xs text-on-surface-muted">Предложения не применяются автоматически.</p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-lg p-2 text-on-surface-muted hover:bg-surface"
              onClick={() => onMobileCopilotOpenChange(false)}
              aria-label="Закрыть"
            >
              <MaterialIcon name="close" className="!text-[22px]" />
            </button>
          </div>
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-5">{copilot}</div>
        </div>
      ) : null}
    </div>
  );
}
