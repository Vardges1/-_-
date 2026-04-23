import { MaterialIcon } from "@/components/ui/material-icon";

export function CopilotPanelHeader() {
  return (
    <div className="flex shrink-0 items-start gap-3 border-b border-outline-soft px-5 py-5">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft">
        <MaterialIcon name="psychology" className="!text-[24px] text-primary" filled />
      </div>
      <div className="min-w-0">
        <h2 className="font-display text-base font-bold text-on-surface">ИИ-копилот</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-on-surface-muted">
          Предложения не применяются автоматически — только после вашего решения.
        </p>
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-semibold text-success">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          Черновики — только по вашей команде
        </div>
      </div>
    </div>
  );
}

export function CopilotPanelFooter() {
  return (
    <div className="shrink-0 border-t border-outline-soft bg-surface-subtle px-5 py-4">
      <p className="text-[11px] leading-relaxed text-on-surface-muted">
        <span className="font-semibold text-on-surface">Памятка:</span> кнопки «Принять», «Отклонить» и «Заменить
        подзадачи» относятся только к черновику предложения и не меняют задачу без подтверждения.
      </p>
    </div>
  );
}
