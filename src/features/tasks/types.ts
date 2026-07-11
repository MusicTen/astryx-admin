export type TaskStatus = "backlog" | "in-progress" | "in-review" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string;
  labels: string[];
  createdAt: string;
}

export type TaskInput = Omit<Task, "id" | "createdAt">;
