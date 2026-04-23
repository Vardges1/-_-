import { PrismaClient, TaskPriority, TaskStatus } from "@prisma/client";
import { getUtcDayBoundaries } from "../src/lib/utils/utc-date-boundaries";

const prisma = new PrismaClient();

function addUtcDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function main() {
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();

  const now = new Date();
  const { startOfToday, startTodayPlusDays } = getUtcDayBoundaries(now);
  const overdueDue = addUtcDays(startOfToday, -5);
  const dueToday = startOfToday;
  const dueMidWeek = startTodayPlusDays(3);
  const dueLaterWeek = startTodayPlusDays(6);
  const doneDuePast = addUtcDays(startOfToday, -10);

  const tasks: Array<{
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    dueDate: Date | null;
    category?: string | null;
    subtasks?: { title: string; completed?: boolean }[];
  }> = [
    {
      title: "Ship release checklist",
      description: "Final QA, changelog, and deployment window.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: dueToday,
      category: "Release",
      subtasks: [
        { title: "Run regression suite" },
        { title: "Draft release notes" },
        { title: "Verify staging deploy" },
      ],
    },
    {
      title: "Respond to security questionnaire",
      description: "Vendor needs answers by end of week.",
      priority: "HIGH",
      status: "TODO",
      dueDate: dueMidWeek,
      category: "Compliance",
    },
    {
      title: "Renew TLS certificates",
      description: "Wildcard cert expiring soon.",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: overdueDue,
      category: "Ops",
    },
    {
      title: "Backfill analytics events",
      description: "Historical import for Q1 dashboards.",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: overdueDue,
      category: "Data",
    },
    {
      title: "Write onboarding doc for API",
      description: "Cover auth headers, rate limits, and examples.",
      priority: "LOW",
      status: "TODO",
      dueDate: dueLaterWeek,
      category: "Docs",
      subtasks: [{ title: "Outline sections" }, { title: "Add curl examples" }],
    },
    {
      title: "Fix flaky integration test",
      description: "Timeout in CI on notifications worker.",
      priority: "MEDIUM",
      status: "IN_PROGRESS",
      dueDate: dueMidWeek,
      category: "Engineering",
    },
    {
      title: "Plan sprint goals",
      description: "Lightweight planning for next iteration.",
      priority: "LOW",
      status: "DONE",
      dueDate: doneDuePast,
      category: "Planning",
    },
    {
      title: "Archive old feature flags",
      description: "Remove dead flags from config service.",
      priority: "LOW",
      status: "DONE",
      dueDate: doneDuePast,
      category: "Cleanup",
    },
    {
      title: "Customer follow-up: Acme Corp",
      description: "They asked about roadmap and SLA.",
      priority: "HIGH",
      status: "TODO",
      dueDate: dueToday,
      category: "Sales",
    },
    {
      title: "Refactor task repository filters",
      description: "Keep Prisma filters composable and tested.",
      priority: "MEDIUM",
      status: "TODO",
      dueDate: startTodayPlusDays(1),
      category: "Engineering",
    },
    {
      title: "Schedule design review",
      description: "New settings layout for task manager.",
      priority: "LOW",
      status: "TODO",
      dueDate: null,
      category: "Design",
    },
    {
      title: "Investigate slow list endpoint",
      description: "P95 elevated under load tests.",
      priority: "HIGH",
      status: "IN_PROGRESS",
      dueDate: overdueDue,
      category: "Performance",
    },
  ];

  for (const t of tasks) {
    const { subtasks, ...taskData } = t;
    await prisma.task.create({
      data: {
        ...taskData,
        ...(subtasks?.length
          ? {
              subtasks: {
                create: subtasks.map((s) => ({
                  title: s.title,
                  completed: s.completed ?? false,
                })),
              },
            }
          : {}),
      },
    });
  }

  console.log(`Seeded ${tasks.length} tasks with varied due dates, statuses, priorities, and subtasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
