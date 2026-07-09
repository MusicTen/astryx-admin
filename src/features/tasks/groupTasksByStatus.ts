import type { Task, TaskStatus } from "./types";

export const TASK_STATUSES: TaskStatus[] = ["backlog", "in-progress", "in-review", "done"];

export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  const groups = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, [] as Task[]]),
  ) as Record<TaskStatus, Task[]>;
  for (const task of tasks) {
    groups[task.status].push(task);
  }
  return groups;
}
