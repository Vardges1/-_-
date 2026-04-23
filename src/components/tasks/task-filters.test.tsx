import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TaskFilters } from "./task-filters";

describe("TaskFilters", () => {
  it("renders search, filter controls, and new task action", () => {
    render(
      <TaskFilters
        qDraft=""
        onQChange={vi.fn()}
        onStatusChange={vi.fn()}
        onPriorityChange={vi.fn()}
        onDueChange={vi.fn()}
        onNewTask={vi.fn()}
      />,
    );

    expect(screen.getByPlaceholderText(/поиск по названию/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /создать задачу/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /статус/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /приоритет/i })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: /срок/i })).toBeInTheDocument();
  });
});
