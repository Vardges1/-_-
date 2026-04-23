import { Suspense } from "react";
import { TaskManager } from "@/components/tasks/task-manager";

function TaskManagerFallback() {
  return (
    <div className="h-[100dvh] bg-surface-canvas px-5 py-16 lg:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-subtle" />
        <div className="mt-8 h-32 animate-pulse rounded-2xl bg-surface-subtle" />
        <div className="mt-6 space-y-3">
          <div className="h-28 animate-pulse rounded-2xl bg-surface-subtle" />
          <div className="h-28 animate-pulse rounded-2xl bg-surface-subtle" />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<TaskManagerFallback />}>
      <TaskManager />
    </Suspense>
  );
}
