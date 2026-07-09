export type TaskStatus = "backlog" | "in-progress" | "in-review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface MockTask {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  labels: string[];
  createdAt: string;
}

const STATUSES: TaskStatus[] = ["backlog", "in-progress", "in-review", "done"];
const PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const LABEL_POOL = ["bug", "feature", "docs", "chore"];

export function createSeedTasks(count = 32): MockTask[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index + 1),
    title: `任务 ${String(index + 1).padStart(2, "0")}：优化第 ${index + 1} 项工作流`,
    status: STATUSES[index % STATUSES.length],
    priority: PRIORITIES[index % PRIORITIES.length],
    assigneeId: String((index % 43) + 1),
    labels: [LABEL_POOL[index % LABEL_POOL.length]],
    createdAt: new Date(Date.UTC(2026, 0, 1 + index)).toISOString(),
  }));
}
